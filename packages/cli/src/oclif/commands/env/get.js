const BaseCommand = require('../../ZapierBaseCommand');
const { buildFlags } = require('../../buildFlags');
const { listEnv } = require('../../../utils/api');

class GetEnvCommand extends BaseCommand {
  async perform() {
    const { version } = this.args;
    this.throwForInvalidVersion(version);

    const { env } = await listEnv(version);

    this.logTable({
      rows: env,
      headers: [
        ['Key', 'key'],
        ['Value', 'value'],
      ],
      emptyMessage: `Version ${version} has no environment values set`,
    });

    this.log('Set new values with `zapier env:set`');
  }
}

GetEnvCommand.args = [
  {
    name: 'version',
    description: 'The version to get the environment for.',
    required: true,
  },
];
GetEnvCommand.flags = buildFlags({ opts: { format: true } });
GetEnvCommand.description = `Get environment variables for a version.`;
GetEnvCommand.examples = [`zapier env:get 1.2.3`];

module.exports = GetEnvCommand;
