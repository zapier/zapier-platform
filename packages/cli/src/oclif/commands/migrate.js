const { flags } = require('@oclif/command');

const BaseCommand = require('../ZapierBaseCommand');
const PromoteCommand = require('./promote');
const { callAPI, listVersions } = require('../../utils/api');
const { isVersionCompatible } = require('../../utils/semver-compatibility');
const { buildFlags } = require('../buildFlags');

class MigrateCommand extends BaseCommand {
  async perform() {
    const percent = this.args.percent;
    if (isNaN(percent) || percent < 1 || percent > 100) {
      this.error('`PERCENT` must be a number between 1 and 100.');
    }

    const account = this.flags.account;
    const user = this.flags.user;
    const fromVersion = this.args.fromVersion;
    const toVersion = this.args.toVersion;
    const includeAllCompatibleVersions =
      this.flags.includeAllCompatibleVersions;

    let flagType;

    if (user || account) {
      flagType = user ? 'user' : 'account';
    }

    if (user && account) {
      this.error(
        'Cannot specify both `--user` and `--account`. Use only one or the other.'
      );
    }

    if ((user || account) && percent !== 100) {
      this.error(
        `Cannot specify both \`PERCENT\` and \`--${flagType}\`. Use only one or the other.`
      );
    }

    const app = await this.getWritableApp();

    // `versionsToMigrate` should at least include the user-specified `fromVersion`
    const versionsToMigrate = [fromVersion];

    // If the `--include-all-compatible-versions` flag is active,we fetch all available
    // versions, filter for which are compatible and then add them to `versionsToMigrate`
    if (includeAllCompatibleVersions) {
      const { versions } = await listVersions();
      const versionStrings = versions.map((v) => v.version);
      const compatibleVersions = versionStrings.filter((v) =>
        isVersionCompatible({ versionCurrent: v, versionGoal: toVersion })
      );

      if (compatibleVersions.length > 0) {
        versionsToMigrate.push(...compatibleVersions);
      }
    }

    let promoteFirst = false;
    if (
      percent === 100 &&
      !user &&
      !account &&
      (app.public || app.public_ish) &&
      toVersion !== app.latest_version
    ) {
      this.log(
        `You're trying to migrate all the users to ${toVersion}, which is not the current production version.`
      );
      promoteFirst = await this.confirm(
        `Do you want to promote ${toVersion} to production first?`,
        true,
        true
      );
    }

    if (promoteFirst) {
      await PromoteCommand.run([toVersion, '--invokedFromAnotherCommand']);
    }

    const body = {
      job: {
        name: 'migrate',
        to_version: toVersion,
        email: user || account,
        email_type: flagType,
      },
    };

    if (percent) {
      body.job.percent_human = percent;
    }

    const url = `/apps/${app.id}/migrations`;

    for (const version of versionsToMigrate) {
      body.job.from_version = version;

      if (user || account) {
        this.startSpinner(
          `Starting migration from ${fromVersion} to ${toVersion} for ${
            user || account
          }`
        );
      } else {
        this.startSpinner(
          `Starting migration from ${fromVersion} to ${toVersion} for ${percent}%`
        );
      }

      try {
        await callAPI(url, { method: 'POST', body });
      } catch (err) {
        this.error(err);
      } finally {
        this.stopSpinner();
      }
    }

    this.log(
      '\nMigration(s) successfully queued, please check `zapier jobs` to track their status. Migrations usually take between 5-10 minutes.'
    );
  }
}

MigrateCommand.flags = buildFlags({
  commandFlags: {
    user: flags.string({
      description:
        "Migrates all of a users' Private Zaps within all accounts for which the specified user is a member",
    }),
    account: flags.string({
      description:
        "Migrates all of a users' Zaps, Private & Shared, within all accounts for which the specified user is a member",
    }),
    includeAllCompatibleVersions: flags.string({
      description:
        "Schedules the migration of other compatible versions besides the 'fromVersion', if any are available. Compatible versions are those that are older than the 'fromVersion' but still share the same major version number as the 'fromVersion'.",
    }),
  },
});

MigrateCommand.args = [
  {
    name: 'fromVersion',
    required: true,
    description: 'The version FROM which to migrate users.',
  },
  {
    name: 'toVersion',
    required: true,
    description: 'The version TO which to migrate users.',
  },
  {
    name: 'percent',
    default: 100,
    description: 'Percentage (between 1 and 100) of users to migrate.',
    parse: (input) => parseInt(input, 10),
  },
];

MigrateCommand.skipValidInstallCheck = true;
MigrateCommand.examples = [
  'zapier migrate 1.0.0 1.0.1',
  'zapier migrate 1.0.1 2.0.0 10',
  'zapier migrate 2.0.0 2.0.1 --user=user@example.com',
  'zapier migrate 2.0.0 2.0.1 --account=account@example.com',
  'zapier migrate 2.4.0 2.5.0 --include-all-compatible-versions',
];
MigrateCommand.description = `Migrate a percentage of users or a single user from one version of your integration to another.

Start a migration to move users between different versions of your integration. You may also "revert" by simply swapping the from/to verion strings in the command line arguments (i.e. \`zapier migrate 1.0.1 1.0.0\`).

**Only use this command to migrate users between non-breaking versions, use \`zapier deprecate\` if you have breaking changes!**

Migration time varies based on the number of affected Zaps. Be patient and check \`zapier jobs\` to track the status. Or use \`zapier history\` if you want to see older jobs.

Since a migration is only for non-breaking changes, users are not emailed about the update/migration. It will be a transparent process for them.

We recommend migrating a small subset of users first, via the percent argument, then watching error logs of the new version for any sort of odd behavior. When you feel confident there are no bugs, go ahead and migrate everyone. If you see unexpected errors, you can revert.

You can migrate a specific user's Zaps by using \`--user\` (i.e. \`zapier migrate 1.0.0 1.0.1 --user=user@example.com\`). This will migrate Zaps in any account the user is a member of where the following criteria is met.

  - The Zap is owned by the user.
  - The Zap is not shared.
  - The integration auth used is not shared.

Alternatively, you can pass the \`--account\` flag, (i.e. \`zapier migrate 1.0.0 1.0.1 --account=account@example.com\`). This will migrate all users' Zaps, Private & Shared, within all accounts for which the specified user is a member.

**The \`--account\` flag should be used cautiously as it can break shared Zaps for other users in Team or Company accounts.**

You cannot pass both \`PERCENT\` and \`--user\` or \`--account\`.

You cannot pass both \`--user\` and \`--account\`.

When you , you can also pass the \`--include-all-compatible-versions\` flag to migrate all older compatible versions of the integration. For example, if you have versions 1.0.0, 1.1.0 and 1.2.0 which you would like to migrate to version 2.0.0, you can run the migrate command with \`fromVersion\` set to 1.2.0 and use the \`--include-all-compatible-versions\` flag.

**The \`--include-all-compatible-versions\` flag should be used cautiously as it is a bulk operation that will possibly affect more than just one version. It also only supports forward migrations; rolling back to a previous version would require individual migrations.**
`;

module.exports = MigrateCommand;
