const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const https = require('node:https');

const _ = require('lodash');
const { flags } = require('@oclif/command');
const debug = require('debug')('zapier:invoke');
const express = require('express');

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

const getMissingInputFields = (inputData, inputFields) => {
  return inputFields.filter(
    (f) => f.required && !f.default && !inputData[f.key]
  );
};

const resolveInputFieldTypes = (inputData, inputFields) => {
  const fieldsWithDefault = inputFields.filter((f) => f.default);
  for (const f of fieldsWithDefault) {
    if (!inputData[f.key]) {
      // TODO: Maybe not mutate inputData?
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
      // TODO: Maybe not mutate inputData?
      // TODO: Make sure each case is consistent with the backend
      case 'integer':
        inputData[k] = parseInt(v, 10);
        break;
      case 'number':
        inputData[k] = parseFloat(v);
        break;
      case 'boolean':
        inputData[k] = v === 'true' || v === 'yes' || v === '1';
        break;
      case 'datetime':
        if (v === 'now') {
          inputData[k] = new Date();
        }
        inputData[k] = new Date(v);
        break;
      case 'file':
        // TODO: How to handle a file field?
        break;
    }
  }

  // TODO: Handle line items (fields with "children")

  return inputData;
};

class InvokeCommand extends BaseCommand {
  async startAuth() {
    startSpinner('Invoking authentication.oauth2Config.authorizeUrl');

    const appDefinition = await localAppCommand({
      command: 'definition',
    });
    const scope = appDefinition.authentication.oauth2Config.scope;
    const stateParam = crypto.randomBytes(20).toString('hex');
    const redirectUri = 'https://127.0.0.1:9876/callback';
    let authorizeUrl = await localAppCommand({
      command: 'execute',
      method: 'authentication.oauth2Config.authorizeUrl',
      bundle: {
        response_type: 'code',
        redirect_uri: redirectUri,
        state: stateParam,
      },
    });
    if (!authorizeUrl.includes('&scope=')) {
      authorizeUrl += `&scope=${scope}`;
    }

    endSpinner();
    startSpinner('Opening browser to authorize');

    const app = express();
    const port = 9876;

    let resolve;
    const p = new Promise((_resolve) => {
      resolve = _resolve;
    });
    app.get('/callback', (req, res) => {
      resolve(req.query.code);
      res.end('Go back to the terminal to continue.');
    });

    const server = https
      .createServer(
        {
          key: await fs.readFile('./server.key'),
          cert: await fs.readFile('./server.crt'),
        },
        app
      )
      .listen(port);

    const { default: open } = await import('open');
    open(authorizeUrl);

    const code = await p;
    await server.close();

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

    const shouldSave = await this.confirm('Save auth data to .env file?', true);
    if (shouldSave) {
      const envPath = '.env';
      await fs.appendFile(
        envPath,
        Object.entries(authData).map(([k, v]) => `${k.toUpperCase()}=${v}\n`)
      );
      console.log(`Auth data saved to ${envPath}`);
    } else {
      console.log('Auth data:', authData);
    }
  }

  async invokeAction(actionTypePlural, action, inputData) {
    // {actionType}.{actionKey}.operation.inputFields
    // {actionType}.{actionKey}.operation.perform
    //
    // if (search or hook) and hydrate-output:
    //   {actionType}.{actionKey}.operation.performGet
    // action.operation.inputFields;

    const authData = {
      // TODO: Don't hard-code these
      access_token: process.env.ACCESS_TOKEN,

      // Slack-specific auth data
      team_id: process.env.TEAM_ID,
      user_id: process.env.USER_ID,
      app_id: process.env.APP_ID,
      bot_user_id: process.env.BOT_USER_ID,
      bot_token: process.env.BOT_TOKEN,
    };
    const meta = {
      // TODO: Make these command flags
      isLoadingSample: false,
      isFillingDynamicDropdown: false,
      isTestingAuth: false,
      isPopulatingDedupe: false,
      limit: -1,
      page: 0,
    };

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

    const missingFields = getMissingInputFields(inputData, inputFields);
    if (missingFields.length) {
      for (const f of missingFields) {
        const ftype = f.type || 'string';
        const value = await this.prompt(
          `Enter a value for input field "${f.key}" of type "${ftype}":`
        );
        inputData[f.key] = value;
      }
    }

    inputData = resolveInputFieldTypes(inputData, inputFields);
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
    let { actionType, actionKey } = this.args;

    if (!actionType) {
      actionType = await this.promptWithList(
        'Which action type do you want to invoke?',
        ACTION_TYPES
      );
    }

    const actionTypePlural = ACTION_TYPE_PLURALS[actionType];

    // TODO: Don't hard-code 'index.js', respect the entry file defined in
    // package.json
    const appDefinition = await localAppCommand({
      command: 'definition',
    });
    // console.log(appDefinition);

    if (!actionKey) {
      if (actionType === 'auth') {
        // TODO: 'refresh' is only for OAuth
        const actionKeys = ['start', 'test', 'refresh', 'label'];
        actionKey = await this.promptWithList(
          'Which auth action you want to do?',
          actionKeys
        );
      } else {
        const actionKeys = Object.keys(appDefinition[actionTypePlural] || {});
        if (!actionKeys.length) {
          throw new Error(
            `No "${actionTypePlural}" found in your integration.`
          );
        }

        actionKey = await this.promptWithList(
          `Which action key you want to invoke?`,
          actionKeys
        );
      }
    }

    if (actionType === 'auth') {
      switch (actionKey) {
        case 'start':
          await this.startAuth();
          break;
        case 'test':
          await this.testAuth();
          break;
        case 'refresh':
          await this.refreshAuth();
          break;
        case 'label':
          await this.getAuthLabel();
          break;
        default:
          throw new Error(`Unknown auth action: ${actionKey}`);
      }
    } else {
      const action = appDefinition[actionTypePlural][actionKey];

      debug('Action type:', actionType);
      debug('Action key:', actionKey);
      debug('Action label:', action.display.label);

      let { inputData } = this.flags;
      if (inputData != null) {
        inputData = JSON.parse(inputData);
      } else {
        inputData = {};
      }

      await this.invokeAction(actionTypePlural, action, inputData);
    }
  }
}

InvokeCommand.flags = buildFlags({
  commandFlags: {
    inputData: flags.string({
      char: 'd',
      description:
        'The input data to pass to the action. Must be a JSON-encoded object.',
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
];
InvokeCommand.description = 'Invoke an action (trigger/search/create) locally.';

module.exports = InvokeCommand;
