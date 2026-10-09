const { Args } = require('@oclif/core');
const { cyan } = require('colors/safe');

const BaseCommand = require('../../ZapierBaseCommand');
const { buildFlags } = require('../../buildFlags');
const { getDomainFilter } = require('../../../utils/domain-filter');

class GetDomainFilterCommand extends BaseCommand {
  async perform() {
    const { version } = this.args;
    this.throwForInvalidVersion(version);
    const app = await this.getWritableApp();

    const domainFilter = await getDomainFilter(app, version);
    this.log(
      domainFilter
        ? `Domain filter for version ${cyan(version)}: ${domainFilter}`
        : `Version ${cyan(version)} has no domain filter, so Relay calls made with its authentication are refused.`,
    );
  }
}

GetDomainFilterCommand.args = {
  version: Args.string({
    description: 'The version to get the domain filter for.',
    required: true,
  }),
};
GetDomainFilterCommand.flags = buildFlags();
GetDomainFilterCommand.description = `Get the hosts a version may call through Relay.`;
GetDomainFilterCommand.examples = [`zapier-platform domain-filter:get 1.0.0`];
GetDomainFilterCommand.skipValidInstallCheck = true;
GetDomainFilterCommand.hide = true; // keeps it out of docs/cli.md
GetDomainFilterCommand.hidden = true; // keeps it out of --help

module.exports = GetDomainFilterCommand;
