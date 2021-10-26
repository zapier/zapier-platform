const { flags } = require('@oclif/command');

const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');
const { callAPI } = require('../../utils/api');
const { localAppCommand } = require('../../utils/local');

// const { listVersions } = require('../../utils/api');

class RunCommand extends BaseCommand {
  async perform() {
    const { action } = this.args;
    const auth = this.flags.auth || {};
    const input = this.flags.input || {};

    // TODO add some error handling for the input

    const valuesToSet = JSON.parse(auth);
    console.log(valuesToSet.api_key);

    const payload = {
      params: JSON.parse(input),
    }; // do we need to pass in the auth? or we could just add it to the bundle afterwards

    // call the bundle API to construct the bundles
    const app = await this.getWritableApp();
    const url = `/apps/${app.id}/test-bundle/`; // TODO set this to the url for the bundle API once that is implemented
    let response;
    try {
      response = await callAPI(
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
    // currently this returns a 404 as the bundle API isn't ready yet

    // run the action using the provided bundle
    // not super sure how to do this. maybe using the app tester? or maybe a local command? Just throwing out suggestions
    // we can grab the definition - not sure if that's helpful at some point!
    // const definition = await localAppCommand({ command: 'definition' })
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
