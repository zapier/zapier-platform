const { resolve, join: pjoin } = require('path');
const tmp = require('tmp');

const { startSpinner, endSpinner } = require('./display');
const { copyDir, removeDir, ensureDir, readFileStr } = require('./files');

const { format } = require('prettier');
const { template } = require('lodash');

const {
  obj,
  exportStatement,
  objProperty,
  func,
  zRequest,
  returnStatement,
  arr,
  zResponseErr,
  ifStatement,
  file
} = require('./codegen');

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

const loadTemplate = name =>
  readFileStr(pjoin(__dirname, '..', '..', 'scaffold', `${name}.template.js`));

const testAuth = async authType => {
  const authTestStr = await loadTemplate('authTest');
  const authTestTemplate = template(authTestStr);
  // todo: oauth1 trello url?
  const testUrl =
    authType === 'digest'
      ? 'https://httpbin.org/digest-auth/auth/myuser/mypass'
      : 'https://auth-json-server.zapier-staging.com/me';

  return authTestTemplate({
    testUrl,
    // this has to be a string because we don't want `process.env.CLIENT_ID` evaluated here. But, it needs to be a varaiable when it's spit out in the template
    extraRequestProps:
      authType === 'oauth2'
        ? `
      method: 'POST',
      body: {
        // extra data pulled from the users query string
        accountDomain: bundle.cleanedRequest.querystring.accountDomain,
        code: bundle.inputData.code,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: 'authorization_code'
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
    `.trim()
        : ''
  });
};

/**
 * given an authType (such as `basic` or `oauth2`, return a string of valid JS code that be saved into an `authentication.js` file
 */
const createAuthFileStr = authType => {
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
  return format(output);
};

const createAuthFileTemplates = async authType => {
  const authFileTemplateStr = await loadTemplate('auth');
  const authFileTemplate = template(authFileTemplateStr);

  const suppliedItem =
    {
      custom: 'API Key',
      oauth2: 'access token'
    }[authType] || 'username and/or password';

  const authFileResult = authFileTemplate({
    authType,
    suppliedItem,
    test: await testAuth(authType)
  });

  return format(authFileResult);
};

const createAuthFileComposable = authType => {
  const badFuncName = 'handleBadResponses';
  return format(
    file(
      func(
        'test',
        ['z', 'bundle'],
        returnStatement(
          zRequest('https://auth-json-server.zapier-staging.com/me')
        )
      ),
      func(
        badFuncName,
        ['response', 'z', 'bundle'],
        ifStatement(
          'response.status === 401',
          zResponseErr('The username and/or password you supplied is incorrect')
        ),
        returnStatement('response')
      ),
      exportStatement(
        obj(
          objProperty(
            'config',
            obj(
              objProperty('type', 'basic', true),
              objProperty('test'),
              objProperty(
                'connectionLabel',
                '{{bundle.inputData.username}}',
                true
              )
            )
          ),
          objProperty('afters', arr(badFuncName))
        )
      )
    ),
    { parser: 'babel' }
  );
};

module.exports = {
  initApp,
  createAuthFileStr,
  createAuthFileTemplates,
  createAuthFileComposable
};
