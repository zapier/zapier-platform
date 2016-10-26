const _ = require('lodash');
const colors = require('colors/safe');

const constants = require('../constants');

const qs = require('querystring');

const AdmZip = require('adm-zip');
const fetch = require('node-fetch');
const path = require('path');

const {
  writeFile,
  readFile,
} = require('./files');

const {
  prettyJSONstringify,
  printStarting,
  printDone,
} = require('./display');


// Reads the JSON file at ~/.zapierrc (AUTH_LOCATION).
const readCredentials = (credentials) => {
  return Promise.resolve(
    credentials ||
    readFile(constants.AUTH_LOCATION, 'Please run `zapier login`.')
      .then((buf) => {
        return JSON.parse(buf.toString());
      })
  );
};

// Calls the underlying platform REST API with proper authentication.
const callAPI = (route, options) => {
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
    .then((_requestOptions) => {
      // requestOptions === _requestOptions side step for linting
      if (options.skipDeployKey) {
        return _requestOptions;
      } else {
        return readCredentials()
          .then((credentials) => {
            _requestOptions.headers['X-Deploy-Key'] = credentials.deployKey;
            return _requestOptions;
          });
      }
    })
    .then((_requestOptions) => {
      return fetch(_requestOptions.url, _requestOptions);
    })
    .then((res) => {
      return Promise.all([
        res,
        res.text()
      ]);
    })
    .then(([res, text]) => {
      let errors;
      const hitError = res.status >= 400;
      if (hitError) {
        try {
          errors = JSON.parse(text).errors.join(', ');
        } catch(err) {
          errors = (text || 'Unknown error').slice(0, 250);
        }
      }

      if (constants.DEBUG || global.argOpts.debug) {
        console.log(`>> ${requestOptions.method} ${requestOptions.url}`);
        if (requestOptions.body) { console.log(`>> ${requestOptions.body}`); }
        console.log(`<< ${res.status}`);
        console.log(`<< ${(text || '').substring(0, 2500)}\n`);
      } else if (hitError) {
        printDone(false);
      }

      if (hitError) {
        throw new Error(`"${requestOptions.url}" returned "${res.status}" saying "${errors}"`);
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

// Reads the JSON file at ~/.zapier-platform (AUTH_LOCATION).
const getLinkedAppConfig = (appDir) => {
  appDir = appDir || '.';

  const file = path.resolve(appDir, constants.CURRENT_APP_FILE);
  return readFile(file)
    .then((buf) => {
      return JSON.parse(buf.toString()).id;
    });
};

const writeLinkedAppConfig = (app, appDir) => {
  const file = appDir ?
        path.resolve(appDir, constants.CURRENT_APP_FILE) :
        constants.CURRENT_APP_FILE;

  return writeFile(file, prettyJSONstringify({
    id: app.id,
    key: app.key
  }));
};

// Loads the linked app from the API.
const getLinkedApp = (appDir) => {
  return getLinkedAppConfig(appDir)
    .then((appId) => {
      if (!appId) {
        return {};
      }
      return callAPI('/apps/' + appId);
    })
    .catch(() => {
      throw new Error(`Warning! ${constants.CURRENT_APP_FILE} seems to be incorrect. Try running \`zapier link\` or \`zapier register\`.`);
    });
};

const checkCredentials = () => {
  return callAPI('/check');
};

const listApps = () => {
  return checkCredentials()
    .then(() => {
      return Promise.all([
        getLinkedApp()
          .catch(() => {
            return undefined;
          }),
        callAPI('/apps')
      ]);
    })
    .then((values) => {
      const [linkedApp, data] = values;
      return {
        app: linkedApp,
        apps: data.objects.map((app) => {
          app.linked = (linkedApp && app.id === linkedApp.id) ? colors.green('✔') : '';
          return app;
        })
      };
    });
};

const listEndoint = (endpoint, keyOverride) => {
  return checkCredentials()
    .then(() => getLinkedApp())
    .then((app) => {
      return Promise.all([
        app,
        callAPI(`/apps/${app.id}/${endpoint}`)
      ]);
    })
    .then(([app, results]) => {
      const out = {app};
      out[keyOverride || endpoint] = results.objects;
      _.assign(out, _.omit(results, 'objects'));
      return out;
    });
};

const listVersions = () => {
  return listEndoint('versions');
};

const listHistory = () => {
  return listEndoint('history');
};

const listInvitees = () => {
  return listEndoint('invitees');
};

const listLogs = (opts) => {
  return listEndoint(`logs?${qs.stringify(opts)}`, 'logs');
};

const listEnv = (version) => {
  let endpoint;
  if (version) {
    endpoint = `versions/${version}/environment`;
  } else {
    endpoint = 'environment';
  }
  return listEndoint(endpoint, 'environment');
};

const upload = (zipPath, appDir) => {
  zipPath = zipPath || constants.BUILD_PATH;
  const fullZipPath = path.resolve(appDir, zipPath);

  return getLinkedApp(appDir)
    .then((app) => {
      const zip = new AdmZip(fullZipPath);
      const definitionJson = zip.readAsText('definition.json');
      if (!definitionJson) {
        throw new Error('definition.json in the zip was missing!');
      }
      const definition = JSON.parse(definitionJson);

      printStarting('Uploading version ' + definition.version);
      return callAPI(`/apps/${app.id}/versions/${definition.version}`, {
        method: 'PUT',
        body: {
          zip_file: zip.toBuffer().toString('base64')
        }
      });
    })
    .then(() => {
      printDone();
    });
};

module.exports = {
  readCredentials,
  callAPI,
  createCredentials,
  writeLinkedAppConfig,
  getLinkedApp,
  checkCredentials,
  listApps,
  listEndoint,
  listVersions,
  listHistory,
  listInvitees,
  listLogs,
  listEnv,
  upload,
};
