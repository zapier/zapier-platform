const { Flags } = require('@oclif/core');
const chalk = require('chalk');

const BaseCommand = require('../ZapierBaseCommand');
const ValidateCommand = require('./validate');
const constants = require('../../constants');
const { buildFlags } = require('../buildFlags');
const { readCredentials } = require('../../utils/api');
const { runCommand } = require('../../utils/misc');
const { getPackageManager } = require('../../utils/package-manager');

class TestCommand extends BaseCommand {
  async perform() {
    if (!this.flags['skip-validate']) {
      await ValidateCommand.run(['--invokedFromAnotherCommand']);
    }

    const extraEnv = {
      ZAPIER_BASE_ENDPOINT: constants.BASE_ENDPOINT,
    };

    if (this.debug.enabled) {
      extraEnv.LOG_TO_STDOUT = 'true';
      extraEnv.DETAILED_LOG_TO_STDOUT = 'true';
    }

    const credentials = await readCredentials(false);
    if (credentials.deployKey) {
      this.log(
        `Adding ${constants.AUTH_LOCATION} to environment as ZAPIER_DEPLOY_KEY...`,
      );
      extraEnv.ZAPIER_DEPLOY_KEY = credentials.deployKey;
    }

    const env = Object.assign({}, process.env, extraEnv);

    const packageManager = await getPackageManager(this.flags);

    const passthroughArgs = this.argv.includes('--')
      ? this.argv.slice(this.argv.indexOf('--') + 1)
      : [];

    const argv = [
      'run',
      '--silent',
      'test',
      packageManager.useDoubleHyphenBeforeArgs ? '--' : '',
      ...passthroughArgs,
    ].filter(Boolean);

    this.log('Running test suite with the following command:');
    // some extra formatting happen w/ quotes so it's clear when they're already like that in the array,
    // but the space-joined array made that unclear
    this.log(
      `\n  ${chalk.cyanBright.bold(
        packageManager.executable,
      )} ${chalk.cyanBright(
        argv.map((a) => (a.includes(' ') ? `"${a}"` : a)).join(' '),
      )}\n`,
    );

    const output = await runCommand(packageManager.executable, argv, {
      stdio: 'inherit',
      env,
    });
    if (output.stdout) {
      this.log(output.stdout);
    }
  }
}

TestCommand.flags = buildFlags({
  commandFlags: {
    'skip-validate': Flags.boolean({
      description:
        "Forgo running `zapier validate` before tests are run. This will speed up tests if you're modifying functionality of an existing integration rather than adding new actions.",
    }),
    yarn: Flags.boolean({
      description:
        "Use `yarn` instead of `npm`. This happens automatically if there's a `yarn.lock` file, but you can manually force `yarn` if you run tests from a sub-directory.",
    }),
    pnpm: Flags.boolean({
      description:
        "Use `pnpm` instead of `npm`. This happens automatically if there's a `pnpm-lock.yaml` file, but you can manually force `pnpm` if you run tests from a sub-directory.",
    }),
  },
});

TestCommand.skipValidInstallCheck = false;
TestCommand.strict = false;
TestCommand.examples = [
  'zapier test',
  'zapier test --skip-validate -- -t 30000 --grep api',
  'zapier test -- -fo --testNamePattern "auth pass"',
];
TestCommand.description = `Test your integration via the "test" script in your "package.json".

This command is a wrapper around \`npm test\` that also validates the structure of your integration and sets up extra environment variables.

You can pass any args/flags after a \`--\`; they will get forwarded onto your test script.`;

module.exports = TestCommand;
