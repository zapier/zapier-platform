const { flags } = require('@oclif/command');
const path = require('path');
const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');
const { callAPI } = require('../../utils/api');
const { localAppCommand } = require('../../utils/local');
const zapier = require('zapier-platform-core');

// const { listVersions } = require('../../utils/api');

class RunCommand extends BaseCommand {
  async perform() {
    const { action } = this.args;
    const auth = this.flags.auth || {};
    const input = this.flags.input || {};

    // TODO add some error handling for the input

    const payload = {
      platformVersion: '11.1.0',
      type: 'create',
      method: 'perform',
      auth: JSON.parse(auth),
      params: JSON.parse(input),
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

    // get the index file for the app (maybe this can be soemthing other than index.js?)
    const localAppPath = path.join(process.cwd(), 'index.js');

    const App = require(localAppPath);
    const appTester = zapier.createAppTester(App);

    let result;
    try {
      result = await appTester(App.creates.customer.operation.perform, bundle);
    } catch (e) {
      console.log(e); // TODO handle errors
    }

    console.log(result);
    return result;
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
    description: 'The action key to run.',
    required: true,
  },
];

RunCommand.description = `Run an action for debug and testing purposes`;

module.exports = RunCommand;
