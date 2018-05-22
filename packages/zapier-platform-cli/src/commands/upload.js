const constants = require('../constants');
const utils = require('../utils');

const upload = context => {
  context.line('Preparing to upload a new version.\n');
  return utils.upload().then(() => {
    context.line(
      `\nUpload of ${constants.BUILD_PATH} and ${
        constants.SOURCE_PATH
      } complete! Try \`zapier versions\` now!`
    );
  });
};
upload.argsSpec = [];
upload.argOptsSpec = {};
upload.help = 'Upload the last build as a version.';
upload.example = 'zapier upload';
upload.docs = `
Upload the zip files already built by \`zapier build\` in build/build.zip and build/source.zip. The version and other app details are read by Zapier from the zip files.

> Note: we generally recommend using \`zapier push\` which does both \`zapier build && zapier upload\` in one step.

${'```'}bash
$ zapier upload
# Preparing to upload a new version.
#
#   Uploading version 1.0.0 - done!
#
# Upload of build/build.zip and build/source.zip complete! Try \`zapier versions\` now!
${'```'}
`;

module.exports = upload;
