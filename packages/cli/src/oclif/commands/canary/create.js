const ZapierBaseCommand = require('../../ZapierBaseCommand');
const { createCanary, listCanaries } = require('../../../utils/api');
const { buildFlags } = require('../../buildFlags');
const { flags } = require('@oclif/command');

class CanaryCreateCommand extends ZapierBaseCommand {
  async perform() {
    const { versionFrom, versionTo } = this.args;
    const duration = this.flags.duration;

    this.validateVersions(versionFrom, versionTo);
    this.validateDuration(duration);

    const trafficOption = this.validateAndFetchTrafficOptions(this.flags);

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

    this.startSpinner(`Creating canary deployment
    - From version: ${versionFrom}
    - To version: ${versionTo}
    - Traffic Option: ${trafficOption.label}
    - Duration: ${duration} seconds`);
    delete trafficOption.label;
    const options = {
      duration,
      ...trafficOption,
    };

    await createCanary(versionFrom, versionTo, options);

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

  validateAndFetchTrafficOptions(flags) {
    const options = ['percent', 'user', 'account', 'user_id'];
    const providedOptions = options.filter(
      (option) => flags[option] !== undefined
    );

    if (providedOptions.length > 1) {
      this.error(
        `Only one of the following fields must be provided: ${Object.keys(
          flags
        ).join(', ')}`
      );
    }

    if (providedOptions.length === 0) {
      this.error(
        `One of the following fields is required: ${Object.keys(flags).join(
          ', '
        )}`
      );
    }

    const percent = flags.percent;
    if ((percent && isNaN(percent)) || percent < 1 || percent > 100) {
      this.error('`--percent` must be a number between 1 and 100');
    }

    const option = providedOptions[0];
    const value = flags[option];
    const label = option === 'percent' ? `${value}%` : `${option}=${value}`;

    return { [option]: value, label };
  }

  validateDuration(duration) {
    if (isNaN(duration) || duration < 30 || duration > 24 * 60 * 60) {
      this.error('`--duration` must be a positive number between 30 and 86400');
    }
  }
}

CanaryCreateCommand.flags = buildFlags({
  commandFlags: {
    account: flags.integer({
      char: 'a',
      description: 'Account email to route traffic to the new version',
      required: false,
    }),
    duration: flags.integer({
      char: 'd',
      description: 'Duration of the canary in seconds',
      required: true,
    }),
    percent: flags.integer({
      char: 'p',
      description: 'Percent of traffic to route to new version',
      required: false,
    }),
    user: flags.integer({
      char: 'u',
      description:
        'User email to route traffic to the new version (same as email). ',
      required: false,
    }),
    user_id: flags.string({
      char: 'i',
      description: 'User id for the user to route traffic to the new version',
      required: false,
    }),
  },
});

CanaryCreateCommand.args = [
  {
    name: 'versionFrom',
    required: true,
    description: 'Version to route traffic from',
  },
  {
    name: 'versionTo',
    required: true,
    description: 'Version to canary traffic to',
  },
];

CanaryCreateCommand.description = `Create a new canary deployment which routes traffic from one version to another for a specified duration.

Canaries can be created to route traffic for one of the following options:
- A percentage of all traffic, from all users
- All traffic for a single user
- All traffic for a single account

Only one canary can be active at the same time. You can run \`zapier canary:list\` to check. If you would like to create a new canary with different parameters, you can wait for the canary to finish, or delete it using \`zapier canary:delete a.b.c x.y.z\`.

Note: this is similar to \`zapier migrate\` but different in that this is temporary and will "revert" the changes once the specified duration is expired.

**Only use this command to canary traffic between non-breaking versions!**`;

CanaryCreateCommand.examples = [
  'zapier canary:create 1.0.0 1.1.0 -d 720 -p 25',
  'zapier canary:create 2.0.0 2.1.0 --duration 300',
  'zapier canary:create 2.0.0 2.1.0 --duration 300 --user=user@example.com',
  'zapier canary:create 2.0.0 2.1.0 --duration 300 --account=account@example.com',
  'zapier canary:create 2.0.0 2.1.0 --duration 300 --user_id=123',
];
CanaryCreateCommand.skipValidInstallCheck = true;

module.exports = CanaryCreateCommand;
