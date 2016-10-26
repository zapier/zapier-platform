const utils = require('../utils');

const promote = (context, version) => {
  if (!version) {
    context.line('Error: No deploment/version selected...\n');
    return Promise.resolve();
  }

  return utils.checkCredentials()
    .then(() => utils.getLinkedApp())
    .then((app) => {
      context.line(`Preparing to promote version ${version} your app "${app.title}".\n`);
      const url = `/apps/${app.id}/versions/${version}/promote/production`;
      utils.printStarting(`Promoting ${version}`);
      return utils.callAPI(url, {
        method: 'PUT',
        body: {}
      });
    })
    .then(() => {
      utils.printDone();
      context.line(`  Promition successful!\n`);
      context.line('Optionally try the `zapier migrate 1.0.0 1.0.1 [10%]` command to move users to this version.');
    });
};
promote.argsSpec = [
  {name: 'version', example: '1.0.0', required: true},
];
promote.argOptsSpec = {};
promote.help = 'Promotes a specific version to global access.';
promote.example = 'zapier promote 1.0.0';
promote.docs = `\
Promotes an app version into production (non-private) rotation, which means new users can use this app version.

* This **does** mark the version as the official global version - all other versions & users are grandfathered.
* This **does not** build/upload or deploy a version to Zapier - you should \`zapier push\` first.
* This **does not** move old users over to this version - \`zapier migrate 1.0.0 1.0.1\` does that.
* This **does not** recommend old users stop using this version - \`zapier deprecate 1.0.0 2017-01-01\` does that.

Promotes are an inherently safe operation for all existing users of your app.

> If this is your first time promoting - this will start the platform quality assurance process by alerting the Zapier platform team of your intent to go global. We'll respond within a few business days.

**Arguments**

${utils.argsFragment(promote.argsSpec)}
${utils.argOptsFragment(promote.argOptsSpec)}

${'```'}bash
$ zapier promote 1.0.0
# Preparing to promote version 1.0.0 your app "Example".
# 
#   Promoting 1.0.0 - done!
#   Promition successful!
# 
# Optionally try the \`zapier migrate 1.0.0 1.0.1 [10%]\` command to move users to this version.
${'```'}
`;

module.exports = promote;
