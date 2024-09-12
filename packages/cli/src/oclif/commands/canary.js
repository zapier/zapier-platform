const ZapierBaseCommand = require('../ZapierBaseCommand');

const { buildFlags } = require('../buildFlags');
const { flags } = require('@oclif/command');
const { handleCreate, handleList, handleDelete } = require('../../utils/canary');

class CanaryCommand extends ZapierBaseCommand {
  async perform() {
    try {
      if (this.flags.create) {
        await handleCreate(
          this.flags.versionFrom,
          this.flags.versionTo,
          this.flags.percentage,
          this.flags.duration
        );
      } else if (this.flags.list) {
        await handleList();
      } else if (this.flags.delete) {
        await handleDelete(this.flags.versionFrom, this.flags.versionTo);
      } else {
        console.log('Please specify a canary command: --create, --list, or --delete');
      }
    } catch (error) {
      this.error(error.message);
    }
  }
}

CanaryCommand.flags = buildFlags({
  commandFlags: {
    'create': flags.boolean({char: 'c', description: 'Create a new canary deployment'}),
    'list': flags.boolean({char: 'l', description: 'List all canary deployments'}),
    'delete': flags.boolean({char: 'd', description: 'Delete a canary deployment'}),
    'versionFrom': flags.string({char: 'f', description: 'Version to deploy from'}),
    'versionTo': flags.string({char: 't', description: 'Version to deploy to'}),
    'percentage': flags.integer({char: 'p', description: 'Percentage of traffic to route to new version'}),
    'duration': flags.integer({char: 's', description: 'Duration of the canary in seconds'}),
  }
});

CanaryCommand.description = 'Canary traffic from one app version to another app version.';
CanaryCommand.skipValidInstallCheck = true;
CanaryCommand.examples = [
  'zapier canary --create --versionFrom 1.5.1 --versionTo 1.6.0 --percentage 10 --duration 120',
  'zapier canary --list',
  'zapier canary --delete --versionFrom 1.5.1'
];

module.exports = CanaryCommand;