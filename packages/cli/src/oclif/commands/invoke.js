const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const http = require('node:http');

const _ = require('lodash');
const { flags } = require('@oclif/command');
const debug = require('debug')('zapier:invoke');
const dotenv = require('dotenv');

// Datetime related imports
const chrono = require('chrono-node');
const { DateTime, IANAZone } = require('luxon');

const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');
const { localAppCommand, getLocalAppHandler } = require('../../utils/local');
const { startSpinner, endSpinner } = require('../../utils/display');

const ACTION_TYPE_PLURALS = {
  trigger: 'triggers',
  search: 'searches',
  create: 'creates',
};

const ACTION_TYPES = ['auth', ...Object.keys(ACTION_TYPE_PLURALS)];

const AUTH_FIELD_ENV_PREFIX = 'authData_';

const NUMBER_CHARSET = '0123456789.-,';

const FALSE_STRINGS = new Set([
  'noo',
  'no',
  'n',
  'false',
  'nope',
  'f',
  'never',
  'no thanks',
  'no thank you',
  'nul',
  '0',
  'none',
  'nil',
  'nill',
  'null',
]);

const TRUE_STRINGS = new Set([['yes', 'yeah', 'y', 'true', 't', '1']]);

const loadAuthDataFromEnv = () => {
  return Object.entries(process.env)
    .filter(([k, v]) => k.startsWith(AUTH_FIELD_ENV_PREFIX))
    .reduce((authData, [k, v]) => {
      const fieldKey = k.substr(AUTH_FIELD_ENV_PREFIX.length);
      authData[fieldKey] = v;
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
    (f) => f.required && !f.default && !inputData[f.key]
  );
};

const parseDecimal = (s) => {
  const chars = [];
  for (const c of s) {
    if (NUMBER_CHARSET.includes(c)) {
      chars.push(c);
    }
  }
  const cleaned = chars.join('').replace(/[.,-]$/, '');
  return parseFloat(cleaned);
};

const parseInteger = (s) => {
  const n = parseInt(s);
  if (!isNaN(n)) {
    return n;
  }
  return Math.floor(parseDecimal(s));
};

const parseBoolean = (s) => {
  s = s.toLowerCase();
  if (TRUE_STRINGS.has(s)) {
    return true;
  }
  if (FALSE_STRINGS.has(s)) {
    return false;
  }
  return Boolean(s);
};

const parsingCompsToString = (parsingComps) => {
  const yyyy = parsingComps.get('year');
  const mm = String(parsingComps.get('month')).padStart(2, '0');
  const dd = String(parsingComps.get('day')).padStart(2, '0');
  const hh = String(parsingComps.get('hour')).padStart(2, '0');
  const ii = String(parsingComps.get('minute')).padStart(2, '0');
  const ss = String(parsingComps.get('second')).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${ii}:${ss}`;
};

const hasTimeInfo = (parsingComps) => {
  const tags = [...parsingComps.tags()];
  for (const tag of tags) {
    if (tag.includes('ISOFormat') || tag.includes('Time')) {
      return true;
    }
  }
  return false;
};

const maybeImplyTimeInfo = (parsingComps) => {
  if (!hasTimeInfo(parsingComps)) {
    parsingComps.imply('hour', 9);
    parsingComps.imply('minute', 0);
    parsingComps.imply('second', 0);
    parsingComps.imply('millisecond', 0);
  }
  return parsingComps;
};

const parseTimestamp = (dtString, tzName) => {
  const match = dtString.match(/-?\d{10,14}/);
  if (!match) {
    return null;
  }

  dtString = match[0];
  let timestamp = parseInt(dtString);
  if (dtString.length <= 12) {
    timestamp *= 1000;
  }

  return DateTime.fromMillis(timestamp, { zone: tzName }).toFormat(
    "yyyy-MM-dd'T'HH:mm:ssZZ"
  );
};

const parseDatetime = (dtString, tzName, now) => {
  const timestampResult = parseTimestamp(dtString, tzName);
  if (timestampResult) {
    return timestampResult;
  }

  const offset = IANAZone.create(tzName).offset(now.getTime());
  const results = chrono.parse(dtString, {
    instant: now,
    timezone: offset,
  });

  let isoString;
  if (results.length) {
    const parsingComps = results[0].start;
    if (parsingComps.get('timezoneOffset') == null) {
      // No timezone info in the input string => interpret the datetime string
      // exactly as it is and append the timezone
      isoString = parsingCompsToString(maybeImplyTimeInfo(parsingComps));
    } else {
      // Timezone info is present or implied in the input string => convert the
      // datetime to the specified timezone
      isoString = maybeImplyTimeInfo(parsingComps).date().toISOString();
    }
  } else {
    // No datetime info in the input string => just return the current time
    isoString = now.toISOString();
  }

  return DateTime.fromISO(isoString, { zone: tzName }).toFormat(
    "yyyy-MM-dd'T'HH:mm:ssZZ"
  );
};

const resolveInputDataTypes = (inputData, inputFields, timezone) => {
  const fieldsWithDefault = inputFields.filter((f) => f.default);
  for (const f of fieldsWithDefault) {
    if (!inputData[f.key]) {
      inputData[f.key] = f.default;
    }
  }

  const inputFieldsByKey = _.keyBy(inputFields, 'key');
  for (const [k, v] of Object.entries(inputData)) {
    const inputField = inputFieldsByKey[k];
    if (!inputField) {
      continue;
    }

    switch (inputField.type) {
      case 'integer':
        inputData[k] = parseInteger(v);
        break;
      case 'number':
        inputData[k] = parseDecimal(v);
        break;
      case 'boolean':
        inputData[k] = parseBoolean(v);
        break;
      case 'datetime':
        inputData[k] = parseDatetime(v, timezone, new Date());
        break;
      case 'file':
        // TODO: How to handle a file field?
        break;
      // TODO: Handle 'list' and 'dict' types?
      default:
        // No need to do anything with 'string' type
        break;
    }
  }

  // TODO: Handle line items (fields with "children")

  return inputData;
};

const appendEnv = async (vars) => {
  await fs.appendFile(
    '.env',
    Object.entries(vars).map(([k, v]) => `${k}='${v}'\n`)
  );
};

const testAuth = async (authData, meta, zcacheTestObj) => {
  startSpinner('Invoking authentication.test');
  const result = await localAppCommand({
    command: 'execute',
    method: 'authentication.test',
    bundle: {
      authData,
      meta: {
        ...meta,
        isTestingAuth: true,
      },
    },
    zcacheTestObj,
    customLogger,
  });
  endSpinner();
  return result;
};

const getAuthLabel = async (labelTemplate, authData, meta, zcacheTestObj) => {
  const testResult = await testAuth(authData, meta, zcacheTestObj);
  labelTemplate = labelTemplate.replace('__', '.');
  const tpl = _.template(labelTemplate, { interpolate: /{{([\s\S]+?)}}/g });
  return tpl(testResult);
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

const formatInputFieldDisplay = (field) => {
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

const formatAuthFieldDisplay = (field) => {
  let result;
  if (field.label) {
    result = `${field.label} (${field.key})`;
  } else {
    result = field.key;
  }
  return result;
};

class InvokeCommand extends BaseCommand {
  async promptForAuthFields(authFields) {
    const authData = {};
    for (const field of authFields) {
      const message = formatAuthFieldDisplay(field) + ':';
      const value = await this.prompt(message, { useStderr: true });
      authData[field.key] = value;
    }
    return authData;
  }

  async startBasicAuth() {
    return this.promptForAuthFields([
      {
        key: 'username',
        label: 'Username',
      },
      {
        key: 'password',
        label: 'Password',
      },
    ]);
  }

  async startCustomAuth() {}

  async startOAuth2(appDefinition) {
    const redirectUri = this.flags['redirect-uri'];
    let port;
    try {
      port = parseInt(new URL(redirectUri).port);
    } catch (err) {
      throw new Error(
        `Invalid redirect URI '${redirectUri}'. ` +
          "A valid example would be 'http://localhost:8000'."
      );
    }
    port = parseInt(port);
    if (!port) {
      throw new Error(
        `Could not parse port from redirect URI: '${redirectUri}'. ` +
          "A valid example would be 'http://localhost:8000'."
      );
    }

    let env = {};

    if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET) {
      if (this.nonInteractive) {
        throw new Error(
          'CLIENT_ID and CLIENT_SECRET must be set in the .env file in non-interactive mode.'
        );
      } else {
        console.warn(
          'CLIENT_ID and CLIENT_SECRET are required for OAuth2, ' +
            "but they are not found in the .env file. I'll prompt you for them now."
        );
      }
    }

    if (!process.env.CLIENT_ID) {
      env.CLIENT_ID = await this.prompt('CLIENT_ID:');
      process.env.CLIENT_ID = env.CLIENT_ID;
    }
    if (!process.env.CLIENT_SECRET) {
      env.CLIENT_SECRET = await this.prompt('CLIENT_SECRET:');
      process.env.CLIENT_SECRET = env.CLIENT_SECRET;
    }

    if (!_.isEmpty(env)) {
      // process.env changed, so we need to reload the modules that have loaded
      // the old values of process.env
      getLocalAppHandler({ reload: true });

      // Save envs so the user won't have to re-enter them if the command fails
      await appendEnv(env);
      console.warn('CLIENT_ID and CLIENT_SECRET saved to .env file.');
      env = {};
    }

    startSpinner('Invoking authentication.oauth2Config.authorizeUrl');

    const stateParam = crypto.randomBytes(20).toString('hex');
    let authorizeUrl = await localAppCommand({
      command: 'execute',
      method: 'authentication.oauth2Config.authorizeUrl',
      bundle: {
        inputData: {
          response_type: 'code',
          redirect_uri: redirectUri,
          state: stateParam,
        },
      },
    });
    if (!authorizeUrl.includes('&scope=')) {
      const scope = appDefinition.authentication.oauth2Config.scope;
      authorizeUrl += `&scope=${encodeURIComponent(scope)}`;
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
      const code = new URL(req.url, redirectUri).searchParams.get('code');
      if (code) {
        resolveCode(code);
        debug(`Received code '${code}' from ${req.headers.referer}`);

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(
          'Parameter `code` received successfully. Go back to the terminal to continue.'
        );
      } else {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end(
          'Error: Did not receive `code` query parameter. ' +
            'Did you have the right CLIENT_ID and CLIENT_SECRET? ' +
            'Or did your server respond properly?'
        );
      }
    });

    await new Promise((resolve) => {
      server.listen(port, resolve);
    });

    endSpinner();
    startSpinner('Opening browser to authorize');

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
          redirect_uri: redirectUri,
        },
      },
    });

    endSpinner();

    for (const [k, v] of Object.entries(authData)) {
      env[AUTH_FIELD_ENV_PREFIX + k] = v;
    }
    return env;
  }

  async startSessionAuth() {}

  async startAuth(appDefinition) {
    const authentication = appDefinition.authentication;
    if (!authentication) {
      console.warn(
        "Your integration doesn't seem to need authentication. " +
          "If that isn't true, the app definition should have " +
          'an `authentication` object at the root level.'
      );
      return null;
    }
    switch (authentication.type) {
      case 'basic':
        return this.startBasicAuth();
      case 'custom':
        return this.startCustomAuth();
      case 'oauth2':
        return this.startOAuth2(appDefinition);
      case 'session':
        return this.startSessionAuth();
      default:
        // TODO: Add support for 'digest' and 'oauth1'
        throw new Error(
          `This command doesn't support authentication type "${authentication.type}".`
        );
    }
  }

  async promptForField(
    field,
    appDefinition,
    inputData,
    authData,
    timezone,
    zcacheTestObj,
    cursorTestObj
  ) {
    const message = formatInputFieldDisplay(field) + ':';
    if (field.dynamic) {
      // Dyanmic dropdown
      const [triggerKey, idField, labelField] = field.dynamic.split('.');
      const trigger = appDefinition.triggers[triggerKey];
      const meta = {
        isLoadingSample: false,
        isFillingDynamicDropdown: true,
        isPopulatingDedupe: false,
        limit: -1,
        page: 0,
        isTestingAuth: false,
      };
      const choices = await this.invokeAction(
        appDefinition,
        'triggers',
        trigger,
        inputData,
        authData,
        meta,
        timezone,
        zcacheTestObj,
        cursorTestObj
      );
      return this.promptWithList(
        message,
        choices.map((c) => {
          const id = c[idField] || 'null';
          const label = getLabelForDynamicDropdown(c, labelField, idField);
          return {
            name: `${label} (${id})`,
            value: id,
          };
        }),
        { useStderr: true }
      );
    } else if (field.type === 'boolean') {
      const yes = await this.confirm(message, false, !field.required, true);
      return yes ? 'yes' : 'no';
    } else {
      return this.prompt(message, { useStderr: true });
    }
  }

  async promptOrErrorForRequiredInputFields(
    inputData,
    inputFields,
    appDefinition,
    authData,
    meta,
    timezone,
    zcacheTestObj,
    cursorTestObj
  ) {
    const missingFields = getMissingRequiredInputFields(inputData, inputFields);
    if (missingFields.length) {
      if (this.nonInteractive || meta.isFillingDynamicDropdown) {
        throw new Error(
          "You're in non-interactive mode, so you must at least specify these required fields with --inputData: \n" +
            missingFields
              .map((f) => '* ' + formatInputFieldDisplay(f))
              .join('\n')
        );
      }
      for (const f of missingFields) {
        inputData[f.key] = await this.promptForField(
          f,
          appDefinition,
          inputData,
          authData,
          timezone,
          zcacheTestObj,
          cursorTestObj
        );
      }
    }
  }

  async promptForInputFieldEdit(
    inputData,
    inputFields,
    appDefinition,
    authData,
    timezone,
    zcacheTestObj,
    cursorTestObj
  ) {
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
        if (inputData[f.key]) {
          name += ` [current: "${inputData[f.key]}"]`;
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
        { useStderr: true }
      );
      if (!fieldKey) {
        break;
      }

      const field = inputFields.find((f) => f.key === fieldKey);
      inputData[fieldKey] = await this.promptForField(
        field,
        appDefinition,
        inputData,
        authData,
        timezone,
        zcacheTestObj,
        cursorTestObj
      );
    }
  }

  async promptForFields(
    inputData,
    inputFields,
    appDefinition,
    authData,
    meta,
    timezone,
    zcacheTestObj,
    cursorTestObj
  ) {
    await this.promptOrErrorForRequiredInputFields(
      inputData,
      inputFields,
      appDefinition,
      authData,
      meta,
      timezone,
      zcacheTestObj,
      cursorTestObj
    );
    if (!this.nonInteractive && !meta.isFillingDynamicDropdown) {
      await this.promptForInputFieldEdit(
        inputData,
        inputFields,
        appDefinition,
        authData,
        timezone,
        zcacheTestObj,
        cursorTestObj
      );
    }
  }

  async invokeAction(
    appDefinition,
    actionTypePlural,
    action,
    inputData,
    authData,
    meta,
    timezone,
    zcacheTestObj,
    cursorTestObj
  ) {
    // Do these in order:
    // 1. Prompt for static input fields that alter dynamic fields
    // 2. {actionTypePlural}.{actionKey}.operation.inputFields
    // 3. Prompt for input fields again
    // 4. {actionTypePlural}.{actionKey}.operation.perform

    const staticInputFields = (action.operation.inputFields || []).filter(
      (f) => f.key
    );
    debug('staticInputFields:', staticInputFields);

    await this.promptForFields(
      inputData,
      staticInputFields,
      appDefinition,
      authData,
      meta,
      timezone,
      zcacheTestObj,
      cursorTestObj
    );

    let methodName = `${actionTypePlural}.${action.key}.operation.inputFields`;
    startSpinner(`Invoking ${methodName}`);

    const inputFields = await localAppCommand({
      command: 'execute',
      method: methodName,
      bundle: {
        inputData,
        authData,
        meta,
      },
      zcacheTestObj,
      cursorTestObj,
      customLogger,
    });
    endSpinner();

    debug('inputFields:', inputFields);

    if (inputFields.length !== staticInputFields.length) {
      await this.promptForFields(
        inputData,
        inputFields,
        appDefinition,
        authData,
        meta,
        timezone,
        zcacheTestObj,
        cursorTestObj
      );
    }

    inputData = resolveInputDataTypes(inputData, inputFields, timezone);
    methodName = `${actionTypePlural}.${action.key}.operation.perform`;

    startSpinner(`Invoking ${methodName}`);
    const output = await localAppCommand({
      command: 'execute',
      method: methodName,
      bundle: {
        inputData,
        authData,
        meta,
      },
      zcacheTestObj,
      cursorTestObj,
      customLogger,
    });
    endSpinner();

    return output;
  }

  async perform() {
    dotenv.config({ override: true });
    this.nonInteractive = this.flags['non-interactive'] || !process.stdin.isTTY;

    let { actionType, actionKey } = this.args;

    if (!actionType) {
      if (this.nonInteractive) {
        throw new Error(
          'You must specify ACTIONTYPE and ACTIONKEY in non-interactive mode.'
        );
      }
      actionType = await this.promptWithList(
        'Which action type would you like to invoke?',
        ACTION_TYPES,
        { useStderr: true }
      );
    }

    const actionTypePlural = ACTION_TYPE_PLURALS[actionType];
    const appDefinition = await localAppCommand({ command: 'definition' });

    if (!actionKey) {
      if (this.nonInteractive) {
        throw new Error('You must specify ACTIONKEY in non-interactive mode.');
      }
      if (actionType === 'auth') {
        const actionKeys = ['label', 'start', 'test'];
        actionKey = await this.promptWithList(
          'Which auth operation would you like to invoke?',
          actionKeys,
          { useStderr: true }
        );
      } else {
        const actionKeys = Object.keys(
          appDefinition[actionTypePlural] || {}
        ).sort();
        if (!actionKeys.length) {
          throw new Error(
            `No "${actionTypePlural}" found in your integration.`
          );
        }

        actionKey = await this.promptWithList(
          `Which "${actionType}" key would you like to invoke?`,
          actionKeys,
          { useStderr: true }
        );
      }
    }

    const authData = loadAuthDataFromEnv();
    const zcacheTestObj = {};
    const cursorTestObj = {};

    if (actionType === 'auth') {
      const meta = {
        isLoadingSample: false,
        isFillingDynamicDropdown: false,
        isPopulatingDedupe: false,
        limit: -1,
        page: 0,
        isTestingAuth: true,
      };
      switch (actionKey) {
        // TODO: Add 'refresh' command
        case 'start': {
          const env = await this.startAuth(appDefinition);
          if (_.isEmpty(env)) {
            return;
          }
          await appendEnv(env);
          console.warn(
            'Auth data appended to .env file. Run `zapier invoke auth test` to test it.'
          );
          return;
        }
        case 'test': {
          const output = await testAuth(authData, meta, zcacheTestObj);
          console.log(JSON.stringify(output, null, 2));
          return;
        }
        case 'label': {
          const labelTemplate = appDefinition.authentication.connectionLabel;
          if (labelTemplate && labelTemplate.startsWith('$func$')) {
            console.warn(
              'Function-based connection label is not supported yet. Printing auth test result instead.'
            );
            const output = await testAuth(authData, meta, zcacheTestObj);
            console.log(JSON.stringify(output, null, 2));
          } else {
            const output = await getAuthLabel(
              labelTemplate,
              authData,
              meta,
              zcacheTestObj
            );
            if (output) {
              console.log(output);
            } else {
              console.warn('Connection label is empty.');
            }
          }
          return;
        }
        default:
          throw new Error(`Unknown auth operation: ${actionKey}`);
      }
    } else {
      const action = appDefinition[actionTypePlural][actionKey];
      if (!action) {
        throw new Error(`No "${actionType}" found with key "${actionKey}".`);
      }

      debug('Action type:', actionType);
      debug('Action key:', actionKey);
      debug('Action label:', action.display.label);

      let { inputData } = this.flags;
      if (inputData) {
        if (inputData.startsWith('@')) {
          const filePath = inputData.substr(1);
          let inputStream;
          if (filePath === '-') {
            inputStream = process.stdin;
          } else {
            inputStream = fs.createReadStream(filePath, { encoding: 'utf8' });
          }
          inputData = await readStream(inputStream);
        }
        inputData = JSON.parse(inputData);
      } else {
        inputData = {};
      }

      // inputData should only contain strings
      const nonStringPrimitives = findNonStringPrimitives(inputData);
      if (nonStringPrimitives.length) {
        throw new Error(
          'All primitive values in --inputData must be strings. Found non-string values in these paths:\n' +
            nonStringPrimitives
              .map(({ path, value }) => `* ${value} at ${path}`)
              .join('\n')
        );
      }

      const { timezone } = this.flags;
      const meta = {
        isLoadingSample: this.flags.isLoadingSample,
        isFillingDynamicDropdown: this.flags.isFillingDynamicDropdown,
        isPopulatingDedupe: this.flags.isPopulatingDedupe,
        limit: this.flags.limit,
        page: this.flags.page,
        isTestingAuth: false, // legacy property
      };
      const output = await this.invokeAction(
        appDefinition,
        actionTypePlural,
        action,
        inputData,
        authData,
        meta,
        timezone,
        zcacheTestObj,
        cursorTestObj
      );
      console.log(JSON.stringify(output, null, 2));
    }
  }
}

InvokeCommand.flags = buildFlags({
  commandFlags: {
    inputData: flags.string({
      char: 'i',
      description:
        'The input data to pass to the action. Must be a JSON-encoded object. The data can be passed from the command directly like \'{"key": "value"}\', read from a file like @file.json, or read from stdin like @-.',
    }),
    isFillingDynamicDropdown: flags.boolean({
      description:
        'Set bundle.meta.isFillingDynamicDropdown to true. Only makes sense for a polling trigger. When true in production, this poll is being used to populate a dynamic dropdown.',
      default: false,
    }),
    isLoadingSample: flags.boolean({
      description:
        'Set bundle.meta.isLoadingSample to true. When true in production, this run is initiated by the user in the Zap editor trying to pull a sample.',
      default: false,
    }),
    isPopulatingDedupe: flags.boolean({
      description:
        'Set bundle.meta.isPopulatingDedupe to true. Only makes sense for a polling trigger. When true in production, the results of this poll will be used initialize the deduplication list rather than trigger a Zap. This happens when a user enables a Zap.',
      default: false,
    }),
    limit: flags.integer({
      description:
        'Set bundle.meta.limit. Only makes sense for a trigger. When used in production, this indicates the number of items you should fetch. -1 means no limit.',
      default: -1,
    }),
    page: flags.integer({
      char: 'p',
      description:
        'Set bundle.meta.page. Only makes sense for a trigger. When used in production, this indicates which page of items you should fetch. First page is 0.',
      default: 0,
    }),
    'non-interactive': flags.boolean({
      description: 'Do not show interactive prompts.',
      default: false,
    }),
    timezone: flags.string({
      char: 'z',
      description:
        'Set the default timezone for datetime field interpretation. If not set, defaults to America/Chicago, which matches Zapier production behavior. Find the list timezone names at https://en.wikipedia.org/wiki/List_of_tz_database_time_zones.',
      default: 'America/Chicago',
    }),
    'redirect-uri': flags.string({
      description:
        "The redirect URI that will be passed to the OAuth2 authorization URL. Usually this should match the one configured in your server's OAuth2 application settings. A local HTTP server will be started to listen for the OAuth2 callback. If your server requires a non-localhost or HTTPS address for the redirect URI, you can either set up port forwarding to route the non-localhost or HTTPS address to localhost.",
      default: 'http://localhost:9000',
    }),
  },
});

InvokeCommand.args = [
  {
    name: 'actionType',
    description: 'The action type you want to invoke.',
    options: ACTION_TYPES,
  },
  {
    name: 'actionKey',
    description:
      'The trigger/action key you want to invoke. If ACTIONTYPE is "auth", this can be "test" or "label".',
  },
];

InvokeCommand.skipValidInstallCheck = true;
InvokeCommand.examples = [
  'zapier invoke',
  'zapier invoke auth test',
  'zapier invoke trigger new_recipe',
  `zapier invoke create add_recipe --inputData '{"title": "Pancakes"}'`,
  'zapier invoke search find_recipe -i @file.json',
  'cat file.json | zapier invoke trigger new_recipe -i @-',
];
InvokeCommand.description = `Invoke an auth operation, a trigger, or a create/search action locally.

This command emulates how Zapier production environment would invoke your integration. It runs code locally, so you can use this command to quickly test your integration without deploying it to Zapier. This is especially useful for debugging and development.

This command loads \`authData\` from the \`.env\` file in the current directory. Create a \`.env\` file with the necessary auth data before running this command. Each line in \`.env\` should be in the format \`authData_FIELD_KEY=VALUE\`. For example, an OAuth2 integration might have a \`.env\` file like this:

\`\`\`
authData_access_token=1234567890
authData_other_auth_field=abcdef
\`\`\`

To test if the auth data is correct, run either one of these:

\`\`\`
zapier invoke auth test   # invokes authentication.test method
zapier invoke auth label  # invokes authentication.test and renders connection label
\`\`\`

Then you can test an trigger, a search, or a create action. For example, this is how you invoke a trigger with key \`new_recipe\`:

\`\`\`
zapier invoke trigger new_recipe
\`\`\`

To add input data, use the \`--inputData\` flag. The input data can come from the command directly, a file, or stdin. See **EXAMPLES** below.

The following is a non-exhaustive list of current limitations and may be supported in the future:

- \`zapier invoke auth start\` to help you initialize the auth data in \`.env\`
- \`zapier invoke auth refresh\` to refresh the auth data in \`.env\`
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
