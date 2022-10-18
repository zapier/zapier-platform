const _ = require('lodash');
const colors = require('colors/safe');
const { flags } = require('@oclif/command');

const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');
const { callAPI } = require('../../utils/api');
const { flattenCheckResult } = require('../../utils/display');
const { getVersionChangelog } = require('../../utils/changelog');

const serializeErrors = (errors) => {
  const opener = 'Promotion failed for the following reasons:\n\n';
  if (typeof errors[0] === 'string') {
    // errors is an array of strings
    return opener + errors.map((e) => `* ${e}`).join('\n');
  }

  const issues = flattenCheckResult({ errors: errors });
  return (
    opener +
    issues
      .map((i) => `* ${i.method}: ${i.description}\n ${colors.gray(i.link)}`)
      .join('\n')
  );
};

class PromoteCommand extends BaseCommand {
  async perform() {
    const app = await this.getWritableApp();

    const version = this.args.version;
    const assumeYes = 'yes' in this.flags;

    let shouldContinue;
    const changelog = await getVersionChangelog(version);
    if (changelog) {
      this.log(colors.green(`Changelog found for ${version}`));
      this.log(`\n---\n${changelog}\n---\n`);

      shouldContinue =
        assumeYes ||
        (await this.confirm(
          'Would you like to continue promoting with this changelog?'
        ));
    } else {
      this.log(
        `${colors.yellow(
          'Warning!'
        )} Changelog not found. Please create a CHANGELOG.md file in a format similar to ${colors.cyan(
          'https://gist.github.com/xavdid/b9ede3565f1188ce339292acc29612b2'
        )} with user-facing descriptions.`
      );

      shouldContinue =
        assumeYes ||
        (await this.confirm(
          'Would you like to continue promoting without a changelog?'
        ));
    }

    if (!shouldContinue) {
      this.error('Cancelled promote.');
    }

    this.log(
      `Preparing to promote version ${version} of your integration "${app.title}".`
    );

    const body = {
      job: {
        name: 'promote',
        to_version: version,
        changelog,
      },
    };

    this.startSpinner(`Verifying and promoting ${version}`);

    const url = `/apps/${app.id}/migrations`;
    try {
      await callAPI(
        url,
        {
          method: 'POST',
          body,
        },
        true
      );
    } catch (response) {
      const activationUrl = _.get(response, ['json', 'activationInfo', 'url']);
      if (activationUrl) {
        this.stopSpinner();
        this.log('\nGood news! Your integration passes validation.');
        this.log(
          `The next step is to visit ${colors.cyan(
            activationUrl
          )} to request to publish your integration.`
        );
      } else {
        this.stopSpinner({ success: false });

        const errors = _.get(response, 'json.errors');
        if (!_.isEmpty(errors)) {
          this.error(serializeErrors(errors));
        } else if (response.errText) {
          this.error(response.errText);
        } else {
          // is an actual error
          this.error(response);
        }
      }

      return;
    }

    this.stopSpinner();
    this.log('  Promotion successful!');
    if (!this.flags.invokedFromAnotherCommand) {
      this.log(
        'Optionally, run the `zapier migrate` command to move users to this version.'
      );
    }
  }
}

PromoteCommand.flags = buildFlags({
  commandFlags: {
    yes: flags.boolean({
      char: 'y',
      description:
        'Automatically answer "yes" to any prompts. Useful if you want to avoid interactive prompts to run this command in CI.',
    }),
  },
});

PromoteCommand.args = [
  {
    name: 'version',
    required: true,
    description: 'The version you want to promote.',
  },
];

PromoteCommand.skipValidInstallCheck = true;
PromoteCommand.examples = ['zapier promote 1.0.0'];
PromoteCommand.description = `Promote a specific version to public access.

Promote an integration version into production (non-private) rotation, which means new users can use this integration version.

* This **does** mark the version as the official public version - all other versions & users are grandfathered.
* This does **NOT** build/upload or deploy a version to Zapier - you should \`zapier push\` first.
* This does **NOT** move old users over to this version - \`zapier migrate 1.0.0 1.0.1\` does that.
* This does **NOT** recommend old users stop using this version - \`zapier deprecate 1.0.0 2017-01-01\` does that.

Promotes are an inherently safe operation for all existing users of your integration.

If your integration is private and passes our integration checks, this will give you a URL to a form where you can fill in additional information for your integration to go public. After reviewing, the Zapier team will approve to make it public if there are no issues or decline with feedback.

Check \`zapier jobs\` to track the status of the promotion. Or use \`zapier history\` if you want to see older jobs.`;

module.exports = PromoteCommand;
