const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');
const { flags } = require('@oclif/command');
const {
  BUILD_PATH,
  SOURCE_PATH,
  CURRENT_APP_FILE
} = require('../../constants');

const { buildAndOrUpload } = require('../../utils/build');

class BuildCommand extends BaseCommand {
  async perform() {
    this.log('Building Project\n');
    await buildAndOrUpload(
      { build: true },
      {
        skipNpmInstall: this.flags['skip-npm-install'],
        disableDependencyDetection: this.flags['disable-dependency-detection']
      }
    );

    this.log(
      `\nBuild complete! Created ${BUILD_PATH} and ${SOURCE_PATH}. Try the \`zapier upload\` command now.`
    );
  }
}

BuildCommand.flags = buildFlags({
  commandFlags: {
    'disable-dependency-detection': flags.boolean({
      description: `Disables "smart" file inclusion. By default, Zapier only includes files that are required by \`index.js\`. If you (or your dependencies) require files dynamically (such as with \`require(someVar)\`), then you may see "Cannot find module" errors. Disabling this may make your \`build.zip\` too large. If that's the case, try using the \`includeInBuild\` option in your \`${CURRENT_APP_FILE}\`. [See the docs](includeInBuild) for more info.`
    }),
    'skip-npm-install': flags.boolean({
      description:
        'Skips installing a fresh copy of npm dependencies on build. Helpful for using `yarn` or local copies of dependencies.',
      hidden: true
    })
  }
});
BuildCommand.description = `Builds a pushable zip from the current directory.

This command does the following:

* Creates a temporary folder
* Copies all code into the temporary folder
* Adds an entry point: \`zapierwrapper.js\`
* Generates and validates app definition.
* Detects dependencies via browserify (optional, on by default)
* Zips up all needed \`.js\` files. If you want to include more files, add a "includeInBuild" property (array with strings of regexp paths) to your \`${CURRENT_APP_FILE}\`.
* Moves the zip to \`${BUILD_PATH}\` and \`${SOURCE_PATH}\` and deletes the temp folder

This command is typically followed by \`zapier upload\`.`;

module.exports = BuildCommand;
