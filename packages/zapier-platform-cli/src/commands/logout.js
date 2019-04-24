const constants = require('../constants');
const utils = require('../utils');

const logout = async context => {
  context.line(
    'Preparing to deactivate personal deploy keys and reset local configs.'
  );
  context.line();
  utils.startSpinner('Deactivating personal deploy keys');
  try {
    await utils.callAPI('/keys', {
      method: 'DELETE'
    });
  } catch (e) {
    // no worries
  }

  utils.endSpinner();
  utils.startSpinner(`Destroying \`${constants.AUTH_LOCATION_RAW}\``);
  await utils.deleteFile(constants.AUTH_LOCATION);

  utils.endSpinner();
  context.line();
  context.line(
    'All personal deploy keys deactivated - now try `zapier login` to login again.'
  );
};
logout.argsSpec = [];
logout.argOptsSpec = {};
logout.help = `Deactivates all your personal deploy keys and resets \`${
  constants.AUTH_LOCATION_RAW
}\`.`;
logout.example = 'zapier logout';
logout.docs = `
Deactivates all your personal deploy keys and resets your local config. Does not delete any apps or versions.

> This will delete the  \`${
  constants.AUTH_LOCATION_RAW
}\` (home directory identifies the deploy key & user).

${'```'}bash
$ zapier logout
Preparing to deactivate personal deploy keys and reset local configs.

  Deactivating personal deploy keys - done!
  Destroying \`~/.zapierrc\` - done!

All personal keys deactivated - now try \`zapier login\` to login again.
${'```'}
`;

module.exports = logout;
