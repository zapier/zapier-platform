const BaseCommand = require('../ZapierBaseCommand');
const { Args, Flags } = require('@oclif/core');
const { buildFlags } = require('../buildFlags');
const colors = require('colors/safe');

const { callAPI, getSpecificVersionInfo } = require('../../utils/api');

const DEPRECATION_REASONS = [
  { name: 'API shutdown', value: 'api shutdown' },
  { name: 'Security vulnerability', value: 'security vulnerability' },
  { name: 'Critical bug', value: 'critical bug' },
  { name: 'Legal requirement', value: 'legal requirement' },
  { name: 'Breaking change', value: 'breaking change' },
  { name: 'Other', value: 'other' },
];

class DeprecateCommand extends BaseCommand {
  async perform() {
    const app = await this.getWritableApp();
    const { version, date } = this.args;

    const versionInfo = await getSpecificVersionInfo(version);
    const hasActiveUsers = versionInfo.user_count && versionInfo.user_count > 0;

    this.log(
      `${colors.yellow('Warning: Deprecation is an irreversible action that will eventually block access to this version.')}\n` +
        `${colors.yellow('If all your changes are non-breaking, use `zapier migrate` instead to move users over to a newer version.')}\n`,
    );

    // Get deprecation reason - either from flag or prompt user
    let deprecationReason = this.flags.reason;

    if (!deprecationReason) {
      deprecationReason = await this.promptWithList(
        'Please select a reason for deprecating this version:',
        DEPRECATION_REASONS,
        {
          useStderr: true,
        },
      );
    } else {
      // Validate the provided reason
      const validReasons = DEPRECATION_REASONS.map((r) => r.value);
      if (!validReasons.includes(deprecationReason)) {
        this.error(
          `Invalid deprecation reason: ${deprecationReason}. Valid options are: ${validReasons.join(', ')}`,
        );
      }
    }

    let customReason = null;
    if (deprecationReason === 'other') {
      customReason = await this.prompt(
        'Please provide a brief user-facing reason (50 characters max):',
        {
          required: true,
          charLimit: 50,
          useStderr: true,
        },
      );
      customReason = 'other: ' + customReason;
    }

    if (
      !this.flags.force &&
      !(await this.confirm(
        'Are you sure you want to deprecate this version? This will notify users that their Zaps or other automations will stop working after the specified date.' +
          (hasActiveUsers
            ? `\n\nThis version has ${versionInfo.user_count} active user(s). Strongly consider migrating users to another version before deprecating!`
            : ''),
      ))
    ) {
      this.log('\nDeprecation cancelled.');
      return;
    }

    this.log(
      `\nPreparing to deprecate version ${version} your app "${app.title}" due to: ${customReason || DEPRECATION_REASONS.find((r) => r.value === deprecationReason)?.name}.\n`,
    );

    const url = `/apps/${app.id}/versions/${version}/deprecate`;
    this.startSpinner(`Deprecating ${version}`);
    await callAPI(url, {
      method: 'PUT',
      body: {
        deprecation_date: date,
        deprecation_reason: customReason || deprecationReason,
      },
    });
    this.stopSpinner();
    this.log(
      `\nWe'll let users know that this version will cease to work on ${date}.`,
    );
  }
}

DeprecateCommand.flags = buildFlags({
  commandFlags: {
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation prompt. Use with caution.',
    }),
    reason: Flags.string({
      char: 'r',
      description: 'Reason for deprecation.',
      options: DEPRECATION_REASONS.map((r) => r.value),
    }),
  },
});
DeprecateCommand.args = {
  version: Args.string({
    description: 'The version to deprecate.',
    required: true,
  }),
  date: Args.string({
    description:
      'The date (YYYY-MM-DD) when Zapier will make the specified version unavailable.',
    required: true,
  }),
};
DeprecateCommand.examples = [
  'zapier deprecate 1.2.3 2011-10-01',
  'zapier deprecate 1.2.3 2011-10-01 --reason=security_vulnerability',
  'zapier deprecate 1.2.3 2011-10-01 -r critical_bug',
];
DeprecateCommand.description = `Mark a non-production version of your integration as deprecated, with removal by a certain date.

Use this when an integration version will not be supported or start breaking at a known date.

When deprecating a version, you must provide a reason for the deprecation. You can either specify the reason using the --reason flag or you will be prompted to select from the following options:
${DEPRECATION_REASONS.map((r) => `- ${r.name}`).join('\n')}

Zapier will immediately send emails warning users of the deprecation if a date less than 30 days in the future is set, otherwise the emails will be sent exactly 30 days before the configured deprecation date.

There are other side effects: they'll start seeing it as "Deprecated" in the UI, and once the deprecation date arrives, if the Zaps weren't updated, they'll be paused and the users will be emailed again explaining what happened.

Do not use deprecation if you only have non-breaking changes, such as:
- Fixing help text
- Adding new triggers/actions
- Improving existing functionality
- other bug fixes that don't break existing automations.`;
DeprecateCommand.skipValidInstallCheck = true;

module.exports = DeprecateCommand;
