const ZapierBaseCommand = require('../../ZapierBaseCommand');
const { Args, Flags } = require('@oclif/core');
const { createCanary, listCanaries } = require('../../../utils/api');
const { buildFlags } = require('../../buildFlags');
const { validateActions } = require('../../../utils/actions');
const { localAppCommand } = require('../../../utils/local');

class CanaryCreateCommand extends ZapierBaseCommand {
  async perform() {
    const { versionFrom, versionTo } = this.args;
    const percent = this.flags.percent;
    const duration = this.flags.duration;
    const user = this.flags.user;
    const accountId = this.flags['account-id'];
    const forceIncludeAll = this.flags['force-include-all'];

    this.validateVersions(versionFrom, versionTo);
    this.validatePercent(percent);
    this.validateDuration(duration);

    let actions;
    if (this.flags.action) {
      // Load app definition to validate actions exist in the app
      let appDefinition;
      try {
        appDefinition = await localAppCommand({ command: 'definition' });
      } catch (error) {
        // If we can't load the app definition, skip app-specific validation
        appDefinition = null;
      }

      actions = validateActions(this.flags.action, appDefinition);
    }

    const activeCanaries = await listCanaries();
    if (activeCanaries.objects.length > 0) {
      const existingCanary = activeCanaries.objects[0];
      const secondsRemaining =
        existingCanary.until_timestamp - Math.floor(Date.now() / 1000);
      this
        .log(`A canary deployment already exists from version ${existingCanary.from_version} to version ${existingCanary.to_version}, there are ${secondsRemaining} seconds remaining.
        
If you would like to stop this canary now, run \`zapier canary:delete ${existingCanary.from_version} ${existingCanary.to_version}\``);
      return;
    }

    let createCanaryMessage = `Creating canary deployment
    - From version: ${versionFrom}
    - To version: ${versionTo}
    - Percentage: ${percent}%
    - Duration: ${duration} seconds`;

    const body = {
      percent,
      duration,
    };

    if (user) {
      body.user = user;
      createCanaryMessage += `\n    - User: ${user}`;
    }

    if (accountId) {
      body.account_id = parseInt(accountId);
      createCanaryMessage += `\n    - Account ID: ${accountId}`;
    }

    if (forceIncludeAll) {
      body.force_include_all = true;
      createCanaryMessage += `\n    - Force Include All: true`;
    }

    if (actions?.length) {
      body.actions = actions;
      const actionsInStr = actions.map((a) => `${a.type}/${a.key}`).join(', ');
      createCanaryMessage += `\n    - Actions: ${actionsInStr}`;
    }

    this.startSpinner(createCanaryMessage);
    await createCanary(versionFrom, versionTo, body);

    this.stopSpinner();
    this.log('Canary deployment created successfully.');
  }

  validateVersions(versionFrom, versionTo) {
    this.throwForInvalidVersion(versionFrom);
    this.throwForInvalidVersion(versionTo);

    if (versionFrom === versionTo) {
      this.error('`VERSIONFROM` and `VERSIONTO` can not be the same');
    }
  }

  validatePercent(percent) {
    if (isNaN(percent) || percent < 1 || percent > 100) {
      this.error('`--percent` must be a number between 1 and 100');
    }
  }

  validateDuration(duration) {
    if (isNaN(duration) || duration < 30 || duration > 24 * 60 * 60) {
      this.error('`--duration` must be a positive number between 30 and 86400');
    }
  }
}

CanaryCreateCommand.flags = buildFlags({
  commandFlags: {
    percent: Flags.integer({
      char: 'p',
      description: 'Percent of traffic to route to new version',
      required: true,
    }),
    duration: Flags.integer({
      char: 'd',
      description: 'Duration of the canary in seconds',
      required: true,
    }),
    user: Flags.string({
      char: 'u',
      description:
        'Canary this user (email) across all accounts, unless `account-id` is specified.',
    }),
    'account-id': Flags.string({
      char: 'a',
      description:
        'The account ID to target. If user is specified, only canary the user within this account. If user is not specified, then this argument is only permitted for Zapier staff.',
    }),
    'force-include-all': Flags.boolean({
      char: 'f',
      description:
        'Overrides any default filters the canary system imposes. This argument is only permitted for Zapier staff.',
    }),
    action: Flags.string({
      char: 'c',
      description:
        'When specified, the command will only canary users\' Zaps that use the specified action(s). Specify an action in the format of "{action_type}/{action_key}", where {action_type} can be "trigger", "create", "search", "bulkRead", or "searchOrCreate". You can specify multiple actions like `-c trigger/new_recipe -c create/add_recipe`.',
      multiple: true,
    }),
  },
});

CanaryCreateCommand.args = {
  versionFrom: Args.string({
    description: 'Version to route traffic from',
    required: true,
  }),
  versionTo: Args.string({
    description: 'Version to canary traffic to',
    required: true,
  }),
};

CanaryCreateCommand.description = `Create a new canary deployment, diverting a specified percentage of traffic from one version to another for a specified duration.

Only one canary can be active at the same time. You can run \`zapier canary:list\` to check. If you would like to create a new canary with different parameters, you can wait for the canary to finish, or delete it using \`zapier canary:delete a.b.c x.y.z\`.

To canary traffic for a specific user, use the --user flag.

To canary traffic for an entire account, use the --account-id. Note: this scenario is only permitted for Zapier staff.

To canary traffic for a specific user within a specific account, use both --user and --account-id flags.

To canary traffic for specific actions only, use the --action flag. You can specify multiple actions to filter by.

Note: this is similar to \`zapier migrate\` but different in that this is temporary and will "revert" the changes once the specified duration is expired.

**Only use this command to canary traffic between non-breaking versions!**`;

CanaryCreateCommand.examples = [
  'zapier canary:create 1.0.0 1.1.0 -p 10 -d 3600',
  'zapier canary:create 2.0.0 2.1.0 --percent 25 --duration 1800 --user user@example.com',
  'zapier canary:create 2.0.0 2.1.0 -p 15 -d 7200 -a 12345 -u user@example.com',
  'zapier canary:create 2.0.0 2.1.0 -p 15 -d 7200 -a 12345',
  'zapier canary:create 1.0.0 1.1.0 -p 20 -d 3600 --action trigger/new_recipe',
  'zapier canary:create 1.0.0 1.1.0 -p 20 -d 3600 -c trigger/new_recipe -c create/add_recipe',
];
CanaryCreateCommand.skipValidInstallCheck = true;

module.exports = CanaryCreateCommand;
