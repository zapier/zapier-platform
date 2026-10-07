const { Args } = require('@oclif/core');
const { cyan } = require('colors/safe');

const BaseCommand = require('../../ZapierBaseCommand');
const { buildFlags } = require('../../buildFlags');
const { writeDomainFilter } = require('../../../utils/domain-filter');

class UnsetDomainFilterCommand extends BaseCommand {
  async perform() {
    const { version } = this.args;
    await writeDomainFilter(this, version, '');
    this.log(`Cleared the domain filter for version ${cyan(version)}.`);
  }
}

UnsetDomainFilterCommand.args = {
  version: Args.string({
    description: 'The version to clear the domain filter for.',
    required: true,
  }),
};
UnsetDomainFilterCommand.flags = buildFlags();
UnsetDomainFilterCommand.description = `Clear the hosts a version may call through Relay.`;
UnsetDomainFilterCommand.examples = [
  `zapier-platform domain-filter:unset 1.0.0`,
];
UnsetDomainFilterCommand.skipValidInstallCheck = true;
UnsetDomainFilterCommand.hide = true; // keeps it out of docs/cli.md
UnsetDomainFilterCommand.hidden = true; // keeps it out of --help

module.exports = UnsetDomainFilterCommand;
