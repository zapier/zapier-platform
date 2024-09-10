const ZapierBaseCommand = require('../ZapierBaseCommand');

const { buildFlags } = require('../buildFlags');

class CanaryCommand extends ZapierBaseCommand {
  async perform() {
    console.log('Hello from canary!')
  }
}

CanaryCommand.flags = buildFlags();
CanaryCommand.description =
  'Canary traffic from one app version to another app version.';
CanaryCommand.skipValidInstallCheck = true;

module.exports = CanaryCommand;