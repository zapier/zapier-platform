const { flags: Flags } = require('@oclif/command');

const BaseCommand = require('../baseCommand');
const buildFlags = require('../buildFlags');
const { build } = require('../utils/build');
const { BUILD_PATH, SOURCE_PATH } = require('../constants');

const dumbPathsFlag = 'disable-dependency-detection';
const mapFlag = 'include-js-map';

class BuildCommand extends BaseCommand {
  async run() {
    this.flags = this.parse(BuildCommand).flags;
    // flags['disable-dependecy-injection'] is ugly, so let's make the opts better for programming
    // alternatively, rename the flag to something without dashes. camelCase works fine
    const opts = {
      dumbPaths: Boolean(this.flags[dumbPathsFlag]),
      includeMaps: Boolean(this.flags[mapFlag])
    };

    await build(opts);

    this.log(
      `\nBuild complete! Moved ${BUILD_PATH} and ${SOURCE_PATH} ! Try the \`zapier upload\` command now.`
    );
  }
}

BuildCommand.rawFlags = {
  [dumbPathsFlag]: Flags.boolean({
    char: 'd',
    description:
      'Disables smart inclusion of files. Using this may cause the build to be too big.'
  }),
  [mapFlag]: Flags.boolean({
    char: 'm',
    description: 'include .js.map files (usually source maps) in the build'
  })
};

BuildCommand.flags = buildFlags(BuildCommand.rawFlags);

module.exports = BuildCommand;
