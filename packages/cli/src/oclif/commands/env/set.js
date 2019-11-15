const BaseCommand = require('../../ZapierBaseCommand');
const { buildFlags } = require('../../buildFlags');
// const {} = require('../../../utils/api');

class SetEnvCommand extends BaseCommand {
  async perform() {
    // const { version, } = this.args;
    // this.throwForInvalidVersion(version);
    this.logJSON(this.args);

    // const { env } = await listEnv(version);

    // this.logTable({
    //   rows: env,
    //   headers: [['Key', 'key'], ['Value', 'value']],
    //   emptyMessage: `Version ${version} has no environment values set`
    // });

    // this.log('Set new values with `zapier env:set`');
  }
}

SetEnvCommand.args = [
  {
    name: 'version',
    description: 'The version to get the environment for.',
    required: true
  },
  {
    name: 'values...',
    description:
      'The keys and values to set. Keys are upcased at save. Each pair should be space separated and keys and values should be separated by an `=`.'
  }
];
SetEnvCommand.flags = buildFlags({ opts: { format: true } });
SetEnvCommand.description = `Sets environment variable(s) for a version.`;
SetEnvCommand.examples = [`zapier env:set 1.2.3 SECRET=12345 OTHER=4321`];
SetEnvCommand.strict = false;

module.exports = SetEnvCommand;
