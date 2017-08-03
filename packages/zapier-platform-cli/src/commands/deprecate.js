const utils = require('../utils');

const deprecate = (context, version, deprecationDate) => {
  if (!deprecationDate) {
    const message = 'Error: No version or deprecation date - provide a version like "1.0.0" and "2017-01-20"...';
    return Promise.reject(new Error(message));
  }
  return utils.checkCredentials()
    .then(() => utils.getLinkedApp())
    .then((app) => {
      context.line(`Preparing to deprecate version ${version} your app "${app.title}".\n`);
      const url = '/apps/' + app.id + '/versions/' + version + '/deprecate';
      utils.printStarting(`Deprecating ${version}`);
      return utils.callAPI(url, {
        method: 'PUT',
        body: {
          deprecation_date: deprecationDate
        }
      });
    })
    .then(() => {
      utils.printDone();
      context.line('  Deprecation successful!\n');
      context.line(`We'll let users know that this version is no longer recommended and will cease to work on ${deprecationDate}.`);
    });
};
deprecate.argsSpec = [
  {name: 'version', example: '1.0.0', required: true, help: 'the version to deprecate'},
  {name: 'deprecationDate', example: '2017-01-20', required: true, help: 'date Zapier will make the version unavailable'},
];
deprecate.argOptsSpec = {};
deprecate.help = 'Mark a non-production version of your app as deprecated, with removal by a certain date.';
deprecate.example = 'zapier deprecate 1.0.0 2017-01-20';
deprecate.docs = `
A utility to alert users of breaking changes that require the deprecation of an app version.

Use this when an app version will not be supported or start breaking at a known date.

Zapier will send an email warning users of the deprecation once a date is set, they'll start seeing it as "Deprecated" in the UI, and once the deprecation date arrives, if the Zaps weren't updated, they'll be paused and the users will be emailed again explaining what happened.

After the deprecation date has passed it will be safe to delete that app version.

> Do not use this if you have non-breaking changes, for example, just fixing help text or labels is a very safe operation.

**Arguments**

${utils.argsFragment(deprecate.argsSpec)}
${utils.argOptsFragment(deprecate.argOptsSpec)}

${'```'}bash
$ zapier deprecate 1.0.0 2017-01-20
# Preparing to deprecate version 1.0.0 your app "Example".
#
#   Deprecating 1.0.0 - done!
#   Deprecation successful!
#
# We'll let users know that this version is no longer recommended and will cease to work on 2017-01-20.
${'```'}
`;

module.exports = deprecate;
