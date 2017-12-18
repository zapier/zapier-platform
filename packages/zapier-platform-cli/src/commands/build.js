const constants = require('../constants');
const utils = require('../utils');

const build = context => {
  context.line('Building project.\n');
  return utils.build().then(() => {
    context.line(
      `\nBuild complete! Moved to ${
        constants.BUILD_PATH
      }! Try the \`zapier upload\` command now.`
    );
  });
};
build.argsSpec = [];
build.argOptsSpec = {
  'disable-dependency-detection': {
    flag: true,
    help: 'disables walking required files to slim the build'
  },
  'include-js-map': {
    flag: true,
    help: 'include .js.map files (usually source maps'
  }
};
build.help = 'Builds a pushable zip from the current directory.';
build.example = 'zapier build';
build.docs = `
Builds a ready-to-upload zip file, but does not upload / push the zip file. Generally you'd use \`zapier push\` which does this and \`zapier upload\` together.

It does the following steps:

* Creates a temporary folder
* Copies all code into the temporary folder
* Adds an entry point \`zapierwrapper.js\`
* Generates and validates app definition.
* Detects dependencies via browserify (optional)
* Zips up all needed \`.js\` files. If you want to include more files, add a "includeInBuild" property (array with strings of regexp paths) to your \`${
  constants.CURRENT_APP_FILE
}\`.
* Moves the zip to \`${constants.BUILD_PATH}\`

> If you get live errors like \`Error: Cannot find module 'some-path'\`, try disabling dependency detection.

**Arguments**

${utils.argsFragment(build.argsSpec)}
${utils.argOptsFragment(build.argOptsSpec)}

${'```'}bash
$ zapier build
# Building project.
#
#   Copying project to temp directory - done!
#   Installing project dependencies - done!
#   Applying entry point file - done!
#   Validating project - done!
#   Building app definition.json - done!
#   Zipping project and dependencies - done!
#   Cleaning up temp directory - done!
#
# Build complete!
${'```'}
`;

module.exports = build;
