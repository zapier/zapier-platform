const crypto = require('node:crypto');
const http = require('node:http');

const _ = require('lodash');
const debug = require('debug')('zapier:invoke');

const { localAppCommand } = require('../../../../utils/local');
const { startSpinner, endSpinner } = require('../../../../utils/display');
const { appendEnv } = require('../env');
const { customLogger } = require('../logger');
const { formatFieldDisplay } = require('../prompts');

/**
 * Prompts the user for authentication field values.
 * Handles password fields with hidden input.
 * @param {import('../../../ZapierBaseCommand')} command - The command instance for prompting
 * @param {Array<Object>} authFields - Array of auth field definitions
 * @returns {Promise<Object>} Object containing field keys and user-provided values
 */
const promptForAuthFields = async (command, authFields) => {
  const authData = {};
  for (const field of authFields) {
    if (field.computed) {
      continue;
    }
    const message = formatFieldDisplay(field) + ':';
    let value;
    if (field.type === 'password') {
      value = await command.promptHidden(message, true);
    } else {
      value = await command.prompt(message, { useStderr: true });
    }
    authData[field.key] = value;
  }
  return authData;
};

/**
 * Initializes basic authentication by prompting for username and password.
 * @param {import('../../../ZapierBaseCommand')} command - The command instance for prompting
 * @param {Object} context - The execution context
 * @returns {Promise<Object>} Auth data with username and password
 * @throws {Error} If in non-interactive mode
 */
const startBasicAuth = async (command, context) => {
  if (context.nonInteractive) {
    throw new Error(
      'The `auth start` subcommand for "basic" authentication type only works in interactive mode.',
    );
  }
  return promptForAuthFields(command, [
    {
      key: 'username',
      label: 'Username',
      required: true,
    },
    {
      key: 'password',
      label: 'Password',
      required: true,
    },
  ]);
};

/**
 * Initializes custom authentication by prompting for configured auth fields.
 * @param {import('../../../ZapierBaseCommand')} command - The command instance for prompting
 * @param {Object} context - The execution context
 * @returns {Promise<Object>} Auth data with field values
 * @throws {Error} If in non-interactive mode
 */
const startCustomAuth = async (command, context) => {
  if (context.nonInteractive) {
    throw new Error(
      'The `auth start` subcommand for "custom" authentication type only works in interactive mode.',
    );
  }
  return promptForAuthFields(
    command,
    context.appDefinition.authentication.fields,
  );
};

/**
 * Initializes OAuth2 authentication.
 * Prompts for CLIENT_ID/SECRET if needed, starts a local HTTP server,
 * opens the browser for authorization, and exchanges the code for tokens.
 * @param {import('../../../ZapierBaseCommand')} command - The command instance for prompting
 * @param {Object} context - The execution context
 * @returns {Promise<Object>} Auth data with access token and other OAuth2 fields
 */
const startOAuth2 = async (command, context) => {
  const env = {};

  if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET) {
    if (context.nonInteractive) {
      throw new Error(
        'CLIENT_ID and CLIENT_SECRET must be set in the .env file in non-interactive mode.',
      );
    } else {
      console.warn(
        'CLIENT_ID and CLIENT_SECRET are required for OAuth2, ' +
          "but they are not found in the .env file. I'll prompt you for them now.",
      );
    }
  }

  if (!process.env.CLIENT_ID) {
    env.CLIENT_ID = await command.prompt('CLIENT_ID:', { useStderr: true });
    process.env.CLIENT_ID = env.CLIENT_ID;
  }
  if (!process.env.CLIENT_SECRET) {
    env.CLIENT_SECRET = await command.prompt('CLIENT_SECRET:', {
      useStderr: true,
    });
    process.env.CLIENT_SECRET = env.CLIENT_SECRET;
  }

  if (!_.isEmpty(env)) {
    // Save envs so the user won't have to re-enter them if the command fails
    await appendEnv(env);
    console.warn('CLIENT_ID and CLIENT_SECRET saved to .env file.');
  }

  startSpinner('Invoking authentication.oauth2Config.authorizeUrl');

  const stateParam = crypto.randomBytes(20).toString('hex');
  let authorizeUrl = await localAppCommand({
    command: 'execute',
    method: 'authentication.oauth2Config.authorizeUrl',
    bundle: {
      inputData: {
        response_type: 'code',
        redirect_uri: context.redirectUri,
        state: stateParam,
      },
    },
    zcacheTestObj: context.zcacheTestObj,
    customLogger,
    calledFromCliInvoke: true,
  });
  if (!authorizeUrl.includes('&scope=')) {
    const scope = context.appDefinition.authentication.oauth2Config.scope;
    if (scope) {
      authorizeUrl += `&scope=${encodeURIComponent(scope)}`;
    }
  }
  debug('authorizeUrl:', authorizeUrl);

  endSpinner();
  startSpinner('Starting local HTTP server');

  let resolveCode;
  const codePromise = new Promise((resolve) => {
    resolveCode = resolve;
  });

  const server = http.createServer((req, res) => {
    // Parse the request URL to extract the query parameters
    const code = new URL(req.url, context.redirectUri).searchParams.get('code');
    if (code) {
      resolveCode(code);
      debug(`Received code '${code}' from ${req.headers.referer}`);

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(
        'Parameter `code` received successfully. Go back to the terminal to continue.',
      );
    } else {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end(
        'Error: Did not receive `code` query parameter. ' +
          'Did you have the right CLIENT_ID and CLIENT_SECRET? ' +
          'Or did your server respond properly?',
      );
    }
  });

  await new Promise((resolve) => {
    server.listen(context.port, resolve);
  });

  endSpinner();
  startSpinner('Opening browser to authorize (press Ctrl-C to exit on error)');

  const { default: open } = await import('open');
  open(authorizeUrl);

  const code = await codePromise;
  endSpinner();

  startSpinner('Closing local HTTP server');
  await new Promise((resolve) => {
    server.close(resolve);
  });
  debug('Local HTTP server closed');

  endSpinner();
  startSpinner('Invoking authentication.oauth2Config.getAccessToken');

  const authData = await localAppCommand({
    command: 'execute',
    method: 'authentication.oauth2Config.getAccessToken',
    bundle: {
      authData: {},
      inputData: {
        code,
        redirect_uri: context.redirectUri,
      },
    },
    zcacheTestObj: context.zcacheTestObj,
    customLogger,
    calledFromCliInvoke: true,
  });

  endSpinner();
  return authData;
};

/**
 * Initializes session authentication.
 * Prompts for auth fields and then calls the session config perform method.
 * @param {import('../../../ZapierBaseCommand')} command - The command instance for prompting
 * @param {Object} context - The execution context
 * @returns {Promise<Object>} Combined auth data and session data
 * @throws {Error} If in non-interactive mode
 */
const startSessionAuth = async (command, context) => {
  if (context.nonInteractive) {
    throw new Error(
      'The `auth start` subcommand for "session" authentication type only works in interactive mode.',
    );
  }
  const authData = await promptForAuthFields(
    command,
    context.appDefinition.authentication.fields,
  );

  startSpinner('Invoking authentication.sessionConfig.perform');
  const sessionData = await localAppCommand({
    command: 'execute',
    method: 'authentication.sessionConfig.perform',
    bundle: {
      authData,
    },
    zcacheTestObj: context.zcacheTestObj,
    customLogger,
    calledFromCliInvoke: true,
  });
  endSpinner();

  return { ...authData, ...sessionData };
};

/**
 * Main entry point for initializing authentication.
 * Routes to the appropriate auth type handler based on the app definition.
 * @param {import('../../../ZapierBaseCommand')} command - The command instance for prompting
 * @param {Object} context - The execution context
 * @returns {Promise<Object|null>} Auth data or null if no authentication needed
 * @throws {Error} If the authentication type is not supported
 */
const startAuth = async (command, context) => {
  const authentication = context.appDefinition.authentication;
  if (!authentication) {
    console.warn(
      "Your integration doesn't seem to need authentication. " +
        "If that isn't true, the app definition should have " +
        'an `authentication` object at the root level.',
    );
    return null;
  }
  switch (authentication.type) {
    case 'basic':
      return startBasicAuth(command, context);
    case 'custom':
      return startCustomAuth(command, context);
    case 'oauth2':
      return startOAuth2(command, context);
    case 'session':
      return startSessionAuth(command, context);
    default:
      // TODO: Add support for 'digest' and 'oauth1'
      throw new Error(
        `This command doesn't support authentication type "${authentication.type}".`,
      );
  }
};

module.exports = { startAuth };
