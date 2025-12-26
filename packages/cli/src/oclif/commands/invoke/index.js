// TODO: modularize
// - prompters
// - timezone
// - field type resolvers
// - ...
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const http = require('node:http');

const _ = require('lodash');
const { Args, Flags } = require('@oclif/core');
const debug = require('debug')('zapier:invoke');
const dotenv = require('dotenv');

const BaseCommand = require('../../ZapierBaseCommand');
const { buildFlags } = require('../../buildFlags');
const { localAppCommand } = require('../../../utils/local');
const { startSpinner, endSpinner } = require('../../../utils/display');
const {
  getLinkedAppConfig,
  listAuthentications,
  readCredentials,
} = require('../../../utils/api');
const { AUTH_KEY } = require('../../../constants');
const resolveInputDataTypes = require('./input-types');

const ACTION_TYPE_PLURALS = {
  trigger: 'triggers',
  search: 'searches',
  create: 'creates',
};

const ACTION_TYPES = ['auth', ...Object.keys(ACTION_TYPE_PLURALS)];

const AUTH_FIELD_ENV_PREFIX = 'authData_';

const loadAuthDataFromEnv = () => {
  return Object.entries(process.env)
    .filter(([k, v]) => k.startsWith(AUTH_FIELD_ENV_PREFIX))
    .reduce((authData, [k, v]) => {
      const fieldKey = k.substr(AUTH_FIELD_ENV_PREFIX.length);
      // Try to parse as JSON if it looks like JSON, otherwise keep as string
      try {
        authData[fieldKey] =
          v.startsWith('{') || v.startsWith('[') ? JSON.parse(v) : v;
      } catch (e) {
        // If JSON parsing fails, keep as string
        authData[fieldKey] = v;
      }
      return authData;
    }, {});
};

const readStream = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return chunks.join('');
};

const getMissingRequiredInputFields = (inputData, inputFields) => {
  return inputFields.filter(
    (f) => f.required && !f.default && !inputData[f.key],
  );
};

const appendEnv = async (vars, prefix = '') => {
  const envFile = '.env';
  let content = Object.entries(vars)
    .filter(([k, v]) => v !== undefined)
    .map(
      ([k, v]) =>
        `${prefix}${k}='${typeof v === 'object' && v !== null ? JSON.stringify(v) : v || ''}'\n`,
    )
    .join('');

  // Check if .env file exists and doesn't end with newline
  try {
    const existingContent = await fs.readFile(envFile, 'utf8');
    if (existingContent.length > 0 && !existingContent.endsWith('\n')) {
      content = '\n' + content;
    }
  } catch (error) {
    // File doesn't exist or can't be read, proceed as normal
  }

  await fs.appendFile(envFile, content);
};

const replaceDoubleCurlies = async (request) => {
  // Use lcurly-fieldName-rcurly instead of {{fieldName}} to bypass node-fetch's
  // URL validation in case the variable is used in a URL.
  if (request.url) {
    request.url = request.url
      .replaceAll('{{', 'lcurly-')
      .replaceAll('}}', '-rcurly');
  }

  // The authorization header may confuse zapier.com and it's relay's job to add
  // it, so we delete it here.
  delete request.headers.authorization;
  delete request.headers.Authorization;

  return request;
};

const restoreDoubleCurlies = async (response) => {
  if (response.url) {
    response.url = response.url
      .replaceAll('lcurly-', '{{')
      .replaceAll('-rcurly', '}}');
  }
  if (response.request?.url) {
    response.request.url = response.request.url
      .replaceAll('lcurly-', '{{')
      .replaceAll('-rcurly', '}}');
  }
  return response;
};

const localAppCommandWithRelayErrorHandler = async (args) => {
  if (args.relayAuthenticationId) {
    args = {
      ...args,
      beforeRequest: [replaceDoubleCurlies],
      afterResponse: [restoreDoubleCurlies],
    };
  }

  let output;
  try {
    output = await localAppCommand(args);
  } catch (outerError) {
    if (outerError.name === 'ResponseError') {
      let response;
      try {
        response = JSON.parse(outerError.message);
      } catch (innerError) {
        throw outerError;
      }
      if (typeof response.content === 'string') {
        const match = response.content.match(/domain filter `([^`]+)`/);
        if (!match) {
          throw outerError;
        }
        const domainFilter = match[1];
        const requestUrl = response.request.url
          .replaceAll('lcurly-', '{{')
          .replaceAll('-rcurly', '}}');
        throw new Error(
          `Request to ${requestUrl} was blocked. ` +
            `Only these domain names are allowed: ${domainFilter}. ` +
            'Contact Zapier team to verify your domain filter setting.',
        );
      }
    }
    throw outerError;
  }
  return output;
};

const testAuth = async (context) => {
  startSpinner('Invoking authentication.test');
  const result = await localAppCommandWithRelayErrorHandler({
    command: 'execute',
    method: 'authentication.test',
    bundle: {
      authData: context.authData,
      meta: {
        ...context.meta,
        isTestingAuth: true,
      },
    },
    zcacheTestObj: context.zcacheTestObj,
    customLogger,
    calledFromCliInvoke: true,
    appId: context.appId,
    deployKey: context.deployKey,
    relayAuthenticationId: context.authId,
  });
  endSpinner();
  return result;
};

const getAuthLabel = async (context) => {
  const testResult = await testAuth(context);
  const labelTemplate = (
    context.appDefinition.authentication.connectionLabel ?? ''
  ).replaceAll('__', '.');
  const tpl = _.template(labelTemplate, { interpolate: /{{([\s\S]+?)}}/g });
  return tpl({
    ...testResult,
    bundle: { authData: context.authData, inputData: testResult },
  });
};

const getLabelForDynamicDropdown = (obj, preferredKey, fallbackKey) => {
  const keys = [
    'name',
    'Name',
    'display',
    'Display',
    'title',
    'Title',
    'subject',
    'Subject',
  ];
  if (preferredKey) {
    keys.unshift(preferredKey.split('__'));
  }
  if (fallbackKey) {
    keys.push(fallbackKey.split('__'));
  }
  for (const key of keys) {
    const label = _.get(obj, key);
    if (label) {
      return label;
    }
  }
  return '';
};

const findNonStringPrimitives = (data, path = 'inputData') => {
  if (typeof data === 'number' || typeof data === 'boolean' || data === null) {
    return [{ path, value: data }];
  } else if (typeof data === 'string') {
    return [];
  } else if (Array.isArray(data)) {
    const paths = [];
    for (let i = 0; i < data.length; i++) {
      paths.push(...findNonStringPrimitives(data[i], `${path}[${i}]`));
    }
    return paths;
  } else if (_.isPlainObject(data)) {
    const paths = [];
    for (const [k, v] of Object.entries(data)) {
      paths.push(...findNonStringPrimitives(v, `${path}.${k}`));
    }
    return paths;
  } else {
    throw new Error('Unexpected data type');
  }
};

const customLogger = (message, data) => {
  debug(message);
  debug(data);
};

const formatFieldDisplay = (field) => {
  const ftype = field.type || 'string';
  let result;
  if (field.label) {
    result = `${field.label} | ${field.key} | ${ftype}`;
  } else {
    result = `${field.key} | ${ftype}`;
  }
  if (field.required) {
    result += ' | required';
  }
  return result;
};

class InvokeCommand extends BaseCommand {
  async promptForAuthFields(authFields) {
    const authData = {};
    for (const field of authFields) {
      if (field.computed) {
        continue;
      }
      const message = formatFieldDisplay(field) + ':';
      let value;
      if (field.type === 'password') {
        value = await this.promptHidden(message, true);
      } else {
        value = await this.prompt(message, { useStderr: true });
      }
      authData[field.key] = value;
    }
    return authData;
  }

  async startBasicAuth(context) {
    if (context.nonInteractive) {
      throw new Error(
        'The `auth start` subcommand for "basic" authentication type only works in interactive mode.',
      );
    }
    return this.promptForAuthFields([
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
  }

  async startCustomAuth(context) {
    if (context.nonInteractive) {
      throw new Error(
        'The `auth start` subcommand for "custom" authentication type only works in interactive mode.',
      );
    }
    return this.promptForAuthFields(
      context.appDefinition.authentication.fields,
    );
  }

  async startOAuth2(context) {
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
      env.CLIENT_ID = await this.prompt('CLIENT_ID:', { useStderr: true });
      process.env.CLIENT_ID = env.CLIENT_ID;
    }
    if (!process.env.CLIENT_SECRET) {
      env.CLIENT_SECRET = await this.prompt('CLIENT_SECRET:', {
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
      const code = new URL(req.url, context.redirectUri).searchParams.get(
        'code',
      );
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
    startSpinner(
      'Opening browser to authorize (press Ctrl-C to exit on error)',
    );

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
  }

  async startSessionAuth(context) {
    if (context.nonInteractive) {
      throw new Error(
        'The `auth start` subcommand for "session" authentication type only works in interactive mode.',
      );
    }
    const authData = await this.promptForAuthFields(
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
  }

  async startAuth(context) {
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
        return this.startBasicAuth(context);
      case 'custom':
        return this.startCustomAuth(context);
      case 'oauth2':
        return this.startOAuth2(context);
      case 'session':
        return this.startSessionAuth(context);
      default:
        // TODO: Add support for 'digest' and 'oauth1'
        throw new Error(
          `This command doesn't support authentication type "${authentication.type}".`,
        );
    }
  }

  async refreshOAuth2(context) {
    startSpinner('Invoking authentication.oauth2Config.refreshAccessToken');

    const newAuthData = await localAppCommand({
      command: 'execute',
      method: 'authentication.oauth2Config.refreshAccessToken',
      bundle: {
        authData: context.authData,
      },
      zcacheTestObj: context.zcacheTestObj,
      customLogger,
      calledFromCliInvoke: true,
    });

    endSpinner();
    return newAuthData;
  }

  async refreshSessionAuth(context) {
    startSpinner('Invoking authentication.sessionConfig.perform');

    const sessionData = await localAppCommand({
      command: 'execute',
      method: 'authentication.sessionConfig.perform',
      bundle: {
        authData: context.authData,
      },
      zcacheTestObj: context.zcacheTestObj,
      customLogger,
      calledFromCliInvoke: true,
    });

    endSpinner();
    return sessionData;
  }

  async refreshAuth(context) {
    const authentication = context.appDefinition.authentication;
    if (!authentication) {
      console.warn(
        "Your integration doesn't seem to need authentication. " +
          "If that isn't true, the app definition should have " +
          'an `authentication` object at the root level.',
      );
      return null;
    }
    if (_.isEmpty(context.authData)) {
      throw new Error(
        'No auth data found in the .env file. Run `zapier invoke auth start` first to initialize the auth data.',
      );
    }
    switch (authentication.type) {
      case 'oauth2':
        return this.refreshOAuth2(context);
      case 'session':
        return this.refreshSessionAuth(context);
      default:
        throw new Error(
          `This command doesn't support refreshing authentication type "${authentication.type}".`,
        );
    }
  }

  async promptForField(context, field) {
    const message = formatFieldDisplay(field) + ':';
    if (field.dynamic) {
      // Dyanmic dropdown
      const [triggerKey, idField, labelField] = field.dynamic.split('.');
      const trigger = context.appDefinition.triggers[triggerKey];
      if (!trigger) {
        throw new Error(
          `Cannot find trigger "${triggerKey}" for dynamic dropdown of field "${field.key}".`,
        );
      }
      const newContext = {
        ...context,
        actionType: 'trigger',
        actionKey: triggerKey,
        actionTypePlural: 'triggers',
        meta: {
          ...context.meta,
          isFillingDynamicDropdown: true,
        },
      };
      const choices = await this.invokeAction(newContext);
      return this.promptWithList(
        message,
        choices.map((c) => {
          const id = c[idField] ?? 'null';
          const label = getLabelForDynamicDropdown(c, labelField, idField);
          return {
            name: `${label} (${id})`,
            value: id,
          };
        }),
        { useStderr: true },
      );
    } else if (field.type === 'boolean') {
      const yes = await this.confirm(message, false, !field.required, true);
      return yes ? 'yes' : 'no';
    } else {
      return this.prompt(message, { useStderr: true });
    }
  }

  async promptOrErrorForRequiredInputFields(context, inputFields) {
    const missingFields = getMissingRequiredInputFields(
      context.inputData,
      inputFields,
    );
    if (missingFields.length) {
      if (context.nonInteractive || context.meta.isFillingDynamicDropdown) {
        throw new Error(
          "You're in non-interactive mode, so you must at least specify these required fields with --inputData: \n" +
            missingFields.map((f) => '* ' + formatFieldDisplay(f)).join('\n'),
        );
      }
      for (const f of missingFields) {
        context.inputData[f.key] = await this.promptForField(context, f);
      }
    }
  }

  async promptForInputFieldEdit(context, inputFields) {
    inputFields = inputFields.filter((f) => f.key);
    if (!inputFields.length) {
      return;
    }

    // Let user select which field to fill/edit
    while (true) {
      let fieldChoices = inputFields.map((f) => {
        let name;
        if (f.label) {
          name = `${f.label} (${f.key})`;
        } else {
          name = f.key;
        }
        if (context.inputData[f.key]) {
          name += ` [current: "${context.inputData[f.key]}"]`;
        } else if (f.default) {
          name += ` [default: "${f.default}"]`;
        }
        return {
          name,
          value: f.key,
        };
      });
      fieldChoices = [
        {
          name: '>>> DONE <<<',
          short: 'DONE',
          value: null,
        },
        ...fieldChoices,
      ];
      const fieldKey = await this.promptWithList(
        'Would you like to edit any of these input fields? Select "DONE" when you are all set.',
        fieldChoices,
        { useStderr: true },
      );
      if (!fieldKey) {
        break;
      }

      const field = inputFields.find((f) => f.key === fieldKey);
      context.inputData[fieldKey] = await this.promptForField(context, field);
    }
  }

  async promptForFields(context, inputFields) {
    await this.promptOrErrorForRequiredInputFields(context, inputFields);
    if (!context.nonInteractive && !context.meta.isFillingDynamicDropdown) {
      await this.promptForInputFieldEdit(context, inputFields);
    }
  }

  async invokeAction(context) {
    // Do these in order:
    // 1. Prompt for static input fields that alter dynamic fields
    // 2. {actionTypePlural}.{actionKey}.operation.inputFields
    // 3. Prompt for input fields again
    // 4. {actionTypePlural}.{actionKey}.operation.perform
    const action =
      context.appDefinition[context.actionTypePlural][context.actionKey];
    const staticInputFields = (action.operation.inputFields || []).filter(
      (f) => f.key,
    );
    debug('staticInputFields:', staticInputFields);

    await this.promptForFields(context, staticInputFields);

    let methodName = `${context.actionTypePlural}.${action.key}.operation.inputFields`;
    startSpinner(`Invoking ${methodName}`);

    const inputFields = await localAppCommandWithRelayErrorHandler({
      command: 'execute',
      method: methodName,
      bundle: {
        inputData: context.inputData,
        inputDataRaw: context.inputData, // At this point, inputData hasn't been transformed yet
        authData: context.authData,
        meta: context.meta,
      },
      zcacheTestObj: context.zcacheTestObj,
      cursorTestObj: context.cursorTestObj,
      customLogger,
      calledFromCliInvoke: true,
      appId: context.appId,
      deployKey: context.deployKey,
      relayAuthenticationId: context.authId,
    });
    endSpinner();

    debug('inputFields:', inputFields);

    if (inputFields.length !== staticInputFields.length) {
      await this.promptForFields(context, inputFields);
    }

    // Preserve original inputData as inputDataRaw before type resolution
    const inputDataRaw = { ...context.inputData };
    const inputData = resolveInputDataTypes(
      context.inputData,
      inputFields,
      context.timezone,
    );
    methodName = `${context.actionTypePlural}.${action.key}.operation.perform`;

    startSpinner(`Invoking ${methodName}`);
    const output = await localAppCommandWithRelayErrorHandler({
      command: 'execute',
      method: methodName,
      bundle: {
        inputData,
        inputDataRaw,
        authData: context.authData,
        meta: context.meta,
      },
      zcacheTestObj: context.zcacheTestObj,
      cursorTestObj: context.cursorTestObj,
      customLogger,
      calledFromCliInvoke: true,
      appId: context.appId,
      deployKey: context.deployKey,
      relayAuthenticationId: context.authId,
    });
    endSpinner();

    return output;
  }

  async promptForAuthentication() {
    const auths = (await listAuthentications()).authentications;
    if (!auths || auths.length === 0) {
      throw new Error(
        'No authentications/connections found for your integration. ' +
          'Add a new connection at https://zapier.com/app/assets/connections ' +
          'or use local auth data by removing the `--authentication-id` flag.',
      );
    }
    const authChoices = auths.map((auth) => ({
      name: `${auth.title} | ${auth.app_version} | ID: ${auth.id}`,
      value: auth.id,
    }));
    return this.promptWithList(
      'Which authentication/connection would you like to use?',
      authChoices,
      { useStderr: true },
    );
  }

  async perform() {
    // Execution context that will be passed around
    const context = {
      // Data directly from command args and flags
      authId: this.flags['authentication-id'],
      nonInteractive: this.flags['non-interactive'] || !process.stdin.isTTY,
      actionType: this.args.actionType,
      actionKey: this.args.actionKey,
      timezone: this.flags.timezone,
      redirectUri: this.flags['redirect-uri'],
      port: this.flags['local-port'],
      meta: {
        isLoadingSample: this.flags.isLoadingSample,
        isFillingDynamicDropdown: this.flags.isFillingDynamicDropdown,
        isPopulatingDedupe: this.flags.isPopulatingDedupe,
        limit: this.flags.limit,
        page: this.flags.page,
        paging_token: this.flags['paging-token'],
        isTestingAuth: false, // legacy property
      },

      // Data to be filled later
      actionTypePlural: null,
      appDefinition: null,
      authData: {},
      appId: null,
      deployKey: null,
      inputData: null,

      // These will be used to patch z.cache() and z.cursor()
      zcacheTestObj: {},
      cursorTestObj: {},
    };

    const dotenvResult = dotenv.config({ override: true, quiet: true });
    if (!context.authId && _.isEmpty(dotenvResult.parsed)) {
      console.warn(
        'The .env file does not exist or is empty. ' +
          'You may need to set some environment variables in there if your code uses process.env.',
      );
    }

    if (!context.actionType) {
      if (context.nonInteractive) {
        throw new Error(
          'You must specify ACTIONTYPE and ACTIONKEY in non-interactive mode.',
        );
      }
      context.actionType = await this.promptWithList(
        'Which action type would you like to invoke?',
        ACTION_TYPES,
        { useStderr: true },
      );
    }

    context.actionTypePlural = ACTION_TYPE_PLURALS[context.actionType];
    context.appDefinition = await localAppCommand({ command: 'definition' });

    if (!context.actionKey) {
      if (context.nonInteractive) {
        throw new Error('You must specify ACTIONKEY in non-interactive mode.');
      }
      if (context.actionType === 'auth') {
        const actionKeys = ['label', 'refresh', 'start', 'test'];
        context.actionKey = await this.promptWithList(
          'Which auth operation would you like to invoke?',
          actionKeys,
          { useStderr: true },
        );
      } else {
        const actionKeys = Object.keys(
          context.appDefinition[context.actionTypePlural] || {},
        ).sort();
        if (!actionKeys.length) {
          throw new Error(
            `No "${context.actionTypePlural}" found in your integration.`,
          );
        }

        context.actionKey = await this.promptWithList(
          `Which "${context.actionType}" key would you like to invoke?`,
          actionKeys,
          { useStderr: true },
        );
      }
    }

    context.appId = (await getLinkedAppConfig(null, false))?.id;
    context.deployKey = (await readCredentials(false))[AUTH_KEY];

    if (context.authId === '-' || context.authId === '') {
      if (context.nonInteractive) {
        throw new Error(
          "You cannot specify '-' or an empty string for `--authentication-id` in non-interactive mode.",
        );
      }
      context.authId = (await this.promptForAuthentication()).toString();
    }

    if (context.authId) {
      // Fill authData with curlies if we're in relay mode
      const authFields = context.appDefinition.authentication.fields || [];
      for (const field of authFields) {
        if (field.key) {
          context.authData[field.key] = `{{${field.key}}}`;
        }
      }
    }

    // Load from .env as well even in relay mode, in case the integration code
    // assumes there are values in bundle.authData. Loading from .env at least
    // gives the developer an option to override the values in bundle.authData.
    context.authData = { ...context.authData, ...loadAuthDataFromEnv() };

    if (context.actionType === 'auth') {
      switch (context.actionKey) {
        case 'start': {
          if (context.authId) {
            throw new Error(
              'The `--authentication-id` flag is not applicable. ' +
                'The `auth start` subcommand is to initialize local auth data in the .env file, ' +
                'whereas `--authentication-id` is for proxying requests using production auth data.',
            );
          }
          const newAuthData = await this.startAuth(context);
          if (_.isEmpty(newAuthData)) {
            return;
          }
          await appendEnv(newAuthData, AUTH_FIELD_ENV_PREFIX);
          console.warn(
            'Auth data appended to .env file. Run `zapier invoke auth test` to test it.',
          );
          return;
        }
        case 'refresh': {
          if (context.authId) {
            throw new Error(
              'The `--authentication-id` flag is not applicable. ' +
                'The `auth refresh` subcommand can only refresh your local auth data in the .env file. ' +
                'You might want to run `auth test` instead, which tests and may refresh auth data with the specified authentication ID in production.',
            );
          }
          const newAuthData = await this.refreshAuth(context);
          if (_.isEmpty(newAuthData)) {
            return;
          }
          await appendEnv(newAuthData, AUTH_FIELD_ENV_PREFIX);
          console.warn(
            'Auth data has been refreshed and appended to .env file. Run `zapier invoke auth test` to test it.',
          );
          return;
        }
        case 'test': {
          const output = await testAuth(context);
          console.log(JSON.stringify(output, null, 2));
          return;
        }
        case 'label': {
          const labelTemplate =
            context.appDefinition.authentication.connectionLabel;
          if (labelTemplate && labelTemplate.startsWith('$func$')) {
            console.warn(
              'Function-based connection label is not supported yet. Printing auth test result instead.',
            );
            const output = await testAuth(context);
            console.log(JSON.stringify(output, null, 2));
          } else {
            const output = await getAuthLabel(context);
            if (output) {
              console.log(output);
            } else {
              console.warn('Connection label is empty.');
            }
          }
          return;
        }
        default:
          throw new Error(
            `Unknown auth operation "${context.actionKey}". ` +
              'The options are "label", "refresh", "start", and "test". \n',
          );
      }
    } else {
      const action =
        context.appDefinition[context.actionTypePlural][context.actionKey];
      if (!action) {
        throw new Error(
          `No "${context.actionType}" found with key "${context.actionKey}".`,
        );
      }

      debug('Action type:', context.actionType);
      debug('Action key:', context.actionKey);
      debug('Action label:', action.display.label);

      let { inputData } = this.flags;
      if (inputData) {
        if (inputData.startsWith('@')) {
          const filePath = inputData.substr(1);
          let inputStream;
          if (filePath === '-') {
            inputStream = process.stdin;
          } else {
            const fd = await fs.open(filePath);
            inputStream = fd.createReadStream({ encoding: 'utf8' });
          }
          inputData = await readStream(inputStream);
        }
        context.inputData = JSON.parse(inputData);
      } else {
        context.inputData = {};
      }

      // inputData should only contain strings
      const nonStringPrimitives = findNonStringPrimitives(context.inputData);
      if (nonStringPrimitives.length) {
        throw new Error(
          'All primitive values in --inputData must be strings. Found non-string values in these paths:\n' +
            nonStringPrimitives
              .map(({ path, value }) => `* ${value} at ${path}`)
              .join('\n'),
        );
      }

      const output = await this.invokeAction(context);
      console.log(JSON.stringify(output, null, 2));
    }
  }
}

InvokeCommand.flags = buildFlags({
  commandFlags: {
    inputData: Flags.string({
      char: 'i',
      description:
        'The input data to pass to the action. Must be a JSON-encoded object. The data can be passed from the command directly like \'{"key": "value"}\', read from a file like @file.json, or read from stdin like @-.',
    }),
    isFillingDynamicDropdown: Flags.boolean({
      description:
        'Set bundle.meta.isFillingDynamicDropdown to true. Only makes sense for a polling trigger. When true in production, this poll is being used to populate a dynamic dropdown.',
      default: false,
    }),
    isLoadingSample: Flags.boolean({
      description:
        'Set bundle.meta.isLoadingSample to true. When true in production, this run is initiated by the user in the Zap editor trying to pull a sample.',
      default: false,
    }),
    isPopulatingDedupe: Flags.boolean({
      description:
        'Set bundle.meta.isPopulatingDedupe to true. Only makes sense for a polling trigger. When true in production, the results of this poll will be used initialize the deduplication list rather than trigger a Zap. This happens when a user enables a Zap.',
      default: false,
    }),
    limit: Flags.integer({
      description:
        'Set bundle.meta.limit. Only makes sense for a trigger. When used in production, this indicates the number of items you should fetch. -1 means no limit.',
      default: -1,
    }),
    page: Flags.integer({
      char: 'p',
      description:
        'Set bundle.meta.page. Only makes sense for a trigger. When used in production, this indicates which page of items you should fetch. First page is 0.',
      default: 0,
    }),
    'non-interactive': Flags.boolean({
      description: 'Do not show interactive prompts.',
      default: false,
    }),
    timezone: Flags.string({
      char: 'z',
      description:
        'Set the default timezone for datetime field interpretation. If not set, defaults to America/Chicago, which matches Zapier production behavior. Find the list timezone names at https://en.wikipedia.org/wiki/List_of_tz_database_time_zones.',
      default: 'America/Chicago',
    }),
    'redirect-uri': Flags.string({
      description:
        "Only used by `auth start` subcommand. The redirect URI that will be passed to the OAuth2 authorization URL. Usually this should match the one configured in your server's OAuth2 application settings. A local HTTP server will be started to listen for the OAuth2 callback. If your server requires a non-localhost or HTTPS address for the redirect URI, you can set up port forwarding to route the non-localhost or HTTPS address to localhost.",
      default: 'http://localhost:9000',
    }),
    'local-port': Flags.integer({
      description:
        'Only used by `auth start` subcommand. The local port that will be used to start the local HTTP server to listen for the OAuth2 callback. This port can be different from the one in the redirect URI if you have port forwarding set up.',
      default: 9000,
    }),
    'authentication-id': Flags.string({
      char: 'a',
      description:
        'EXPERIMENTAL: Instead of using the local .env file, use the production authentication data with the given authentication ID (aka the "app connection" on Zapier). Find them at https://zapier.com/app/assets/connections (https://zpr.io/z8SjFTdnTFZ2 for instructions) or specify \'-\' to interactively select one from your available authentications. When specified, the code will still run locally, but all outgoing requests will be proxied through Zapier with the production auth data.',
    }),
    'paging-token': Flags.string({
      description:
        'Set bundle.meta.paging_token. Used for search pagination or bulk reads. When used in production, this indicates which page of items you should fetch.',
    }),
  },
});

InvokeCommand.args = {
  actionType: Args.string({
    description: 'The action type you want to invoke.',
    options: ACTION_TYPES,
  }),
  actionKey: Args.string({
    description:
      'The trigger/action key you want to invoke. If ACTIONTYPE is "auth", this can be "label", "refresh", "start", or "test".',
  }),
};

InvokeCommand.examples = [
  'zapier invoke',
  'zapier invoke auth start',
  'zapier invoke auth refresh',
  'zapier invoke auth test',
  'zapier invoke auth label',
  'zapier invoke trigger new_recipe',
  `zapier invoke create add_recipe --inputData '{"title": "Pancakes"}'`,
  'zapier invoke search find_recipe -i @file.json --non-interactive',
  'cat file.json | zapier invoke trigger new_recipe -i @-',
  'zapier invoke search find_ticket --authentication-id 12345',
  'zapier invoke create add_ticket -a -',
];
InvokeCommand.description = `Invoke an auth operation, a trigger, or a create/search action locally.

This command emulates how Zapier production environment would invoke your integration. It runs code locally, so you can use this command to quickly test your integration without deploying it to Zapier. This is especially useful for debugging and development.

Why use this command?

* Fast feedback loop: Write code and run this command to verify if it works immediately
* Step-by-step debugging: Running locally means you can use a debugger to step through your code
* Untruncated logs: View complete logs and errors in your terminal

### Authentication

You can supply the authentcation data in two ways: Load from the local \`.env\` file or use the (experimental) \`--authentication-id\` flag.

#### The local \`.env\` file

This command loads environment variables and \`authData\` from the \`.env\` file in the current directory. If you don't have a \`.env\` file yet, you can use the \`zapier invoke auth start\` command to help you initialize it, or you can manually create it.

The \`zapier invoke auth start\` subcommand will prompt you for the necessary auth fields and save them to the \`.env\` file. For OAuth2, it will start a local HTTP server, open the authorization URL in the browser, wait for the OAuth2 redirect, and get the access token.

Each line in the \`.env\` file should follow one of these formats:

* \`VAR_NAME=VALUE\` for environment variables
* \`authData_FIELD_KEY=VALUE\` for auth data fields

For example, a \`.env\` file for an OAuth2 integration might look like this:

\`\`\`
CLIENT_ID='your_client_id'
CLIENT_SECRET='your_client_secret'
authData_access_token='1234567890'
authData_refresh_token='abcdefg'
authData_account_name='zapier'
\`\`\`


#### The \`--authentication-id\` flag (EXPERIMENTAL)

Setting up local auth data can be troublesome. You'd have to configure your app server to allow localhost redirect URIs or use a port forwarding tool. This is sometimes not easy to get right.

The \`--authentication-id\` flag (\`-a\` for short) gives you an alternative (and perhaps easier) way to supply your auth data. You can use \`-a\` to specify an existing production authentication/connection. The available authentications can be found at https://zapier.com/app/assets/connections. Check https://zpr.io/z8SjFTdnTFZ2 for more instructions.

When \`-a -\` is specified, such as \`zapier invoke auth test -a -\`, the command will interactively prompt you to select one of your available authentications.

If you know your authentication ID, you can specify it directly, such as \`zapier invoke auth test -a 123456\`.

#### Testing authentication

To test if the auth data is correct, run either one of these:

\`\`\`
zapier invoke auth test   # invokes authentication.test method
zapier invoke auth label  # invokes authentication.test and renders connection label
\`\`\`

To refresh stale auth data for OAuth2 or session auth, run \`zapier invoke auth refresh\`. Note that refreshing is only applicable for local auth data in the \`.env\` file.

### Invoking a trigger or an action

Once you have the correct auth data, you can test an trigger, a search, or a create action. For example, here's how you invoke a trigger with the key \`new_recipe\`:

\`\`\`
zapier invoke trigger new_recipe
\`\`\`

To add input data, use the \`--inputData\` flag (\`-i\` for short). The input data can come from the command directly, a file, or stdin. See **EXAMPLES** below.

When you miss any command arguments, such as ACTIONTYPE or ACTIONKEY, the command will prompt you interactively. If you don't want to get interactive prompts, use the \`--non-interactive\` flag.

The \`--debug\` flag will show you the HTTP request logs and any console logs you have in your code.

### Limitations

The following is a non-exhaustive list of current limitations and may be supported in the future:

- Hook triggers, including REST hook subscribe/unsubscribe
- Line items
- Output hydration
- File upload
- Dynamic dropdown pagination
- Function-based connection label
- Buffered create actions
- Search-or-create actions
- Search-powered fields
- Field choices
- autoRefresh for OAuth2 and session auth
`;

module.exports = InvokeCommand;
