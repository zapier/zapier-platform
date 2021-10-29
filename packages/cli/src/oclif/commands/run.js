const { flags } = require('@oclif/command');
const path = require('path');
const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');
const { callAPI } = require('../../utils/api');
const { localAppCommand } = require('../../utils/local');
const zapier = require('zapier-platform-core');
const os = require('os');
const fs = require('fs');

const { parseAuth, parseInput } = require('../../utils/run');

const METHODS = {
  perform: 'perform',
  inputFields: 'inputFields',
  outputFields: 'outputFields',
};
// const { listVersions } = require('../../utils/api');

class RunCommand extends BaseCommand {
  async perform() {
    const {
      actionType, // EX: creates
      actionKey = '', // set an empty default here in case developer is testing `authentication` actionType
    } = this.args;
    const method = this.flags.method || METHODS.perform;

    if (method !== 'inputFields' && this.flags.requiredFieldsOnly)
      throw new Error(
        'Sorry, the requiredFieldsOnly flag can only be used wih the inputFields method.'
      );

    const { requiredFieldsOnly, writeFile } = this.flags;

    zapier.tools.env.inject(); // this must come before importing the App
    // get the index file for the app (maybe this can be soemthing other than index.js?)
    const localAppPath = path.join(process.cwd(), 'index.js');
    const App = require(localAppPath);

    const auth = parseAuth(App.authentication.type, this.flags.auth);
    const input = parseInput(actionType, actionKey, this.flags.input);
    // TODO add some error handling for the input

    const payload = {
      platformVersion: '11.1.0',
      type: 'create',
      method: method,
      auth,
      params: input,
    }; // do we need to pass in the auth? or we could just add it to the bundle afterwards

    this.startSpinner('Retrieving bundle using input');
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
    this.stopSpinner();

    this.startSpinner('Testing the provided method');
    // run the action using the provided bundle
    const appTester = zapier.createAppTester(App);
    let result;
    try {
      if (actionKey) {
        result = await appTester(
          App[actionType][actionKey].operation[method],
          bundle
        );
        if (requiredFieldsOnly && method === 'inputFields') {
          result = result.filter((field) => field.required === true);
        }
      } else {
        // This is for running the Auth test if we implement that.
        result = await appTester(App[actionType].test, bundle);
      }
      this.stopSpinner();
    } catch (e) {
      console.log(e); // TODO handle errors
    }
    if (writeFile) {
      const fileName =
        actionType === 'authentication'
          ? `run_${actionType}_test_output.json`
          : `run_${actionType}_${actionKey}_${method}_output.json`;
      fs.writeFile(fileName, JSON.stringify(result, null, 2), function (err) {
        if (err) throw err;
      });
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
        'The function you would like to test, in the form `method perform` (default).',
    }),
    requiredFieldsOnly: flags.boolean({
      description:
        "Use if you're running the inputFields method and want to see only the required fields.",
      default: false,
    }),
    writeFile: flags.boolean({
      description:
        'Use to write the output of the method as a .json file named `run_[actionType]_[action]_[method]_output.json`.',
      default: false,
    }),
  },
});

RunCommand.args = [
  {
    name: 'actionType',
    options: ['triggers', 'creates', 'searches', 'authentication'],
    description: 'The type of action.',
    required: true,
  },
  {
    name: 'actionKey',
    description: 'The trigger/search/action key to run.',
  },
];

RunCommand.description = `Run a trigger/search/action for debug and testing purposes`;

module.exports = RunCommand;
