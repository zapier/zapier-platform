const ZapierBaseCommand = require('../ZapierBaseCommand');

const BuildCommand = require('./build');
const { downloadRemoteApp } = require('../../utils/pull');

class PullCommand extends ZapierBaseCommand {
  async perform() {
    await downloadRemoteApp(
      { build: true, upload: true },
      {
        skipNpmInstall: this.flags['skip-npm-install'],
        disableDependencyDetection: this.flags['disable-dependency-detection'],
        skipValidation: this.flags['skip-validation'],
      }
    );
    this.log(`\nPull complete! Pulled down app from remote repository.`);
  }
}

PullCommand.flags = BuildCommand.flags;
PullCommand.description = `EXPERIMENT: Pulls down the app from the remote repository.

Note: This will overwrite any changes you have made locally.
`;

module.exports = PullCommand;
