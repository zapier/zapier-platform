const { flags } = require('@oclif/command');
const path = require('path');
const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');
const { callAPI } = require('../../utils/api');
const { localAppCommand } = require('../../utils/local');
const zapier = require('zapier-platform-core');
const os = require('os');
const fs = require('fs');

const METHODS = {
  perform: 'perform',
  inputFields: 'inputFields',
  outputFields: 'outputFields',
  test: 'test',
};
// const { listVersions } = require('../../utils/api');

const authTypeFields = (type) => {
  // inject the environment variables
  zapier.tools.env.inject();
  // there are more auth options, I just picked a few
  const authOptions = {
    basic: { username: process.env.USERNAME, password: process.env.PASSWORD },
    custom: {
      api_key: process.env.API_KEY || undefined,
      apiKey: process.env.APIKEY || undefined,
    },
    oauth1: { access_token: process.env.ACCESS_TOKEN },
    oauth2: { access_token: process.env.ACCESS_TOKEN },
  };
  return authOptions[type] || {};
};

const parseAuth = (type, authInput) => {
  // try to grab some sensible auth looking defaults - should really use the auth that is specified by the user
  let auth = authTypeFields(type);

  // override any of the environment variables with the ones provided via the command line
  if (authInput) {
    auth = { ...auth, ...JSON.parse(authInput) };
  }
  return auth;
};

const parseInput = (type, actionKey, input) => {
  let inputParams = {};

  // read the input from a json file if provided
  const inputDataPath = path.join(process.cwd(), 'run-input.json');
  if (fs.existsSync(inputDataPath)) {
    const testInputData = require(inputDataPath);
    if (type in testInputData && actionKey in testInputData[type]) {
      inputParams = testInputData[type][actionKey];
    }
  }

  // or provide JSON via the commandline, overriding any values from the run input file
  if (input) {
    inputParams = { ...inputParams, ...JSON.parse(input) };
  }

  return inputParams;
};

class RunCommand extends BaseCommand {
  async perform() {
    const {
      actionType, // EX: creates
      action = '', // set an empty default here in case developer is testing `authentication` actionType
    } = this.args;
    const method =
      this.flags.method ||
      (actionType === 'authentication' ? METHODS.test : METHODS.perform);

    if (!Object.keys(METHODS).includes(method))
      throw new Error(`method flag must be one of ${Object.keys(METHODS)}`);

    // get the index file for the app (maybe this can be soemthing other than index.js?)
    const localAppPath = path.join(process.cwd(), 'index.js');
    const App = require(localAppPath);

    const auth = parseAuth(App.authentication.type, this.flags.auth);
    const input = parseInput(actionType, action, this.flags.input);
    // TODO add some error handling for the input

    const payload = {
      platformVersion: '11.1.0',
      type: 'create',
      method: method,
      auth,
      params: input,
    }; // do we need to pass in the auth? or we could just add it to the bundle afterwards

    // call the bundle API to construct the bundles
    // const app = await this.getWritableApp();
    const url = '/bundle'; // TODO set this to the url for the bundle API once that is implemented
    let bundle = {};
    try {
      bundle = await callAPI(
        url,
        {
          body: payload,
          method: 'POST',
        },
        true
      );
      // this.logJSON(payload);
    } catch (e) {
      console.log(e); // TODO handle errors
    }

    // run the action using the provided bundle
    // not super sure how to do this. maybe using the app tester? or maybe a local command? Just throwing out suggestions
    // we can grab the definition - not sure if that's helpful at some point!
    // const definition = await localAppCommand({ command: 'definition' })

    const appTester = zapier.createAppTester(App);
    zapier.tools.env.inject();
    let result;
    try {
      // we may need to add another condition for input/output fields as I'm not exactly sure how the App Tester will run those.
      if (action) {
        result = await appTester(
          App[actionType][action].operation[method],
          bundle
        );
      } else {
        // This is for runnig the Auth test if we implement that.
        result = await appTester(App[actionType][method], bundle);
      }
    } catch (e) {
      console.log(e); // TODO handle errors
    }

    this.logJSON(result);
  }
}
RunCommand.flags = buildFlags({
  commandFlags: {
    auth: flags.string({
      description:
        'The authentication JSON for your integration, in the form `auth={}`. For example: `auth={"api_key": "your_api_key"}`',
    }),
    input: flags.string({
      description:
        'The input fields and values to use, in the form `input={}`. For example: `input={"account: "356234", status": "PENDING"}`',
    }),
    method: flags.string({
      options: Object.keys(METHODS),
      description:
        'The function you would like to test, in the form `method=perform` (default).',
    }),
  },
});

RunCommand.args = [
  {
    name: 'actionType',
    description:
      'The type of action (Only `creates` is currently supported). TODO: Add `triggers`, `searches`, `authentication`',
    required: true,
  },
  {
    name: 'action',
    description: 'The action key to run.',
  },
];

RunCommand.description = `Run an action for debug and testing purposes`;

module.exports = RunCommand;
