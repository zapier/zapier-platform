const { flags } = require('@oclif/command');

const BaseCommand = require('../ZapierBaseCommand');
const PromoteCommand = require('./promote');
const { callAPI } = require('../../utils/api');
const { buildFlags } = require('../buildFlags');

class MigrateCommand extends BaseCommand {
  async perform() {
    const percent = this.args.percent;
    if (isNaN(percent) || percent < 1 || percent > 100) {
      this.error('`PERCENT` must be a number between 1 and 100.');
    }

    const user = this.flags.user;
    const fromVersion = this.args.fromVersion;
    const toVersion = this.args.toVersion;

    if (user && percent !== 100) {
      this.error(
        'Cannot specify both `PERCENT` and `--user`. Use only one or the other.'
      );
    }

    const app = await this.getWritableApp();

    let promoteFirst = false;
    if (
      percent === 100 &&
      !user &&
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
      percent
    };
    if (user) {
      body.user = user;
      this.startSpinner(
        `Starting migration from ${fromVersion} to ${toVersion} for ${user}`
      );
    } else {
      this.startSpinner(
        `Starting migration from ${fromVersion} to ${toVersion} for ${percent}%`
      );
    }

    const url = `/apps/${app.id}/versions/${fromVersion}/migrate-to/${toVersion}`;
    try {
      await callAPI(url, { method: 'POST', body });
    } finally {
      this.stopSpinner();
    }

    this.log(
      '\nMigration successfully queued, please check `zapier history` to track the status. Migrations usually take between 5-10 minutes.'
    );
  }
}

MigrateCommand.flags = buildFlags({
  commandFlags: {
    user: flags.string({
      description: 'Migrate only this user'
    })
  }
});

MigrateCommand.args = [
  {
    name: 'fromVersion',
    required: true,
    description: 'The version FROM which to migrate users.'
  },
  {
    name: 'toVersion',
    required: true,
    description: 'The version TO which to migrate users.'
  },
  {
    name: 'percent',
    default: 100,
    description: 'Percentage (between 1 and 100) of users to migrate.',
    parse: input => parseInt(input, 10)
  }
];

MigrateCommand.examples = [
  'zapier migrate 1.0.0 1.0.1',
  'zapier migrate 1.0.1 2.0.0 10',
  'zapier migrate 2.0.0 2.0.1 --user=user@example.com'
];
MigrateCommand.description = `Migrate users from one version of your integration to another.

Start a migration to move users between different versions of your integration. You may also "revert" by simply swapping the from/to verion strings in the command line arguments (i.e. \`zapier migrate 1.0.1 1.0.0\`).

Only use this command to migrate users between non-breaking versions, use \`zapier deprecate\` if you have breaking changes!

Migration time varies based on the number of affected Zaps. Be patient and check \`zapier history\` to track the status.

Since a migration is only for non-breaking changes, users are not emailed about the update/migration. It will be a transparent process for them.

We recommend migrating a small subset of users first, then watching error logs of the new version for any sort of odd behavior. When you feel confident there are no bugs, go ahead and migrate everyone. If you see unexpected errors, you can revert.

You can migrate a single user by using \`--user\` (i.e. \`zapier migrate 1.0.0 1.0.1 --user=user@example.com\`).`;

module.exports = MigrateCommand;
