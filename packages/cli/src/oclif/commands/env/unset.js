const { cyan } = require('colors/safe');

const BaseCommand = require('../../ZapierBaseCommand');
const { buildFlags } = require('../../buildFlags');
const { callAPI } = require('../../../utils/api');

const successMessage = (version) =>
  `Successfully unset the following keys in the environment of version ${cyan(
    version
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
        `Version ${version} doesn't exist on integration "${app.title}"`
      );
    }

    const url = `/apps/${app.id}/versions/${version}/multi-environment`;

    // currently, this returns nothing
    // also, no need to cath errors here, since invalid keys don't get tripped over if the env var didn't exist in the first place
    await callAPI(url, {
      body: payload,
      method: 'POST',
    });

    this.log(successMessage(version));
    this.logJSON(keysToUnset);
  }
}

UnsetEnvCommand.args = [
  {
    name: 'version',
    description: 'The version to set the environment for.',
    required: true,
  },
  {
    name: 'keys...',
    description: 'The keys to unset. Keys are case-insensitive.',
  },
];
UnsetEnvCommand.flags = buildFlags();
UnsetEnvCommand.description = `Unset environment variables for a version.`;
UnsetEnvCommand.examples = [`zapier env:unset 1.2.3 SECRET OTHER`];
UnsetEnvCommand.strict = false;
UnsetEnvCommand.skipValidInstallCheck = true;

module.exports = UnsetEnvCommand;
