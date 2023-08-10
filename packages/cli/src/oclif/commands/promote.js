const _ = require('lodash');
const colors = require('colors/safe');
const { flags } = require('@oclif/command');

const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');
const { callAPI } = require('../../utils/api');
const { flattenCheckResult } = require('../../utils/display');
const { getVersionChangelog } = require('../../utils/changelog');
const checkMissingAppInfo = require('../../utils/check-missing-app-info');
const { EXAMPLE_CHANGELOG } = require('../../constants');

const ACTION_TYPE_MAPPING = {
  read: 'trigger',
  write: 'create',
  search: 'search',
};

const serializeErrors = (errors) => {
  const opener = 'Promotion failed for the following reasons:\n\n';
  if (typeof errors[0] === 'string') {
    // errors is an array of strings
    return opener + errors.map((e) => `* ${e}`).join('\n');
  }

  const issues = flattenCheckResult({ errors });
  return (
    opener +
    issues
      .map((i) => `* ${i.method}: ${i.description}\n ${colors.gray(i.link)}`)
      .join('\n')
  );
};

const hasAppChangeType = (metadata, changeType) => {
  return Boolean(
    metadata?.some(
      // Existing property name
      // eslint-disable-next-line camelcase
      ({ app_change_type }) => app_change_type === changeType
    )
  );
};

class PromoteCommand extends BaseCommand {
  async perform() {
    const app = await this.getWritableApp();

    checkMissingAppInfo(app);

    const version = this.args.version;
    const assumeYes = 'yes' in this.flags;

    let shouldContinue;
    const { changelog, appMetadata, issueMetadata } = await getVersionChangelog(
      version
    );

    const metadataPromptHelper = `Issues are indicated by ${colors.bold.underline(
      '#<issueId>'
    )}, and actions by ${colors.bold.underline(
      '<trigger|create|search>/<key>'
    )}. Note issue IDs must be numeric and action identifiers are case sensitive.`;

    if (!changelog) {
      this.error(`${colors.yellow(
        'Warning!'
      )} Changelog not found. Please create a CHANGELOG.md file with user-facing descriptions. Example:
${colors.cyan(EXAMPLE_CHANGELOG)}
If bugfixes or updates to actions are present, then should be marked on a line that begins with "Update" or "Fix" (case insensitive) and information that contains the identifier.
${metadataPromptHelper}`);
    } else {
      this.log(colors.green(`Changelog found for ${version}`));
      this.log(`\n---\n${changelog}\n---`);
      /* eslint-disable camelcase */
      this.log(`\nParsed metadata:\n`);

      const appFeatureUpdates =
        appMetadata &&
        appMetadata
          .filter(({ app_change_type }) => app_change_type === 'FEATURE_UPDATE')
          .map(
            ({ action_type, action_key }) =>
              `${action_key}/${ACTION_TYPE_MAPPING[action_type]}`
          );

      const issueFeatureUpdates =
        issueMetadata &&
        issueMetadata
          .filter(({ app_change_type }) => app_change_type === 'FEATURE_UPDATE')
          .map(({ issue_id }) => `#${issue_id}`);

      if (appFeatureUpdates || issueFeatureUpdates) {
        this.log(
          `Feature updates: ${[
            ...(appFeatureUpdates ?? []),
            ...(issueFeatureUpdates ?? []),
          ].join(', ')}`
        );
      }

      const appBugfixes =
        appMetadata &&
        appMetadata
          .filter(({ app_change_type }) => app_change_type === 'BUGFIX')
          .map(
            ({ action_type, action_key }) =>
              `${action_key}/${ACTION_TYPE_MAPPING[action_type]}`
          );
      const issueBugfixes =
        issueMetadata &&
        issueMetadata
          .filter(({ app_change_type }) => app_change_type === 'BUGFIX')
          .map(({ issue_id }) => `#${issue_id}`);

      if (appBugfixes || issueBugfixes) {
        this.log(
          `Bug fixes: ${[...(appBugfixes ?? []), ...(issueBugfixes ?? [])].join(
            ', '
          )}`
        );
      }

      if (
        !appFeatureUpdates &&
        !issueFeatureUpdates &&
        !appBugfixes &&
        !issueBugfixes
      ) {
        this.log(
          `No metadata was found in the changelog. Remember, you can associate the changelog with issues or triggers/actions.\n\n${metadataPromptHelper}`
        );
      }
      this.log();
      /* eslint-enable camelcase */

      shouldContinue =
        assumeYes ||
        (await this.confirm(
          'Would you like to continue promoting with this changelog?'
        ));
    }

    if (!shouldContinue) {
      this.error('Cancelled promote.');
    }

    this.log(
      `Preparing to promote version ${version} of your integration "${app.title}".`
    );

    const isFeatureUpdate =
      hasAppChangeType(appMetadata, 'FEATURE_UPDATE') ||
      hasAppChangeType(issueMetadata, 'FEATURE_UPDATE');
    const isBugfix =
      hasAppChangeType(appMetadata, 'BUGFIX') ||
      hasAppChangeType(issueMetadata, 'BUGFIX');
    const body = {
      job: {
        name: 'promote',
        to_version: version,
        changelog,
        app_metadata: appMetadata,
        loki_metadata: issueMetadata,
        is_feature_update: isFeatureUpdate,
        is_bugfix: isBugfix,
        is_other: !isFeatureUpdate && !isBugfix,
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
