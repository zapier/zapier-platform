const colors = require('colors/safe');
const utils = require('../utils');
const _ = require('lodash');

const hasCancelled = answer =>
  answer.toLowerCase() === 'n' ||
  answer.toLowerCase() === 'no' ||
  answer.toLowerCase() === 'cancel';
const hasAccepted = answer =>
  answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';

const promote = (context, version) => {
  if (!version) {
    context.line('Error: No deploment/version selected...\n');
    return Promise.resolve();
  }

  let app, changelog;

  return utils
    .checkCredentials()
    .then(() =>
      Promise.all([utils.getLinkedApp(), utils.getVersionChangelog(version)])
    )
    .then(([foundApp, foundChangelog]) => {
      app = foundApp;
      changelog = foundChangelog;

      context.line(
        `Preparing to promote version ${version} of your app "${app.title}".\n`
      );

      let action;

      if (changelog) {
        context.line(colors.green(`Changelog found for ${version}!`));
        context.line(`\n---\n${changelog}\n---\n`);
        action = () =>
          utils.getInput(
            'Would you like to continue promoting with this changelog? (y/n) (Ctrl-C to cancel)\n\n'
          );
      } else {
        context.line(
          `${colors.yellow(
            'Warning!'
          )} Changelog not found. Please create a \`CHANGELOG.md\` file in a format similar to ${colors.cyan(
            'https://gist.github.com/xavdid/b9ede3565f1188ce339292acc29612b2'
          )}, with user-facing descriptions.\n`
        );
        action = () =>
          utils.getInput(
            'Would you like to continue promoting without a changelog? (y/n)\n\n'
          );
      }

      const stop = answer => {
        if (!hasCancelled(answer) && !hasAccepted(answer)) {
          throw new Error('That answer is not valid. Please try "y" or "n".');
        }

        return hasCancelled(answer) || hasAccepted(answer);
      };

      return utils.promiseDoWhile(action, stop);
    })
    .then(answer => {
      if (hasCancelled(answer)) {
        throw new Error('Cancelled promote.');
      }

      const url = `/apps/${app.id}/versions/${version}/promote/production`;
      const body = {};

      if (changelog) {
        body.changelog = changelog;
      }

      utils.printStarting(`Verifying and promoting ${version}`);
      return utils.callAPI(
        url,
        {
          method: 'PUT',
          body
        },
        false,
        true
      );
    })
    .then(() => {
      utils.printDone();
      context.line('  Promotion successful!\n');
      context.line(
        'Optionally, run the `zapier migrate` command to move users to this version.'
      );
    })
    .catch(response => {
      // we probalby have a raw response, might have a thrown error
      // The server 403s when the app hasn't been approved yet
      if (_.get(response, 'json.activationInfo')) {
        utils.printDone();
        context.line(
          '\nGood news! Your app passes validation and has the required number of testers and active Zaps.\n'
        );
        context.line(
          `The next step is to visit: ${colors.cyan(
            `${response.json.activationInfo.url}`
          )} to request public activation of your app.\n`
        );
      } else {
        const errorList = _.get(response, 'json.errors');
        if (errorList) {
          const message = `Promotion failed for the following reasons:\n\n${errorList
            .map(e => `* ${e}`)
            .join('\n')}\n`;
          throw new Error(message);
        } else if (response.errText) {
          throw new Error(response.errText);
        } else {
          // is an actual error
          throw response;
        }
      }
    });
};
promote.argsSpec = [{ name: 'version', example: '1.0.0', required: true }];
promote.argOptsSpec = {};
promote.help = 'Promotes a specific version to public access.';
promote.example = 'zapier promote 1.0.0';
promote.docs = `
Promotes an app version into production (non-private) rotation, which means new users can use this app version.

* This **does** mark the version as the official public version - all other versions & users are grandfathered.
* This **does not** build/upload or deploy a version to Zapier - you should \`zapier push\` first.
* This **does not** move old users over to this version - \`zapier migrate 1.0.0 1.0.1\` does that.
* This **does not** recommend old users stop using this version - \`zapier deprecate 1.0.0 2017-01-01\` does that.

Promotes are an inherently safe operation for all existing users of your app.

> If this is your first time promoting - this will start the platform quality assurance process by alerting the Zapier platform team of your intent to make your app public. We'll respond within a few business days.

**Arguments**

${utils.argsFragment(promote.argsSpec)}
${utils.argOptsFragment(promote.argOptsSpec)}

${'```'}bash
$ zapier promote 1.0.0
# Preparing to promote version 1.0.0 of your app "Example".
* Changelog found for 1.0.0!
* ---
* Initial release!
* ---
#
#   Promoting 1.0.0 - done!
#   Promotion successful!
#
# Optionally try the \`zapier migrate 1.0.0 1.0.1 [10%]\` command to move users to this version.
${'```'}
`;

module.exports = promote;
