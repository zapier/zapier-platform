const utils = require('../utils');

const deleteApp = (context, app) => {
  context.line(
    `Preparing to delete all versions of your app "${app.title}".\n`
  );
  utils.startSpinner('Deleting app');
  return utils.callAPI(`/apps/${app.id}`, {
    method: 'DELETE'
  });
};

const deleteVersion = (context, app, version) => {
  context.line(
    `Preparing to delete version ${version} of your app "${app.title}".\n`
  );
  utils.startSpinner(`Deleting version ${version}`);
  return utils.callAPI(`/apps/${app.id}/versions/${version}`, {
    method: 'DELETE'
  });
};

const _delete = (context, appOrVersion, version) => {
  const isDeletingVersion = appOrVersion === 'version';
  if (isDeletingVersion && !version) {
    const message = 'Error: No version - provide a version like "1.0.0"...';
    return Promise.reject(new Error(message));
  }
  return utils
    .checkCredentials()
    .then(() => utils.getLinkedApp())
    .then(
      app =>
        isDeletingVersion
          ? deleteVersion(context, app, version)
          : deleteApp(context, app)
    )
    .then(() => {
      utils.endSpinner();
      context.line('  Deletion successful!\n');
    });
};
_delete.argsSpec = [
  {
    name: 'appOrVersion',
    example: 'version',
    choices: ['app', 'version'],
    required: true,
    help: 'delete the whole app, or just a version?'
  },
  {
    name: 'version',
    example: '1.0.0',
    required: false,
    help: 'the version to delete'
  }
];
_delete.argOptsSpec = {};
_delete.help =
  'Delete a version of your app (or the whole app) as long as it has no users/Zaps.';
_delete.example = 'zapier delete version 1.0.0';
_delete.docs = `
A utility to allow deleting app versions that aren't used.

> The app version needs to have no users/Zaps in order to be deleted.

**Arguments**

${utils.argsFragment(_delete.argsSpec)}
${utils.argOptsFragment(_delete.argOptsSpec)}

${'```'}bash
$ zapier delete version 1.0.0
# Preparing to delete version 1.0.0 of your app "Example".
#
#   Deleting 1.0.0 - done!
#   Deletion successful!
${'```'}
`;

module.exports = _delete;
