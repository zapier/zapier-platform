const { resolve } = require('path');
const tmp = require('tmp');

const { startSpinner, endSpinner } = require('./display');
const { copyDir, removeDir, ensureDir } = require('./files');

const { inspect } = require('util');

const initApp = async (path, createFunc) => {
  const appDir = resolve(path);
  const tempAppDir = tmp.tmpNameSync();

  const copyOpts = {
    clobber: false,
    onCopy: file => {
      startSpinner(`Copying ${file}`);
      endSpinner();
    },
    onSkip: file => {
      startSpinner(`File ${file} already exists (skipped)`);
      endSpinner();
    }
  };

  await removeDir(tempAppDir);
  await ensureDir(tempAppDir);
  await createFunc(tempAppDir);
  await ensureDir(appDir);
  await copyDir(tempAppDir, appDir, copyOpts);
  await removeDir(tempAppDir);
};

const testAuth = authType => {
  // todo: oauth1 trello url?
  const testUrl =
    authType === 'digest'
      ? 'https://httpbin.org/digest-auth/auth/myuser/mypass'
      : 'https://auth-json-server.zapier-staging.com/me';

  return `
      const test = (z, bundle) => {
        return z.request({
          url: '${testUrl}',
          ${authType === 'oauth2' ? inspect({}) : ''}
        })
      }
      `.trim();
};

/**
 * given an authType (such as `basic` or `oauth2`, return a string of valid JS code that be saved into an `authentication.js` file
 */
const createAuthFile = authType => {
  // TODO: call prettier on this

  const suppliedItem =
    {
      custom: 'API Key',
      oauth2: 'access token'
    }[authType] || 'username and/or password';

  const output = `
    ${testAuth(authType)}

    const handleBadResponses = (response, z, bundle) => {
      if (response.status === 401) {
        throw new z.errors.Error(
          // This message is surfaced to the user
          'The ${suppliedItem} you supplied is incorrect',
          'AuthenticationError',
          response.status
        );
      }
      return response
    }

    module.exports = {
      config: {
        type: '${authType}',

        // The test method allows Zapier to verify that the credentials a user provides are valid.
        // We'll execute this method whenver a user connects their account for the first time.
        test,

        // this can be a "{{string}}" or a function
        connectionLabel: '{{bundle.inputData.username}}'
      },

      befores: [],
      afters: [ handleBadResponses ]
    }
  `.trim();
  return output;
};

module.exports = {
  initApp,
  createAuthFile
};
