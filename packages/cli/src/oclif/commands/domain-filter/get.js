const { Args } = require('@oclif/core');

const BaseCommand = require('../../ZapierBaseCommand');
const { buildFlags } = require('../../buildFlags');
const { getDomainFilter } = require('../../../utils/domain-filter');

class GetDomainFilterCommand extends BaseCommand {
  async perform() {
    const { version } = this.args;
    this.throwForInvalidVersion(version);
    const app = await this.getWritableApp();

    const domainFilter = await getDomainFilter(app, version);
    this.logTable({
      rows: domainFilter
        .split(',')
        .filter(Boolean)
        .map((host) => ({ host })),
      headers: [['Host', 'host']],
      emptyMessage: `Version ${version} has no domain filter, so requests that use its authentication are refused.`,
    });
  }
}

GetDomainFilterCommand.args = {
  version: Args.string({
    description: 'The version to get the domain filter for.',
    required: true,
  }),
};
GetDomainFilterCommand.flags = buildFlags({ opts: { format: true } });
GetDomainFilterCommand.description = `Get the hosts a version's authentication can be sent to.`;
GetDomainFilterCommand.examples = [`zapier-platform domain-filter:get 1.0.0`];
GetDomainFilterCommand.skipValidInstallCheck = true;
GetDomainFilterCommand.hide = true; // keeps it out of docs/cli.md
GetDomainFilterCommand.hidden = true; // keeps it out of --help

module.exports = GetDomainFilterCommand;
