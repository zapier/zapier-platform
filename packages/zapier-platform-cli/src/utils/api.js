const _ = require('lodash');
const colors = require('colors/safe');

const constants = require('../constants');

const qs = require('querystring');

const fs = require('fs');
const AdmZip = require('adm-zip');
const fetch = require('node-fetch');
const path = require('path');

const { writeFile, readFile } = require('./files');

const { prettyJSONstringify, startSpinner, endSpinner } = require('./display');

const { localAppCommand } = require('./local');

// Reads the JSON file at ~/.zapierrc (AUTH_LOCATION).
const readCredentials = (explodeIfMissing = true) => {
  if (process.env.ZAPIER_DEPLOY_KEY) {
    return Promise.resolve({
      [constants.AUTH_KEY]: process.env.ZAPIER_DEPLOY_KEY
    });
  } else {
    return Promise.resolve(
      readFile(constants.AUTH_LOCATION, 'Please run `zapier login`.')
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
  const url = options.url || constants.ENDPOINT + route;

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
          _requestOptions.headers['X-Deploy-Key'] =
            credentials[constants.AUTH_KEY];
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

      if (constants.DEBUG || global.argOpts.debug) {
        console.log(`>> ${requestOptions.method} ${requestOptions.url}`);
        if (requestOptions.body) {
          let cleanedBody = _.assign({}, JSON.parse(requestOptions.body), {
            zip_file: 'raw zip removed in logs'
          });
          console.log(`>> ${JSON.stringify(cleanedBody)}`);
        }
        console.log(`<< ${res.status}`);
        console.log(`<< ${(text || '').substring(0, 2500)}\n`);
      }

      if (hitError) {
        const niceMessage = `"${requestOptions.url}" returned "${
          res.status
        }" saying "${errors}"`;

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
const createCredentials = (username, password) => {
  // TODO: 2fa in the future?
  return callAPI('/keys', {
    skipDeployKey: true,
    method: 'POST',
    body: {
      username,
      password
    }
  });
};

// Reads the JSON file in the app directory.
const getLinkedAppConfig = appDir => {
  appDir = appDir || '.';

  const file = path.resolve(appDir, constants.CURRENT_APP_FILE);
  return readFile(file).then(buf => {
    return JSON.parse(buf.toString());
  });
};

const writeLinkedAppConfig = (app, appDir) => {
  const file = appDir
    ? path.resolve(appDir, constants.CURRENT_APP_FILE)
    : constants.CURRENT_APP_FILE;

  // read contents of existing config before writing
  return (
    readFile(file)
      .then(configBuff => {
        return Promise.resolve(JSON.parse(configBuff.toString()));
      })
      // we want to eat errors about bad json and missing files
      // and ensure the below code is passes a js object
      .catch(() => Promise.resolve({}))
      .then(config => {
        return Object.assign({}, config, { id: app.id, key: app.key });
      })
      .then(updatedConfig =>
        writeFile(file, prettyJSONstringify(updatedConfig))
      )
  );
};

// Loads the linked app from the API.
const getLinkedApp = appDir => {
  return getLinkedAppConfig(appDir)
    .then(app => {
      if (!app) {
        return {};
      }
      return callAPI('/apps/' + app.id);
    })
    .catch(() => {
      throw new Error(
        `Warning! ${
          constants.CURRENT_APP_FILE
        } seems to be incorrect. Try running \`zapier link\` or \`zapier register\`.`
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

const upload = (zipPath, appDir) => {
  zipPath = zipPath || constants.BUILD_PATH;
  const fullZipPath = path.resolve(appDir, zipPath);

  return getLinkedApp(appDir)
    .then(app => {
      const zip = new AdmZip(fullZipPath);
      const definitionJson = zip.readAsText('definition.json');
      if (!definitionJson) {
        throw new Error('definition.json in the zip was missing!');
      }
      const definition = JSON.parse(definitionJson);

      const binaryZip = fs.readFileSync(fullZipPath);
      const buffer = Buffer.from(binaryZip).toString('base64');

      startSpinner(`Uploading version ${definition.version}`);
      return callAPI(`/apps/${app.id}/versions/${definition.version}`, {
        method: 'PUT',
        body: {
          zip_file: buffer
        }
      });
    })
    .then(() => {
      endSpinner();
    });
};

module.exports = {
  callAPI,
  checkCredentials,
  createCredentials,
  getLinkedApp,
  getLinkedAppConfig,
  getVersionInfo,
  listApps,
  listEndpoint,
  listEnv,
  listHistory,
  listInvitees,
  listLogs,
  listVersions,
  readCredentials,
  upload,
  writeLinkedAppConfig
};
