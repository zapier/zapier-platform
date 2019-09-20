const { flags } = require('@oclif/command');

const BaseCommand = require('../ZapierBaseCommand');
const ValidateCommand = require('./validate');
const constants = require('../../constants');
const { buildFlags } = require('../buildFlags');
const { readCredentials } = require('../../utils/api');
const { runCommand } = require('../../utils/misc');

class TestCommand extends BaseCommand {
  async perform() {
    if (!this.flags['skip-validate']) {
      await ValidateCommand.run([]);
      if (process.exitCode) {
        return;
      }
    }

    const extraEnv = {
      ZAPIER_BASE_ENDPOINT: constants.BASE_ENDPOINT
    };

    if (this.debug.enabled) {
      extraEnv.LOG_TO_STDOUT = 'true';
      extraEnv.DETAILED_LOG_TO_STDOUT = 'true';
    }

    const credentials = await readCredentials(false);
    if (credentials.deployKey) {
      this.log(
        `Adding ${constants.AUTH_LOCATION} to environment as ZAPIER_DEPLOY_KEY...`
      );
      extraEnv.ZAPIER_DEPLOY_KEY = credentials.deployKey;
    }

    const env = Object.assign({}, process.env, extraEnv);
    const argv = [
      'run',
      '--silent',
      'test',
      '--',
      `--timeout=${this.flags.timeout}`
    ];
    if (this.flags.grep) {
      argv.push(`--grep=${this.flags.grep}`);
    }

    this.log('Running test suite.');

    const packageManager = this.flags.yarn ? 'yarn' : 'npm';
    const output = await runCommand(packageManager, argv, {
      stdio: 'inherit',
      env
    });
    if (output.stdout) {
      this.log(output.stdout);
    }
  }
}

TestCommand.flags = buildFlags({
  commandFlags: {
    timeout: flags.integer({
      char: 't',
      description: 'Set test-case timeout in milliseconds',
      default: 2000
    }),
    grep: flags.string({
      description: 'Only run tests matching pattern'
    }),
    'skip-validate': flags.boolean({
      description: 'Forgo running `zapier validate` before `npm test`'
    }),
    yarn: flags.boolean({
      description: 'Use yarn instead of npm'
    })
  }
});

TestCommand.args = [];

TestCommand.examples = [
  'zapier test',
  'zapier test -t 30000 --grep api --skip-validate'
];
TestCommand.description = `Tests your app via \`npm test\`.

This command is effectively the same as \`npm test\`, except we also validate your app and set up the environment. We recommend using mocha as your testing framework.`;

module.exports = TestCommand;
