const _ = require('lodash');
const colors = require('colors/safe');
const qs = require('querystring');
const fetch = require('node-fetch');
const {
  AUTH_KEY,
  AUTH_LOCATION,
  ENDPOINT,
  DEBUG,
  CURRENT_APP_FILE
} = require('../constants');
const { readLinkedAppConfig } = require('./config');
const { readFile } = require('./files');
const { localAppCommand } = require('./local');

/**
 * Reads the JSON file at `~/.zapierrc` (AUTH_LOCATION).
 */
const readCredentials = (explodeIfMissing = true) => {
  if (process.env.ZAPIER_DEPLOY_KEY) {
    return Promise.resolve({
      [AUTH_KEY]: process.env.ZAPIER_DEPLOY_KEY
    });
  } else {
    return Promise.resolve(
      readFile(AUTH_LOCATION, 'Please run `zapier login`.')
        .then(buf => {
          return JSON.parse(buf.toString());
        })
        .catch(err => {
          if (explodeIfMissing) {
            throw err;
          } else {
            return {};
          }
        })
    );
  }
};

// Calls the underlying platform REST API with proper authentication.
const callAPI = (route, options, rawError = false) => {
  options = options || {};
  const url = options.url || ENDPOINT + route;

  let requestOptions = {
    method: options.method || 'GET',
    url,
    body: options.body ? JSON.stringify(options.body) : null,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json; charset=utf-8',
      'X-Requested-With': 'XMLHttpRequest'
    }
  };
  return Promise.resolve(requestOptions)
    .then(_requestOptions => {
      // requestOptions === _requestOptions side step for linting
      if (options.skipDeployKey) {
        return _requestOptions;
      } else {
        return readCredentials().then(credentials => {
          _requestOptions.headers['X-Deploy-Key'] = credentials[AUTH_KEY];
          return _requestOptions;
        });
      }
    })
    .then(_requestOptions => {
      return fetch(_requestOptions.url, _requestOptions);
    })
    .then(res => {
      return Promise.all([res, res.text()]);
    })
    .then(([res, text]) => {
      let errors;
      const hitError = res.status >= 400;
      if (hitError) {
        try {
          errors = JSON.parse(text).errors.join(', ');
        } catch (err) {
          errors = (text || 'Unknown error').slice(0, 250);
        }
      }

      // TODO: pull this into the command? to easily access debug opt
      // or we do better at using regular node debug lib
      if (DEBUG || global.argOpts.debug) {
        console.log(`>> ${requestOptions.method} ${requestOptions.url}`);
        if (requestOptions.body) {
          const replacementStr = 'raw zip removed in logs';
          let cleanedBody = _.assign({}, JSON.parse(requestOptions.body), {
            zip_file: replacementStr,
            source_zip_file: replacementStr
          });
          console.log(`>> ${JSON.stringify(cleanedBody)}`);
        }
        console.log(`<< ${res.status}`);
        console.log(`<< ${(text || '').substring(0, 2500)}\n`);
      }

      if (hitError) {
        const niceMessage = `"${requestOptions.url}" returned "${res.status}" saying "${errors}"`;

        if (rawError) {
          res.text = text;
          res.json = JSON.parse(text);
          res.errText = niceMessage;
          return Promise.reject(res);
        } else {
          throw new Error(niceMessage);
        }
      }

      return JSON.parse(text);
    });
};

// Given a valid username and password - create a new deploy key.
const createCredentials = (username, password, totpCode) => {
  return callAPI(
    '/keys',
    {
      skipDeployKey: true,
      method: 'POST',
      body: {
        username,
        password,
        totp_code: totpCode
      }
    },
    // if totp is empty, we want a raw request so we can supress an error. If it's here, we want it to be "non-raw"
    !totpCode
  );
};

// Loads the linked app from the API.
const getLinkedApp = appDir => {
  return readLinkedAppConfig(appDir)
    .then(app => {
      if (!app) {
        return {};
      }
      return callAPI('/apps/' + app.id);
    })
    .catch(() => {
      throw new Error(
        `Warning! ${CURRENT_APP_FILE} seems to be incorrect. Try running \`zapier link\` or \`zapier register\`.`
      );
    });
};

// Loads the linked app version from the API
const getVersionInfo = () => {
  return Promise.all([
    getLinkedApp(),
    localAppCommand({ command: 'definition' })
  ]).then(([app, definition]) => {
    return callAPI(`/apps/${app.id}/versions/${definition.version}`);
  });
};

const checkCredentials = () => {
  return callAPI('/check');
};

const listApps = () => {
  return checkCredentials()
    .then(() => {
      return Promise.all([
        getLinkedApp().catch(() => {
          return undefined;
        }),
        callAPI('/apps')
      ]);
    })
    .then(values => {
      const [linkedApp, data] = values;
      return {
        app: linkedApp,
        apps: data.objects.map(app => {
          app.linked =
            linkedApp && app.id === linkedApp.id ? colors.green('✔') : '';
          return app;
        })
      };
    });
};

const listEndpoint = (endpoint, keyOverride) => {
  return checkCredentials()
    .then(() => getLinkedApp())
    .then(app => {
      return Promise.all([app, callAPI(`/apps/${app.id}/${endpoint}`)]);
    })
    .then(([app, results]) => {
      const out = { app };
      out[keyOverride || endpoint] = results.objects;
      _.assign(out, _.omit(results, 'objects'));
      return out;
    });
};

const listVersions = () => {
  return listEndpoint('versions');
};

const listHistory = () => {
  return listEndpoint('history');
};

const listInvitees = () => {
  return listEndpoint('invitees');
};

const listLogs = opts => {
  return listEndpoint(`logs?${qs.stringify(_.omit(opts, 'debug'))}`, 'logs');
};

const listEnv = version => {
  let endpoint;
  if (version) {
    endpoint = `versions/${version}/environment`;
  } else {
    endpoint = 'environment';
  }
  return listEndpoint(endpoint, 'environment');
};

module.exports = {
  callAPI,
  checkCredentials,
  createCredentials,
  getLinkedApp,
  getVersionInfo,
  listApps,
  listEndpoint,
  listEnv,
  listHistory,
  listInvitees,
  listLogs,
  listVersions,
  readCredentials
};
