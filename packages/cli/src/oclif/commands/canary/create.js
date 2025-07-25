const ZapierBaseCommand = require('../../ZapierBaseCommand');
const { Args, Flags } = require('@oclif/core');
const { createCanary, listCanaries } = require('../../../utils/api');
const { buildFlags } = require('../../buildFlags');

class CanaryCreateCommand extends ZapierBaseCommand {
  async perform() {
    const { versionFrom, versionTo } = this.args;
    const percent = this.flags.percent;
    const duration = this.flags.duration;
    const user = this.flags.user;
    const owner = this.flags.owner;
    const accountId = this.flags.accountId;

    if (user && owner) {
      this.error(
        'Cannot specify both `--user` and `--owner`. Use only one or the other.',
      );
    }

    if (accountId && !user && !owner) {
      this.error(
        'Cannot specify `--accountId` without either `--user` or `--owner`.',
      );
    }

    this.validateVersions(versionFrom, versionTo);
    this.validatePercent(percent);
    this.validateDuration(duration);

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
    } else if (owner) {
      body.owner = owner;
      createCanaryMessage += `\n    - Owner: ${owner}`;
    }

    if (accountId) {
      body.account_id = accountId;
      createCanaryMessage += `\n    - Account ID: ${accountId}`;
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
      description:
        'Canary this user across all accounts, unless account_id is specified.',
    }),
    owner: Flags.string({
      description:
        'Canary the account_id. Only used when account_id is also used.',
    }),
    accountId: Flags.string({
      description:
        'The account id to target. If owner is specified, Canary applies to all traffic for the account. If user is specified, only canary the user within this account.',
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

Note: this is similar to \`zapier migrate\` but different in that this is temporary and will "revert" the changes once the specified duration is expired.

**Only use this command to canary traffic between non-breaking versions!**`;

CanaryCreateCommand.examples = [
  'zapier canary:create 1.0.0 1.1.0 -p 25 -d 720',
  'zapier canary:create 2.0.0 2.1.0 --percent 50 --duration 300',
  'zapier canary:create 2.0.0 2.1.0 --percent 50 --duration 300 --user user@example.com',
  'zapier canary:create 2.0.0 2.1.0 --percent 50 --duration 300 --account_id 123 --owner admin@example.com',
  'zapier canary:create 2.0.0 2.1.0 --percent 50 --duration 300 --account_id 123 --user user@example.com',
];
CanaryCreateCommand.skipValidInstallCheck = true;

module.exports = CanaryCreateCommand;
