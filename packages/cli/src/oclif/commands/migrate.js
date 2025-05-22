const _ = require('lodash');
const debug = require('debug')('zapier:migrate');
const { Args, Flags } = require('@oclif/core');

const BaseCommand = require('../ZapierBaseCommand');
const PromoteCommand = require('./promote');
const { callAPI } = require('../../utils/api');
const { buildFlags } = require('../buildFlags');

class MigrateCommand extends BaseCommand {
  async run_require_confirmation_pre_checks(app, requestBody) {
    const assumeYes = 'yes' in this.flags;
    const assumeYesExceptEnv = 'yesExceptEnv' in this.flags;
    const url = `/apps/${app.id}/pre-migration-require-confirmation-checks`;

    this.startSpinner(`Running pre-checks before migration...`);

    try {
      await callAPI(
        url,
        {
          method: 'POST',
          body: requestBody,
        },
        true,
      );
    } catch (response) {
      this.stopSpinner({ success: false });

      // 409 from the backend specifically signals pre-checks failed
      if (response.status === 409) {
        const softCheckErrors = _.get(response, 'json.errors', []);
        const formattedErrors = softCheckErrors.map((e) => `* ${e}`).join('\n');

        this.log();
        this.log('Non-blocking checks prior to migration returned warnings:');
        this.log(formattedErrors);
        this.log();

        const shouldContinuePreChecks =
          assumeYes ||
          (await this.confirm(
            'Would you like to continue with the migration regardless?',
          ));

        let shouldContinueEnvCheck = false;
        if (formattedErrors.toLowercase.contains('e001')) {
          shouldContinueEnvCheck =
            assumeYesExceptEnv ||
            (await this.confirm(
              'Would you like to continue with the promotion process despite environment variable changes?',
            ));
        } else {
          shouldContinueEnvCheck = true;
        }

        if (!shouldContinuePreChecks || !shouldContinueEnvCheck) {
          this.error('Cancelled migration.');
        }
      } else {
        debug('Soft pre-checks before migration failed:', response.errText);
      }
    } finally {
      this.stopSpinner();
    }
  }

  async perform() {
    const percent = this.args.percent;
    if (isNaN(percent) || percent < 1 || percent > 100) {
      this.error('`PERCENT` must be a number between 1 and 100.');
    }

    const account = this.flags.account;
    const user = this.flags.user;

    const fromVersion = this.args.fromVersion;
    const toVersion = this.args.toVersion;
    let flagType;

    if (user || account) {
      flagType = user ? 'user' : 'account';
    }

    if (user && account) {
      this.error(
        'Cannot specify both `--user` and `--account`. Use only one or the other.',
      );
    }

    if ((user || account) && percent !== 100) {
      this.error(
        `Cannot specify both \`PERCENT\` and \`--${flagType}\`. Use only one or the other.`,
      );
    }

    const app = await this.getWritableApp();

    let promoteFirst = false;
    if (
      percent === 100 &&
      !user &&
      !account &&
      (app.public || app.public_ish) &&
      toVersion !== app.latest_version
    ) {
      this.log(
        `You're trying to migrate all the users to ${toVersion}, which is not the current production version.`,
      );
      promoteFirst = await this.confirm(
        `Do you want to promote ${toVersion} to production first?`,
        true,
        true,
      );
    }

    if (promoteFirst) {
      await PromoteCommand.run([toVersion, '--invokedFromAnotherCommand']);
    }

    const body = {
      job: {
        name: 'migrate',
        from_version: fromVersion,
        to_version: toVersion,
        email: user || account,
        email_type: flagType,
      },
    };

    await this.run_require_confirmation_pre_checks(app, body);

    if (user || account) {
      this.startSpinner(
        `Starting migration from ${fromVersion} to ${toVersion} for ${
          user || account
        }`,
      );
    } else {
      this.startSpinner(
        `Starting migration from ${fromVersion} to ${toVersion} for ${percent}%`,
      );
    }
    if (percent) {
      body.job.percent_human = percent;
    }

    const url = `/apps/${app.id}/migrations`;

    try {
      await callAPI(url, { method: 'POST', body });
    } finally {
      this.stopSpinner();
    }

    this.log(
      '\nMigration successfully queued, please check `zapier jobs` to track the status. Migrations usually take between 5-10 minutes.',
    );
  }
}

MigrateCommand.flags = buildFlags({
  commandFlags: {
    user: Flags.string({
      description:
        "Migrates all of a users' Private Zaps within all accounts for which the specified user is a member",
    }),
    account: Flags.string({
      description:
        "Migrates all of a users' Zaps, Private & Shared, within all accounts for which the specified user is a member",
    }),
    yes: Flags.boolean({
      char: 'y',
      description:
        'Automatically answer "yes" to any prompts. Useful if you want to avoid interactive prompts to run this command in CI.',
    }),
    yesExceptEnv: Flags.boolean({
      description:
        "Automatically answer 'yes' to all prompts except environment variable changes",
    }),
  },
});

MigrateCommand.args = {
  fromVersion: Args.string({
    required: true,
    description: 'The version FROM which to migrate users.',
  }),
  toVersion: Args.string({
    required: true,
    description: 'The version TO which to migrate users.',
  }),
  percent: Args.string({
    default: 100,
    description: 'Percentage (between 1 and 100) of users to migrate.',
    parse: async (input) => parseInt(input, 10),
  }),
};

MigrateCommand.skipValidInstallCheck = true;
MigrateCommand.examples = [
  'zapier migrate 1.0.0 1.0.1',
  'zapier migrate 1.0.1 2.0.0 10',
  'zapier migrate 2.0.0 2.0.1 --user=user@example.com',
  'zapier migrate 2.0.0 2.0.1 --account=account@example.com',
];
MigrateCommand.description = `Migrate a percentage of users or a single user from one version of your integration to another.

Start a migration to move users between different versions of your integration. You may also "revert" by simply swapping the from/to verion strings in the command line arguments (i.e. \`zapier migrate 1.0.1 1.0.0\`).

**Only use this command to migrate users between non-breaking versions, use \`zapier deprecate\` if you have breaking changes!**

Migration time varies based on the number of affected Zaps. Be patient and check \`zapier jobs\` to track the status. Or use \`zapier history\` if you want to see older jobs.

Since a migration is only for non-breaking changes, users are not emailed about the update/migration. It will be a transparent process for them.

We recommend migrating a small subset of users first, via the percent argument, then watching error logs of the new version for any sort of odd behavior. When you feel confident there are no bugs, go ahead and migrate everyone. If you see unexpected errors, you can revert.

You can migrate a specific user's Zaps by using \`--user\` (i.e. \`zapier migrate 1.0.0 1.0.1 --user=user@example.com\`). This will migrate Zaps that are private for that user. Zaps that are

  - [shared across the team](https://help.zapier.com/hc/en-us/articles/8496277647629),
  - [shared app connections](https://help.zapier.com/hc/en-us/articles/8496326497037-Share-app-connections-with-your-team), or
  - in a [team/company account](https://help.zapier.com/hc/en-us/articles/22330977078157-Collaborate-with-members-of-your-Team-or-Company-account)

will **not** be migrated.

Alternatively, you can pass the \`--account\` flag, (i.e. \`zapier migrate 1.0.0 1.0.1 --account=account@example.com\`). This will migrate all Zaps owned by the user, Private & Shared, within all accounts for which the specified user is a member.

**The \`--account\` flag should be used cautiously as it can break shared Zaps for other users in Team or Enterprise accounts.**

You cannot pass both \`PERCENT\` and \`--user\` or \`--account\`.

You cannot pass both \`--user\` and \`--account\`.`;

module.exports = MigrateCommand;
