const { flags: Flags } = require('@oclif/command');

const BaseCommand = require('../baseCommand');

const dumbPathsFlag = 'disable-dependency-detection';
const mapFlag = 'include-js-map';

class BuildCommand extends BaseCommand {
  async run() {
    this.flags = this.parse(BuildCommand).flags;

    this.log('very cool');

    console.log('building!', this.flags);
  }
}

BuildCommand.flags = BaseCommand.buildFlags({
  [dumbPathsFlag]: Flags.boolean({
    char: 'd',
    description:
      'Disables smart inclusion of files. Using this may cause the build to be too big.'
  }),
  [mapFlag]: Flags.boolean({
    char: 'm',
    description: 'include .js.map files (usually source maps) in the build'
  })
});

module.exports = BuildCommand;
