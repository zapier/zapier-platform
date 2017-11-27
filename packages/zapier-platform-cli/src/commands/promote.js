const colors = require('colors/safe');
const utils = require('../utils');

const promote = (context, version) => {
  if (!version) {
    context.line('Error: No deploment/version selected...\n');
    return Promise.resolve();
  }

  let appId = 0;

  return utils.checkCredentials()
    .then(() => utils.getLinkedApp())
    .then((app) => {
      context.line(`Preparing to promote version ${version} of your app "${app.title}".\n`);
      const url = `/apps/${app.id}/versions/${version}/promote/production`;
      appId = app.id;
      utils.printStarting(`Promoting ${version}`);
      return utils.callAPI(url, {
        method: 'PUT',
        body: {}
      }, false);
    })
    .then(() => {
      utils.printDone();
      context.line('  Promotion successful!\n');
      context.line('Optionally try the `zapier migrate 1.0.0 1.0.1 [10%]` command to move users to this version.');
    })
    .catch((error) => {
      // The server 403's when the app hasn't been approved yet
      if (error.message.indexOf('You cannot promote until we have approved your app.') !== -1) {
        utils.printDone();
        context.line('\nGood news! Your app passes validation and has the required number of testers and active Zaps.\n');
        context.line(`The next step is to visit: ${colors.cyan(`https://zapier.com/developer/builder/cli-app/${appId}/activate/${version}`)} to request public activation of your app.\n`);
      } else {
        throw error;
      }
    });
};
promote.argsSpec = [
  {name: 'version', example: '1.0.0', required: true},
];
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
# Preparing to promote version 1.0.0 your app "Example".
#
#   Promoting 1.0.0 - done!
#   Promotion successful!
#
# Optionally try the \`zapier migrate 1.0.0 1.0.1 [10%]\` command to move users to this version.
${'```'}
`;

module.exports = promote;
