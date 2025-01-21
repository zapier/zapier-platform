const { Args, Flags } = require('@oclif/core');
const { cyan } = require('colors/safe');

const BaseCommand = require('../../ZapierBaseCommand');
const { buildFlags } = require('../../buildFlags');
const { callAPI } = require('../../../utils/api');

const successMessage = (version) =>
  `Successfully unset the following keys in the environment of version ${cyan(
    version,
  )} (if they existed):`;

class UnsetEnvCommand extends BaseCommand {
  async perform() {
    const { version } = this.args;
    this.throwForInvalidVersion(version);
    // args should be [ '1.0.0', 'qer=123', 'qwer=123' ]
    const keysToUnset = this.argv
      .slice(1)
      .filter((k) => !k.startsWith('-'))
      .map((k) => k.toUpperCase());

    if (!keysToUnset.length) {
      this.error('Must specify at least one key to unset (like `SOME_KEY`)');
    }

    if (keysToUnset.some((v) => v.includes('='))) {
      this.error('Do not specify values using the unset operation, only keys');
    }

    // if we get here, we should have well-formed input
    const payload = keysToUnset.reduce((result, key) => {
      result[key] = null;
      return result;
    }, {});

    const app = await this.getWritableApp();
    if (!app.all_versions.includes(version)) {
      this.error(
        `Version ${version} doesn't exist on integration "${app.title}"`,
      );
    }

    const url = `/apps/${app.id}/versions/${version}/multi-environment`;
    const requestOptions = {
      body: payload,
      method: 'POST',
    };

    if (this.flags.force) {
      requestOptions.extraHeaders = {
        'X-Force-Env-Var-Update': 'true',
      };
    }

    try {
      await callAPI(url, requestOptions, true);
    } catch (e) {
      if (e.status === 409) {
        this.error(
          `App version ${version} is the production version. Are you sure you want to unset potentially live environment variables?` +
            ` If so, run this command again with the --force flag.`,
        );
      } else {
        throw e;
      }
    }

    this.log(successMessage(version));
    this.logJSON(keysToUnset);
  }
}

UnsetEnvCommand.args = {
  version: Args.string({
    description: 'The version to set the environment for.',
    required: true,
  }),
  'keys...': Args.string({
    description: 'The keys to unset. Keys are case-insensitive.',
  }),
};
UnsetEnvCommand.flags = buildFlags({
  commandFlags: {
    force: Flags.boolean({
      char: 'f',
      description:
        'Force the update of environment variables regardless if the app version is production or not. Use with caution.',
    }),
  },
});
UnsetEnvCommand.description = `Unset environment variables for a version.`;
UnsetEnvCommand.examples = [`zapier env:unset 1.2.3 SECRET OTHER`];
UnsetEnvCommand.strict = false;
UnsetEnvCommand.skipValidInstallCheck = true;

module.exports = UnsetEnvCommand;
