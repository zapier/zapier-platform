'use strict';

const {
  arr,
  assignmentStatement,
  awaitStatement,
  block,
  comment,
  exportStatement,
  fatArrowReturnFunctionDeclaration,
  file,
  functionDeclaration,
  ifStatement,
  interpLiteral,
  obj,
  objProperty,
  RESPONSE_VAR,
  returnStatement,
  strLiteral,
  variableAssignmentDeclaration,
  zRequest,
  zResponseErr,
} = require('./codegen');

const standardArgs = ['z', 'bundle'];
const beforeMiddlewareArgs = ['request', ...standardArgs];
const afterMiddlewareArgs = [RESPONSE_VAR, ...standardArgs];

// used for both oauth1 and oauth2
const getOauthAccessTokenFuncName = 'getAccessToken';
const refreshOath2AccessTokenFuncName = 'refreshAccessToken';

const authJsonUrl = (path) =>
  `https://auth-json-server.zapier-staging.com/${path}`;

const authFileExport = (
  authType,
  authDescription,
  {
    beforeFuncNames = [],
    afterFuncNames = [],
    extraConfigProps = [],
    connectionLabel = strLiteral('{{json.username}}'),
    test = objProperty('test'),
    authFields = [],
  } = {},
) => {
  return exportStatement(
    obj(
      objProperty(
        'config',
        obj(
          comment(authDescription),
          objProperty('type', strLiteral(authType)),
          ...extraConfigProps,
          comment(
            "Define any input app's auth requires here. The user will be prompted to enter this info when they connect their account.",
          ),
          objProperty('fields', arr(...authFields)),
          comment(
            "The test method allows Zapier to verify that the credentials a user provides are valid. We'll execute this method whenever a user connects their account for the first time.",
          ),
          test,
          comment(
            `This template string can access all the data returned from the auth test. If you return the test object, you'll access the returned data with a label like \`{{json.X}}\`. If you return \`response.data\` from your test, then your label can be \`{{X}}\`. This can also be a function that returns a label. That function has the standard args \`(${standardArgs.join(
              ', ',
            )})\` and data returned from the test can be accessed in \`bundle.inputData.X\`.`,
          ),
          objProperty('connectionLabel', connectionLabel),
        ),
      ),
      objProperty('befores', arr(...beforeFuncNames)),
      objProperty('afters', arr(...afterFuncNames)),
    ),
  );
};

const authTestFunc = (testUrl = strLiteral(authJsonUrl('me'))) =>
  block(
    comment(
      'You want to make a request to an endpoint that is either specifically designed to test auth, or one that every user will have access to. eg: `/me`.',
    ),
    comment(
      'By returning the entire request object, you have access to the request and response data for testing purposes. Your connection label can access any data from the returned response using the `json.` prefix. eg: `{{json.username}}`.',
    ),
    fatArrowReturnFunctionDeclaration('test', standardArgs, zRequest(testUrl)),
  );

const handleBadResponsesFunc = (
  funcName,
  invalidInfo = 'username and/or password',
) =>
  afterMiddlewareFunc(
    funcName,
    ifStatement(
      'response.status === 401',
      zResponseErr(strLiteral(`The ${invalidInfo} you supplied is incorrect`)),
    ),
    returnStatement(RESPONSE_VAR),
  );

const basicAuthFile = () => {
  const badFuncName = 'handleBadResponses';
  return file(
    authTestFunc(),
    handleBadResponsesFunc(badFuncName),
    authFileExport(
      'basic',
      '"basic" auth automatically creates "username" and "password" input fields. It also registers default middleware to create the authentication header.',
      { afterFuncNames: [badFuncName] },
    ),
  );
};

/**
 * boilerplate for a "before" middleware. No need to return the requst at the end
 */
const beforeMiddlewareFunc = (funcName, ...statements) =>
  block(
    comment(
      "This function runs before every outbound request. You can have as many as you need. They'll need to each be registered in your index.js file.",
    ),
    functionDeclaration(
      funcName,
      { args: beforeMiddlewareArgs },
      ...statements,
      // auto include the return if it's not here already
      statements[statements.length - 1].includes('return')
        ? ''
        : returnStatement('request'),
    ),
  );

const afterMiddlewareFunc = (funcName, ...statements) =>
  block(
    comment(
      "This function runs after every outbound request. You can use it to check for errors or modify the response. You can have as many as you need. They'll need to each be registered in your index.js file.",
    ),
    functionDeclaration(funcName, { args: afterMiddlewareArgs }, ...statements),
  );

const includeBearerFunc = (funcName) =>
  beforeMiddlewareFunc(
    funcName,
    ifStatement(
      'bundle.authData.access_token',
      assignmentStatement(
        'request.headers.Authorization',
        // eslint-disable-next-line no-template-curly-in-string
        interpLiteral('Bearer ${bundle.authData.access_token}'),
      ),
    ),
  );

const tokenExchangeFunc = (
  funcName,
  requestUrl,
  bodyProps,
  returnProps,
  { requestProps = [], returnComments = [] } = {},
) =>
  functionDeclaration(
    funcName,
    { args: standardArgs, isAsync: true },
    variableAssignmentDeclaration(
      RESPONSE_VAR,
      awaitStatement(
        zRequest(
          strLiteral(requestUrl),
          objProperty('method', strLiteral('POST')),
          objProperty('body', obj(...bodyProps)),
          ...requestProps,
        ),
      ),
    ),
    comment(
      "If you're using core v9.x or older, you should call response.throwForStatus() or verify response.status === 200 before you continue.",
      1,
    ),
    ...returnComments,
    returnStatement(obj(...returnProps)),
  );

const oauth2TokenExchangeFunc = (
  funcName,
  { path, grantType, bodyProps = [], returnComments = [] },
) => {
  return tokenExchangeFunc(
    funcName,
    authJsonUrl(path),
    [
      objProperty('client_id', 'process.env.CLIENT_ID'),
      objProperty('client_secret', 'process.env.CLIENT_SECRET'),
      objProperty('grant_type', strLiteral(grantType)),
      ...bodyProps,
    ],
    [
      objProperty('access_token', 'response.data.access_token'),
      objProperty('refresh_token', 'response.data.refresh_token'),
    ],
    {
      returnComments: [
        comment('This function should return `access_token`.', 1),
        ...returnComments,
      ],
      requestProps: [
        objProperty(
          'headers',
          obj(
            objProperty(
              'content-type',
              strLiteral('application/x-www-form-urlencoded'),
            ),
          ),
        ),
      ],
    },
  );
};

const getAccessTokenFunc = () => {
  return oauth2TokenExchangeFunc(getOauthAccessTokenFuncName, {
    path: 'oauth/access-token',
    bodyProps: [
      objProperty('code', 'bundle.inputData.code'),
      comment(
        `Extra data can be pulled from the querystring. For instance:\n${objProperty(
          'accountDomain',
          'bundle.cleanedRequest.querystring.accountDomain',
        )}`,
      ),
    ],
    grantType: 'authorization_code',
    returnComments: [
      comment(
        'If your app does an app refresh, then `refresh_token` should be returned here as well',
      ),
    ],
  });
};

const refreshTokenFunc = () => {
  return oauth2TokenExchangeFunc(refreshOath2AccessTokenFuncName, {
    path: 'oauth/refresh-token',
    bodyProps: [objProperty('refresh_token', 'bundle.authData.refresh_token')],
    grantType: 'refresh_token',
    returnComments: [
      comment('If the refresh token stays constant, no need to return it.'),
      comment(
        'If the refresh token does change, return it here to update the stored value in Zapier',
      ),
    ],
  });
};

const oauth2AuthFile = () => {
  const bearerFuncName = 'includeBearerToken';
  return file(
    getAccessTokenFunc(),
    refreshTokenFunc(),
    includeBearerFunc(bearerFuncName),
    authTestFunc(),
    authFileExport(
      'oauth2',
      'OAuth2 is a web authentication standard. There are a lot of configuration options that will fit most any situation.',
      {
        beforeFuncNames: [bearerFuncName],
        afterFuncNames: [],
        extraConfigProps: [
          objProperty(
            'oauth2Config',
            obj(
              // TODO: comments
              objProperty(
                'authorizeUrl',
                obj(
                  objProperty(
                    'url',
                    strLiteral(authJsonUrl('oauth/authorize')),
                  ),
                  objProperty(
                    'params',
                    obj(
                      objProperty(
                        'client_id',
                        strLiteral('{{process.env.CLIENT_ID}}'),
                      ),
                      objProperty(
                        'state',
                        strLiteral('{{bundle.inputData.state}}'),
                      ),
                      objProperty(
                        'redirect_uri',
                        strLiteral('{{bundle.inputData.redirect_uri}}'),
                      ),
                      objProperty('response_type', strLiteral('code')),
                    ),
                  ),
                ),
              ),
              objProperty(getOauthAccessTokenFuncName),
              objProperty(refreshOath2AccessTokenFuncName),
              objProperty('autoRefresh', 'true'),
            ),
          ),
        ],
      },
    ),
  );
};
const customAuthFile = () => {
  const includeApiKeyFuncName = 'includeApiKey';
  const handleResponseFuncName = 'handleBadResponses';
  return file(
    authTestFunc(),
    handleBadResponsesFunc(handleResponseFuncName, 'API Key'),
    beforeMiddlewareFunc(
      includeApiKeyFuncName,
      ifStatement(
        'bundle.authData.apiKey',
        comment('Use these lines to include the API key in the querystring'),
        assignmentStatement('request.params', 'request.params || {}'),
        assignmentStatement('request.params.api_key', 'bundle.authData.apiKey'),
        comment(
          'If you want to include the API key in the header instead, uncomment this:',
          1,
        ),
        comment('request.headers.Authorization = bundle.authData.apiKey;'),
      ),
    ),
    authFileExport(
      'custom',
      '"custom" is the catch-all auth type. The user supplies some info and Zapier can make authenticated requests with it',
      {
        beforeFuncNames: [includeApiKeyFuncName],
        afterFuncNames: [handleResponseFuncName],
        authFields: [
          obj(
            objProperty('key', strLiteral('apiKey')),
            objProperty('label', strLiteral('API Key')),
            objProperty('required', 'true'),
          ),
        ],
      },
    ),
  );
};

const digestAuthFile = () => {
  const badFuncName = 'handleBadResponses';
  return file(
    // special digest auth
    authTestFunc(
      strLiteral(
        'https://httpbin.zapier-tooling.com/digest-auth/auth/myuser/mypass',
      ),
    ),
    handleBadResponsesFunc(badFuncName),
    authFileExport(
      'digest',
      '"digest" auth automatically creates "username" and "password" input fields. It also registers default middleware to create the authentication header.',
      { afterFuncNames: [badFuncName] },
    ),
  );
};

const sessionAuthFile = () => {
  const getSessionKeyName = 'getSessionKey';
  const includeSessionKeyName = 'includeSessionKeyHeader';
  return file(
    authTestFunc(),
    tokenExchangeFunc(
      getSessionKeyName,
      'https://httpbin.zapier-tooling.com/post',
      [
        objProperty('username', 'bundle.authData.username'),
        objProperty('password', 'bundle.authData.password'),
      ],
      [
        comment(
          'FIXME: The `|| "secret"` below is just for demo purposes, you should remove it.',
        ),
        objProperty('sessionKey', 'response.data.sessionKey || "secret"'),
      ],
    ),
    beforeMiddlewareFunc(
      includeSessionKeyName,
      ifStatement(
        'bundle.authData.sessionKey',
        assignmentStatement('request.headers', 'request.headers || {}'),
        assignmentStatement(
          "request.headers['X-API-Key']",
          'bundle.authData.sessionKey',
        ),
      ),
    ),
    authFileExport(
      'session',
      '"session" auth exchanges user data for a different session token (that may be periodically refreshed")',
      {
        beforeFuncNames: [includeSessionKeyName],
        afterFuncNames: [],
        authFields: [
          obj(
            objProperty('key', strLiteral('username')),
            objProperty('label', strLiteral('Username')),
            objProperty('required', 'true'),
          ),
          obj(
            objProperty('key', strLiteral('password')),
            objProperty('label', strLiteral('Password')),
            objProperty('required', 'true'),
            comment('this lets the user enter masked data'),
            objProperty('type', strLiteral('password')),
          ),
        ],
        extraConfigProps: [
          objProperty(
            'sessionConfig',
            obj(objProperty('perform', getSessionKeyName)),
          ),
        ],
      },
    ),
  );
};
// just different enough from oauth2 that it gets its own function
const oauth1TokenExchangeFunc = (funcName, url, ...authProperties) => {
  return functionDeclaration(
    funcName,
    { args: standardArgs, isAsync: true },
    variableAssignmentDeclaration(
      RESPONSE_VAR,
      awaitStatement(
        zRequest(
          url,
          objProperty('method', strLiteral('POST')),
          objProperty(
            'auth',
            obj(
              objProperty('oauth_consumer_key', 'process.env.CLIENT_ID'),
              objProperty('oauth_consumer_secret', 'process.env.CLIENT_SECRET'),
              ...authProperties,
            ),
          ),
        ),
      ),
    ),
    returnStatement(`querystring.parse(${RESPONSE_VAR}.content)`),
  );
};
const oauth1AuthFile = () => {
  const requestTokenVarName = 'REQUEST_TOKEN_URL';
  const accessTokenVarName = 'ACCESS_TOKEN_URL';
  const authorizeUrlVarName = 'AUTHORIZE_URL';
  const getRequestTokenFuncName = 'getRequestToken';
  const includeAccessTokenFuncName = 'includeAccessToken';
  return file(
    variableAssignmentDeclaration('querystring', "require('querystring')"),
    block(
      variableAssignmentDeclaration(
        requestTokenVarName,
        strLiteral('https://trello.com/1/OAuthGetRequestToken'),
      ),
      variableAssignmentDeclaration(
        accessTokenVarName,
        strLiteral('https://trello.com/1/OAuthGetAccessToken'),
      ),
      variableAssignmentDeclaration(
        authorizeUrlVarName,
        strLiteral('https://trello.com/1/OAuthAuthorizeToken'),
      ),
    ),
    oauth1TokenExchangeFunc(
      getRequestTokenFuncName,
      requestTokenVarName,
      objProperty('oauth_signature_method', strLiteral('HMAC-SHA1')),
      objProperty('oauth_callback', 'bundle.inputData.redirect_uri'),
      comment("oauth_version: '1.0' // sometimes required"),
    ),
    oauth1TokenExchangeFunc(
      getOauthAccessTokenFuncName,
      accessTokenVarName,
      objProperty('oauth_token', 'bundle.inputData.oauth_token'),
      objProperty('oauth_token_secret', 'bundle.inputData.oauth_token_secret'),
      objProperty('oauth_verifier', 'bundle.inputData.oauth_verifier'),
    ),
    beforeMiddlewareFunc(
      includeAccessTokenFuncName,
      ifStatement(
        'bundle.authData && bundle.authData.oauth_token && bundle.authData.oauth_token_secret',
        comment(
          'Put your OAuth1 credentials in `req.auth`, Zapier will sign the request for you.',
        ),
        assignmentStatement(
          'request.auth',
          obj(
            objProperty('oauth_consumer_key', 'process.env.CLIENT_ID'),
            objProperty('oauth_consumer_secret', 'process.env.CLIENT_SECRET'),
            objProperty('oauth_token', 'bundle.authData.oauth_token'),
            objProperty(
              'oauth_token_secret',
              'bundle.authData.oauth_token_secret',
            ),
            comment("oauth_version: '1.0', // sometimes required"),
            objProperty('...(request.auth || {})'),
          ),
        ),
      ),
    ),
    authTestFunc(strLiteral('https://api.trello.com/1/members/me/')),
    authFileExport('oauth1', 'OAuth1 is an older form of OAuth', {
      beforeFuncNames: [includeAccessTokenFuncName],
      extraConfigProps: [
        objProperty(
          'oauth1Config',
          obj(
            comment(
              "We have to define getRequestToken and getAccessToken functions to explicitly parse the response like it has a form body here, since Trello responds 'text/plain' for the Content-Type header",
            ),
            objProperty(getRequestTokenFuncName),
            objProperty(getOauthAccessTokenFuncName),
            objProperty(
              'authorizeUrl',
              obj(
                objProperty('url', authorizeUrlVarName),
                objProperty(
                  'params',
                  obj(
                    objProperty(
                      'oauth_token',
                      strLiteral('{{bundle.inputData.oauth_token}}'),
                    ),
                    objProperty(
                      'name',
                      strLiteral('Zapier/Trello OAuth1 Test'),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
      connectionLabel: strLiteral('{{username}}'),
    }),
  );
};

module.exports = {
  basic: basicAuthFile,
  custom: customAuthFile,
  digest: digestAuthFile,
  oauth1: oauth1AuthFile,
  oauth2: oauth2AuthFile,
  session: sessionAuthFile,
};
