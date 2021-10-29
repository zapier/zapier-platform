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
  // another way for to find AuthOptions is by searching for the following phrases in keys:
  const phrases = [
    /.*api.*key.*/i,
    /.*access.*token.*/i,
    /.*token.*/i,
    /.*user.*name.*/i,
    /.*password.*/i,
  ];
  const authOptions = {};
  phrases.forEach((phrase) => {
    Object.keys(process.env).forEach((key) => {
      if (key.match(phrase)) authOptions[key] = process.env[key];
    });
  });

  return authOptions;
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
      action = '', // set an empty default here in case developer is testing `authentication` actionType
    } = this.args;
    // const method =
    //   this.flags.method ||
    //   (actionType === 'authentication' ? METHODS.test : METHODS.perform);

    // if (!Object.keys(METHODS).includes(method))
    //   throw new Error(`method flag must be one of ${Object.keys(METHODS)}`);

    zapier.tools.env.inject(); // this must come before importing the App
    // get the index file for the app (maybe this can be soemthing other than index.js?)
    // const localAppPath = path.join(process.cwd(), 'index.js');
    // const App = require(localAppPath);

    // const auth = parseAuth(App.authentication.type, this.flags.auth);
    const auth = JSON.parse(this.flags.auth);
    // const input = parseInput(actionType, action, this.flags.input);
    const input = JSON.parse(this.flags.input);
    // TODO add some error handling for the input

    const payload = {
      platformVersion: '11.1.0',
      type: 'create',
      method: 'inputFields',
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
    //
    const fields = await localAppCommand({
      command: 'execute',
      method: `${action}.operation.inputFields`,
      bundle,
    });

    payload.fields = fields;
    payload.method = 'perform';

    bundle = await callAPI(
      url,
      {
        body: payload,
        method: 'POST',
      },
      true
    );

    const result = await localAppCommand({
      command: 'execute',
      method: `${action}.operation.perform`,
      bundle,
    });

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
  },
});

RunCommand.args = [
  {
    name: 'action',
    description:
      "The action key to run. You have to specify the full path '{type}.{key}', such as 'creates.task'. Only `creates` is currently supported. TODO: Add `triggers`, `searches`, `authentication`.",
    required: true,
  },
];

RunCommand.description = `Run an action _locally_ for debug and testing purposes.`;

module.exports = RunCommand;
