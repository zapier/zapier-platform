const { Args, Flags } = require('@oclif/core');
const { cyan } = require('colors/safe');

const BaseCommand = require('../../ZapierBaseCommand');
const { buildFlags } = require('../../buildFlags');
const {
  getDomainFilter,
  setDomainFilter,
} = require('../../../utils/domain-filter');

class SetDomainFilterCommand extends BaseCommand {
  async perform() {
    const { version } = this.args;
    // The backend only accepts lowercase domains; requests are matched lowercased.
    const domains = this.argv.slice(1).map((d) => d.toLowerCase());
    if (!domains.length) {
      this.error(
        'Must specify at least one domain (like `api.example.com` or `*.example.com`)',
      );
    }
    this.throwForInvalidVersion(version);
    const app = await this.getWritableApp();

    const previous = await getDomainFilter(app, version);
    const stored = await setDomainFilter(app, version, domains.join(','), {
      append: this.flags.append,
    });
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
    ignoreStdin: true,
  }),
  'domains...': Args.string({
    description:
      "The domains this version's authentication can be sent to, space separated. For example: `api.example.com *.example.org`. Replaces the current filter unless you pass --append.",
    // Otherwise oclif fills a missing argument from piped stdin.
    ignoreStdin: true,
  }),
};
SetDomainFilterCommand.flags = buildFlags({
  commandFlags: {
    append: Flags.boolean({
      char: 'a',
      description:
        'Add the domains to the current filter instead of replacing it.',
    }),
  },
});
SetDomainFilterCommand.description = `Set the domains a version's authentication can be sent to. Only for private integrations; published integrations get this from Zapier review.`;
SetDomainFilterCommand.examples = [
  `zapier-platform domain-filter:set 1.0.0 api.example.com`,
  `zapier-platform domain-filter:set 1.0.0 --append auth.example.com`,
];
SetDomainFilterCommand.strict = false;
SetDomainFilterCommand.skipValidInstallCheck = true;
SetDomainFilterCommand.hide = true; // keeps it out of docs/cli.md
SetDomainFilterCommand.hidden = true; // keeps it out of --help

module.exports = SetDomainFilterCommand;
