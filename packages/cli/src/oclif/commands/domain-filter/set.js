const { Args } = require('@oclif/core');
const { cyan } = require('colors/safe');

const BaseCommand = require('../../ZapierBaseCommand');
const { buildFlags } = require('../../buildFlags');
const { writeDomainFilter } = require('../../../utils/domain-filter');

class SetDomainFilterCommand extends BaseCommand {
  async perform() {
    const { version } = this.args;
    const hosts = this.argv.slice(1).filter((h) => !h.startsWith('-'));
    if (!hosts.length) {
      this.error(
        'Must specify at least one host (like `api.example.com` or `*.example.com`)',
      );
    }

    const stored = await writeDomainFilter(this, version, hosts.join(','));
    this.log(`Domain filter for version ${cyan(version)} is now: ${stored}`);
  }
}

SetDomainFilterCommand.args = {
  version: Args.string({
    description:
      'The version to set the domain filter for. It is copied forward when a new version is pushed.',
    required: true,
  }),
  'hosts...': Args.string({
    description:
      'The hosts your integration may call through Relay, space separated. For example: `api.example.com *.example.org`. Replaces the current filter.',
  }),
};
SetDomainFilterCommand.flags = buildFlags();
SetDomainFilterCommand.description = `Set the hosts a version may call through Relay. Only for private integrations; published integrations get this from Zapier review.`;
SetDomainFilterCommand.examples = [
  `zapier-platform domain-filter:set 1.0.0 api.example.com`,
];
SetDomainFilterCommand.strict = false;
SetDomainFilterCommand.skipValidInstallCheck = true;
SetDomainFilterCommand.hide = true; // keeps it out of docs/cli.md
SetDomainFilterCommand.hidden = true; // keeps it out of --help

module.exports = SetDomainFilterCommand;
