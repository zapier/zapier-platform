const fs = require('node:fs');

const _ = require('lodash');
const { flags } = require('@oclif/command');
const debug = require('debug')('zapier:invoke');
const dotenv = require('dotenv');

// Datetime related imports
const chrono = require('chrono-node');
const { DateTime, IANAZone } = require('luxon');

const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');
const { localAppCommand } = require('../../utils/local');
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

const getMissingOptionalInputFields = (inputData, inputFields) => {
  return inputFields.filter((f) => !f.required && !inputData[f.key]);
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

const invokeAuthTest = async (authData, meta) => {
  return localAppCommand({
    command: 'execute',
    method: 'authentication.test',
    bundle: {
      authData,
      meta,
    },
  });
};

const testAuth = async (authData, meta) => {
  startSpinner('Invoking authentication.test');
  const result = await invokeAuthTest(authData, meta);
  endSpinner();
  console.log(JSON.stringify(result, null, 2));
};

const getAuthLabel = async (labelTemplate, authData, meta) => {
  startSpinner('Invoking authentication.test');
  const testResult = await invokeAuthTest(authData, meta);
  endSpinner();

  // TODO: Render label template
  console.log(JSON.stringify(testResult, null, 2));
  console.log('Template:', labelTemplate);
};

class InvokeCommand extends BaseCommand {
  async invokeAction(
    actionTypePlural,
    action,
    inputData,
    authData,
    meta,
    timezone
  ) {
    // Do these in order:
    // 1. {actionTypePlural}.{actionKey}.operation.inputFields
    // 2. {actionTypePlural}.{actionKey}.operation.perform

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
    });
    endSpinner();

    debug('inputFields:', inputFields);

    let missingFields = getMissingRequiredInputFields(inputData, inputFields);
    if (missingFields.length) {
      if (!process.stdin.isTTY) {
        throw new Error(
          'You must specify these required fields in --inputData at least when stdin is not a TTY: \n' +
            missingFields.map((f) => `* ${f.key}`).join('\n')
        );
      }
      for (const f of missingFields) {
        const ftype = f.type || 'string';
        const value = await this.prompt(
          `Required input field "${f.key}" (${ftype}):`
        );
        inputData[f.key] = value;
      }
    }

    if (process.stdin.isTTY) {
      missingFields = getMissingOptionalInputFields(inputData, inputFields);
      if (missingFields.length) {
        // Let user select which optional field to fill
        while (true) {
          let fieldChoices = missingFields.map((f) => {
            let name;
            if (inputData[f.key]) {
              name = `${f.key} (current: "${inputData[f.key]}")`;
            } else if (f.default) {
              name = `${f.key} (default: "${f.default}")`;
            } else {
              name = f.key;
            }
            return {
              name,
              value: f.key,
            };
          });
          fieldChoices = [
            {
              name: '>>> Done. Invoke the action! <<<',
              short: 'Done',
              value: null,
            },
            ...fieldChoices,
          ];
          const fieldKey = await this.promptWithList(
            'Would you like to fill these input fields? Select "Done" when you are ready to invoke the action.',
            fieldChoices
          );
          if (!fieldKey) {
            break;
          }

          const field = missingFields.find((f) => f.key === fieldKey);
          const ftype = field.type || 'string';
          const value = await this.prompt(
            `Input field "${fieldKey}" (${ftype}):`
          );
          inputData[fieldKey] = value;
        }
      }
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
    });
    endSpinner();

    console.log(JSON.stringify(output, null, 2));
  }

  async perform() {
    dotenv.config({ override: true });

    let { actionType, actionKey } = this.args;

    if (!actionType) {
      if (!process.stdin.isTTY) {
        throw new Error(
          'You must specify ACTIONTYPE and ACTIONKEY when stdin is not a TTY.'
        );
      }
      actionType = await this.promptWithList(
        'Which action type would you like to invoke?',
        ACTION_TYPES
      );
    }

    const actionTypePlural = ACTION_TYPE_PLURALS[actionType];
    const appDefinition = await localAppCommand({ command: 'definition' });

    if (!actionKey) {
      if (!process.stdin.isTTY) {
        throw new Error('You must specify ACTIONKEY when stdin is not a TTY.');
      }
      if (actionType === 'auth') {
        const actionKeys = ['label', 'test'];
        actionKey = await this.promptWithList(
          'Which auth action would you like to do?',
          actionKeys
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
          actionKeys
        );
      }
    }

    const authData = loadAuthDataFromEnv();

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
        // TODO: Add 'start' and 'refresh' commands
        case 'test':
          await testAuth(authData, meta);
          break;
        case 'label': {
          const labelTemplate = appDefinition.authentication.connectionLabel;
          await getAuthLabel(labelTemplate, authData, meta);
          break;
        }
        default:
          throw new Error(`Unknown auth action: ${actionKey}`);
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

      const { timezone } = this.flags;
      const meta = {
        isLoadingSample: this.flags.isLoadingSample,
        isFillingDynamicDropdown: this.flags.isFillingDynamicDropdown,
        isPopulatingDedupe: this.flags.isPopulatingDedupe,
        limit: this.flags.limit,
        page: this.flags.page,
        isTestingAuth: false, // legacy property
      };
      await this.invokeAction(
        actionTypePlural,
        action,
        inputData,
        authData,
        meta,
        timezone
      );
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
    isLoadingSample: flags.boolean({
      description:
        'Set bundle.meta.isLoadingSample to true. When true in production, this run is initiated by the user in the Zap editor trying to pull a sample.',
      default: false,
    }),
    isFillingDynamicDropdown: flags.boolean({
      description:
        'Set bundle.meta.isFillingDynamicDropdown to true. Only makes sense for a polling trigger. When true in production, this poll is being used to populate a dynamic dropdown.',
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
    timezone: flags.string({
      char: 'z',
      description:
        'Set the default timezone for datetime fields. If not set, defaults to America/Chicago, which matches Zapier production behavior.',
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
    description: 'The action key you want to invoke.',
  },
];

InvokeCommand.skipValidInstallCheck = true;
InvokeCommand.examples = [
  'zapier invoke trigger new_recipe',
  `zapier invoke create add_recipe --inputData '{"title": "Pancakes"}'`,
  'zapier invoke search find_recipe -i @file.json',
  'cat file.json | zapier invoke trigger new_recipe -i @-',
];
InvokeCommand.description =
  'Invoke an auth operation, a trigger, or a create/search action locally.';

module.exports = InvokeCommand;
