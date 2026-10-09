const { Args, Flags } = require('@oclif/core');
const { cyan } = require('colors/safe');

const BaseCommand = require('../../ZapierBaseCommand');
const { buildFlags } = require('../../buildFlags');
const {
  appendHosts,
  writeDomainFilter,
} = require('../../../utils/domain-filter');

class SetDomainFilterCommand extends BaseCommand {
  async perform() {
    const { version } = this.args;
    const hosts = this.argv.filter((h) => !h.startsWith('-')).slice(1);
    if (!hosts.length) {
      this.error(
        'Must specify at least one host (like `api.example.com` or `*.example.com`)',
      );
    }

    const { previous, stored } = await writeDomainFilter(
      this,
      version,
      (current) =>
        this.flags.append ? appendHosts(current, hosts) : hosts.join(','),
    );
    if (previous) {
      this.log(`Previous domain filter: ${previous}`);
    }
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
      'The hosts your integration may call through Relay, space separated. For example: `api.example.com *.example.org`. Replaces the current filter unless you pass --append.',
  }),
};
SetDomainFilterCommand.flags = buildFlags({
  commandFlags: {
    append: Flags.boolean({
      char: 'a',
      description:
        'Add the hosts to the current filter instead of replacing it.',
    }),
  },
});
SetDomainFilterCommand.description = `Set the hosts a version may call through Relay. Only for private integrations; published integrations get this from Zapier review.`;
SetDomainFilterCommand.examples = [
  `zapier-platform domain-filter:set 1.0.0 api.example.com`,
  `zapier-platform domain-filter:set 1.0.0 --append auth.example.com`,
];
SetDomainFilterCommand.strict = false;
SetDomainFilterCommand.skipValidInstallCheck = true;
SetDomainFilterCommand.hide = true; // keeps it out of docs/cli.md
SetDomainFilterCommand.hidden = true; // keeps it out of --help

module.exports = SetDomainFilterCommand;
