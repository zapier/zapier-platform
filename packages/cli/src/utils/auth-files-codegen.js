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
  fileTS,
  functionDeclaration,
  ifStatement,
  interpLiteral,
  obj,
  objTS,
  objProperty,
  RESPONSE_VAR,
  returnStatement,
  strLiteral,
  variableAssignmentDeclaration,
  zRequest,
  zResponseErr,
} = require('./codegen');

const standardArgs = (language) =>
  language === 'typescript'
    ? ['z: ZObject', 'bundle: Bundle']
    : ['z', 'bundle'];
const standardTypes = ['ZObject', 'Bundle', 'Authentication'];
const beforeMiddlewareArgs = (language) => [
  'request',
  ...standardArgs(language),
];
const afterMiddlewareArgs = (language) => [
  RESPONSE_VAR,
  ...standardArgs(language),
];

// used for both oauth1 and oauth2
const getOauthAccessTokenFuncName = 'getAccessToken';
const refreshOath2AccessTokenFuncName = 'refreshAccessToken';

const authJsonUrl = (path) =>
  `https://auth-json-server.zapier-staging.com/${path}`;

const authFileExport = (
  language,
  authType,
  authDescription,
  {
    extraConfigProps = [],
    connectionLabel = strLiteral('{{json.username}}'),
    test = objProperty('test'),
    authFields = [],
  } = {},
) => {
  const configProps = [
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
      `This template string can access all the data returned from the auth test. If you return the test object, you'll access the returned data with a label like \`{{json.X}}\`. If you return \`response.data\` from your test, then your label can be \`{{X}}\`. This can also be a function that returns a label. That function has the standard args \`(${standardArgs(
        language,
      ).join(
        ', ',
      )})\` and data returned from the test can be accessed in \`bundle.inputData.X\`.`,
    ),
    objProperty('connectionLabel', connectionLabel),
  ];

  const configObj =
    language === 'typescript'
      ? objTS('Authentication', ...configProps)
      : obj(...configProps);

  return exportStatement(configObj);
};

const middlewareFileExport = (
  language,
  { beforeFuncNames = [], afterFuncNames = [] },
) => {
  return exportStatement(
    obj(
      objProperty('befores', arr(...beforeFuncNames)),
      objProperty('afters', arr(...afterFuncNames)),
    ),
    language,
  );
};

const authTestFunc = (language, testUrl = strLiteral(authJsonUrl('me'))) =>
  block(
    comment(
      'You want to make a request to an endpoint that is either specifically designed to test auth, or one that every user will have access to. eg: `/me`.',
    ),
    comment(
      'By returning the entire request object, you have access to the request and response data for testing purposes. Your connection label can access any data from the returned response using the `json.` prefix. eg: `{{json.username}}`.',
    ),
    fatArrowReturnFunctionDeclaration(
      'test',
      standardArgs(language),
      zRequest(testUrl),
    ),
  );

const handleBadResponsesFunc = (
  funcName,
  language,
  invalidInfo = 'username and/or password',
) =>
  afterMiddlewareFunc(
    funcName,
    language,
    ifStatement(
      'response.status === 401',
      zResponseErr(strLiteral(`The ${invalidInfo} you supplied is incorrect`)),
    ),
    returnStatement(RESPONSE_VAR),
  );

const basicAuthFile = (language) => {
  const fileInput = [
    authTestFunc(language),
    authFileExport(
      language,
      'basic',
      '"basic" auth automatically creates "username" and "password" input fields. It also registers default middleware to create the authentication header.',
    ),
  ];
  return language === 'typescript'
    ? fileTS(standardTypes, ...fileInput)
    : file(...fileInput);
};

const basicMiddlewareFile = (language) => {
  const badFuncName = 'handleBadResponses';
  const fileInput = [
    handleBadResponsesFunc(badFuncName, language),
    middlewareFileExport(language, {
      beforeFuncNames: [],
      afterFuncNames: [badFuncName],
    }),
  ];
  return language === 'typescript'
    ? fileTS(standardTypes, ...fileInput)
    : file(...fileInput);
};

const basicFiles = (language) => {
  return {
    middleware: basicMiddlewareFile(language),
    authentication: basicAuthFile(language),
  };
};

/**
 * boilerplate for a "before" middleware. No need to return the requst at the end
 */
const beforeMiddlewareFunc = (funcName, language, ...statements) =>
  block(
    comment(
      "This function runs before every outbound request. You can have as many as you need. They'll need to each be registered in your index.js file.",
    ),
    functionDeclaration(
      funcName,
      { args: beforeMiddlewareArgs(language) },
      ...statements,
      // auto include the return if it's not here already
      statements[statements.length - 1].includes('return')
        ? ''
        : returnStatement('request'),
    ),
  );

const afterMiddlewareFunc = (funcName, language, ...statements) =>
  block(
    comment(
      "This function runs after every outbound request. You can use it to check for errors or modify the response. You can have as many as you need. They'll need to each be registered in your index.js file.",
    ),
    functionDeclaration(
      funcName,
      { args: afterMiddlewareArgs(language) },
      ...statements,
    ),
  );

const includeBearerFunc = (funcName, language) =>
  beforeMiddlewareFunc(
    funcName,
    language,
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
  language,
  requestUrl,
  bodyProps,
  returnProps,
  { requestProps = [], returnComments = [] } = {},
) =>
  functionDeclaration(
    funcName,
    { args: standardArgs(language), isAsync: true },
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
  language,
  { path, grantType, bodyProps = [], returnComments = [] },
) => {
  return tokenExchangeFunc(
    funcName,
    language,
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

const getAccessTokenFunc = (language) => {
  return oauth2TokenExchangeFunc(getOauthAccessTokenFuncName, language, {
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
    language,
  });
};

const refreshTokenFunc = (language) => {
  return oauth2TokenExchangeFunc(refreshOath2AccessTokenFuncName, language, {
    path: 'oauth/refresh-token',
    bodyProps: [objProperty('refresh_token', 'bundle.authData.refresh_token')],
    grantType: 'refresh_token',
    returnComments: [
      comment('If the refresh token stays constant, no need to return it.'),
      comment(
        'If the refresh token does change, return it here to update the stored value in Zapier',
      ),
    ],
    language,
  });
};

const oauth2AuthFile = (language) => {
  const fileInput = [
    getAccessTokenFunc(language),
    refreshTokenFunc(language),
    authTestFunc(language),
    authFileExport(
      language,
      'oauth2',
      'OAuth2 is a web authentication standard. There are a lot of configuration options that will fit most any situation.',
      {
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
  ];
  // TODO determine if we need to import AuthenticationOAuth2Config
  return language === 'typescript'
    ? fileTS(standardTypes, ...fileInput)
    : file(...fileInput);
};

const oauth2MiddlewareFile = (language) => {
  const bearerFuncName = 'includeBearerToken';
  const fileInput = [
    includeBearerFunc(bearerFuncName, language),
    middlewareFileExport(language, {
      beforeFuncNames: [bearerFuncName],
      afterFuncNames: [],
    }),
  ];
  return language === 'typescript'
    ? fileTS(standardTypes, ...fileInput)
    : file(...fileInput);
};

const oauth2Files = (language) => {
  return {
    middleware: oauth2MiddlewareFile(language),
    authentication: oauth2AuthFile(language),
  };
};

const customAuthFile = (language) => {
  const fileInput = [
    authTestFunc(language),
    authFileExport(
      language,
      'custom',
      '"custom" is the catch-all auth type. The user supplies some info and Zapier can make authenticated requests with it',
      {
        authFields: [
          obj(
            objProperty('key', strLiteral('apiKey')),
            objProperty('label', strLiteral('API Key')),
            objProperty('required', 'true'),
          ),
        ],
      },
    ),
  ];
  return language === 'typescript'
    ? fileTS(standardTypes, ...fileInput)
    : file(...fileInput);
};

const customMiddlewareFile = (language) => {
  const includeApiKeyFuncName = 'includeApiKey';
  const handleResponseFuncName = 'handleBadResponses';
  const fileInput = [
    handleBadResponsesFunc(handleResponseFuncName, language, 'API Key'),
    beforeMiddlewareFunc(
      includeApiKeyFuncName,
      language,
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
    middlewareFileExport(language, {
      beforeFuncNames: [includeApiKeyFuncName],
      afterFuncNames: [handleResponseFuncName],
    }),
  ];
  return language === 'typescript'
    ? fileTS(standardTypes, ...fileInput)
    : file(...fileInput);
};

const customFiles = (language) => {
  return {
    middleware: customMiddlewareFile(language),
    authentication: customAuthFile(language),
  };
};

const digestAuthFile = (language) => {
  const fileInput = [
    // special digest auth
    authTestFunc(
      language,
      strLiteral(
        'https://httpbin.zapier-tooling.com/digest-auth/auth/myuser/mypass',
      ),
    ),
    authFileExport(
      language,
      'digest',
      '"digest" auth automatically creates "username" and "password" input fields. It also registers default middleware to create the authentication header.',
    ),
  ];
  return language === 'typescript'
    ? fileTS(standardTypes, ...fileInput)
    : file(...fileInput);
};

const digestMiddlewareFile = (language) => {
  const badFuncName = 'handleBadResponses';
  const fileInput = [
    handleBadResponsesFunc(badFuncName, language),
    middlewareFileExport(language, {
      beforeFuncNames: [],
      afterFuncNames: [badFuncName],
    }),
  ];
  return language === 'typescript'
    ? fileTS(standardTypes, ...fileInput)
    : file(...fileInput);
};

const digestFiles = (language) => {
  return {
    middleware: digestMiddlewareFile(language),
    authentication: digestAuthFile(language),
  };
};

const sessionAuthFile = (language) => {
  const getSessionKeyName = 'getSessionKey';
  const fileInput = [
    authTestFunc(language),
    tokenExchangeFunc(
      getSessionKeyName,
      language,
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
    authFileExport(
      language,
      'session',
      '"session" auth exchanges user data for a different session token (that may be periodically refreshed")',
      {
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
  ];
  return language === 'typescript'
    ? fileTS(standardTypes, ...fileInput)
    : file(...fileInput);
};

const sessionMiddlewareFile = (language) => {
  const includeSessionKeyName = 'includeSessionKeyHeader';
  const fileInput = [
    beforeMiddlewareFunc(
      includeSessionKeyName,
      language,
      ifStatement(
        'bundle.authData.sessionKey',
        assignmentStatement('request.headers', 'request.headers || {}'),
        assignmentStatement(
          "request.headers['X-API-Key']",
          'bundle.authData.sessionKey',
        ),
      ),
    ),
    middlewareFileExport(language, {
      beforeFuncNames: [includeSessionKeyName],
      afterFuncNames: [],
    }),
  ];
  return language === 'typescript'
    ? fileTS(standardTypes, ...fileInput)
    : file(...fileInput);
};

const sessionFiles = (language) => {
  return {
    middleware: sessionMiddlewareFile(language),
    authentication: sessionAuthFile(language),
  };
};

// just different enough from oauth2 that it gets its own function
const oauth1TokenExchangeFunc = (
  funcName,
  language,
  url,
  ...authProperties
) => {
  return functionDeclaration(
    funcName,
    { args: standardArgs(language), isAsync: true },
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

const oauth1AuthFile = (language) => {
  const requestTokenVarName = 'REQUEST_TOKEN_URL';
  const accessTokenVarName = 'ACCESS_TOKEN_URL';
  const authorizeUrlVarName = 'AUTHORIZE_URL';
  const getRequestTokenFuncName = 'getRequestToken';
  const fileInput = [
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
      language,
      requestTokenVarName,
      objProperty('oauth_signature_method', strLiteral('HMAC-SHA1')),
      objProperty('oauth_callback', 'bundle.inputData.redirect_uri'),
      comment("oauth_version: '1.0' // sometimes required"),
    ),
    oauth1TokenExchangeFunc(
      getOauthAccessTokenFuncName,
      language,
      accessTokenVarName,
      objProperty('oauth_token', 'bundle.inputData.oauth_token'),
      objProperty('oauth_token_secret', 'bundle.inputData.oauth_token_secret'),
      objProperty('oauth_verifier', 'bundle.inputData.oauth_verifier'),
    ),
    authTestFunc(language, strLiteral('https://api.trello.com/1/members/me/')),
    authFileExport(language, 'oauth1', 'OAuth1 is an older form of OAuth', {
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
  ];
  return language === 'typescript'
    ? fileTS(standardTypes, ...fileInput)
    : file(...fileInput);
};

const oauth1MiddlewareFile = (language) => {
  const includeAccessTokenFuncName = 'includeAccessToken';
  const fileInput = [
    beforeMiddlewareFunc(
      includeAccessTokenFuncName,
      language,
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
    middlewareFileExport(language, {
      beforeFuncNames: [includeAccessTokenFuncName],
      afterFuncNames: [],
    }),
  ];
  return language === 'typescript'
    ? fileTS(standardTypes, ...fileInput)
    : file(...fileInput);
};

const oauth1Files = (language) => {
  return {
    middleware: oauth1MiddlewareFile(language),
    authentication: oauth1AuthFile(language),
  };
};

module.exports = {
  basic: basicFiles,
  custom: customFiles,
  digest: digestFiles,
  oauth1: oauth1Files,
  oauth2: oauth2Files,
  session: sessionFiles,
};
