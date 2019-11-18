const { cyan } = require('colors/safe');
const { omit } = require('lodash');

const BaseCommand = require('../../ZapierBaseCommand');
const { buildFlags } = require('../../buildFlags');
const { callAPI, getLinkedApp } = require('../../../utils/api');

const successMessage = version =>
  `Successfully wrote the following to the environment of version ${cyan(
    version
  )}:`;

class SetEnvCommand extends BaseCommand {
  async perform() {
    const { version } = this.args;
    this.throwForInvalidVersion(version);
    // args should be [ '1.0.0', 'qer=123', 'qwer=123' ]
    const valuesToSet = this.argv.slice(1);

    if (!valuesToSet.length) {
      this.error(
        'Must specify at least one key-value pair to set (like `SOME_KEY=1234`)'
      );
    }

    if (!valuesToSet.every(v => v.includes('='))) {
      this.error('Every key-value pair must be in the format `SOME_KEY=1234`');
    }

    // if we get here, we should have well-formed input

    const payload = valuesToSet.reduce((result, kvPair) => {
      const [key, value] = kvPair.split('=');
      result[key.toUpperCase()] = value;
      return result;
    }, {});

    const app = await getLinkedApp();

    const url = `/apps/${app.id}/versions/${version}/multi-environment`;

    try {
      // currently, this returns nothing
      await callAPI(
        url,
        {
          body: payload,
          method: 'POST'
        },
        true
      );

      this.log(successMessage(version));
      this.logJSON(payload);
    } catch (e) {
      // comes back as json: { errors: [ 'The following keys failed to update: 3QER, 4WER' ] },
      const failedKeys = e.json.errors[0].split('update: ')[1].split(', ');

      this.warn(successMessage(version));
      this.logJSON(omit(payload, failedKeys));
      this.warn(`However, these keys failed to update: ${failedKeys}`);
    }
  }
}

SetEnvCommand.args = [
  {
    name: 'version',
    description: 'The version to get the environment for.',
    required: true
  },
  {
    name: 'key-value pairs...',
    description:
      'The keys and values to set. Keys are upcased at save. Each pair should be space separated and keys and values should be separated by an `=`. For example: `A=123 B=456`'
  }
];
SetEnvCommand.flags = buildFlags({ opts: { format: true } });
SetEnvCommand.description = `Sets environment variable(s) for a version.`;
SetEnvCommand.examples = [`zapier env:set 1.2.3 SECRET=12345 OTHER=4321`];
SetEnvCommand.strict = false;

module.exports = SetEnvCommand;
