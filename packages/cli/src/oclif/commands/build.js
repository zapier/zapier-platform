const BaseCommand = require('../ZapierBaseCommand');
const { Flags } = require('@oclif/core');
const { buildFlags } = require('../buildFlags');
const {
  BUILD_PATH,
  SOURCE_PATH,
  CURRENT_APP_FILE,
} = require('../../constants');

const { buildAndOrUpload } = require('../../utils/build');

class BuildCommand extends BaseCommand {
  async perform() {
    await buildAndOrUpload(
      { build: true },
      {
        skipNpmInstall: this.flags['skip-npm-install'],
        disableDependencyDetection: this.flags['disable-dependency-detection'],
        skipValidation: this.flags['skip-validation'],
      },
    );

    this.log(
      `\nBuild complete! Created ${BUILD_PATH} and ${SOURCE_PATH}. Try the \`zapier upload\` command now.`,
    );
  }
}

BuildCommand.flags = buildFlags({
  commandFlags: {
    'disable-dependency-detection': Flags.boolean({
      description: `Disable "smart" file inclusion. By default, Zapier only includes files that are required by \`index.js\`. If you (or your dependencies) require files dynamically (such as with \`require(someVar)\`), then you may see "Cannot find module" errors. Disabling this may make your \`build.zip\` too large. If that's the case, try using the \`includeInBuild\` option in your \`${CURRENT_APP_FILE}\`. See the docs about \`includeInBuild\` for more info.`,
    }),
    'skip-npm-install': Flags.boolean({
      description:
        'Skips installing a fresh copy of npm dependencies on build. Helpful for using `yarn` or local copies of dependencies.',
      hidden: true,
    }),
    'skip-validation': Flags.boolean({
      description:
        "Skips local pre-push validation checks, and remote validation check of the CLI app's schema and AppVersion integrity.",
      hidden: true,
    }),
  },
});
BuildCommand.description = `Build a pushable zip from the current directory.

This command does the following:

* Creates a temporary folder
* Copies all code into the temporary folder
* Adds an entry point: \`zapierwrapper.js\`
* Generates and validates app definition.
* Detects dependencies via esbuild (optional, on by default)
* Zips up all needed \`.js\` files. If you want to include more files, add a "includeInBuild" property (array with strings of regexp paths) to your \`${CURRENT_APP_FILE}\`.
* Moves the zip to \`${BUILD_PATH}\` and \`${SOURCE_PATH}\` and deletes the temp folder

This command is typically followed by \`zapier upload\`.`;

module.exports = BuildCommand;
