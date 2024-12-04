const colors = require('colors/safe');

const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');
const { Flags } = require('@oclif/core');

const {
  AUTH_LOCATION,
  AUTH_LOCATION_RAW,
  AUTH_KEY,
  BASE_ENDPOINT,
} = require('../../constants');
const {
  readCredentials,
  checkCredentials,
  createCredentials,
} = require('../../utils/api');
const { writeFile } = require('../../utils/files');
const { prettyJSONstringify } = require('../../utils/display');
const { isSamlEmail } = require('../../utils/credentials');

const getDeployKeyUrl = () => {
  const url = new URL(BASE_ENDPOINT);
  url.hostname = `developer.${url.hostname}`;
  url.pathname = 'partner-settings/deploy-keys/';
  return url.href;
};
const DEPLOY_KEY_DASH_URL = getDeployKeyUrl();

const isValidTotpCode = (i) => {
  const num = parseInt(i, 10);
  return Number.isInteger(num) && i.length === 6
    ? true
    : 'Must be a 6 digit number';
};
const isValidDeployKey = (k) =>
  k.length === 32
    ? true
    : `Must be a 32-character code copied from from ${DEPLOY_KEY_DASH_URL}`;

/**
 * there are a few says that someone might log into zapier:
 * 1. Username + Password
 * 2. Google/FB/etc SSO
 * 3. Company-configured SAML
 *
 * Group 1 will definitely have a password. Group 2 might have a password if they created one, but might not. Group 3 definitely will not.
 */
class LoginCommand extends BaseCommand {
  promptForDeployKey() {
    this.log(
      `To generate a deploy key, go to ${DEPLOY_KEY_DASH_URL} and create/copy a key, then paste the result below.`,
    );
    return this.prompt('Paste your Deploy Key here:', {
      validate: isValidDeployKey,
    });
  }

  async perform() {
    const checks = [
      readCredentials()
        .then(() => true)
        .catch(() => false),
      checkCredentials()
        .then(() => true)
        .catch(() => false),
    ];
    const [credentialsPresent, credentialsGood] = await Promise.all(checks);

    if (!credentialsPresent) {
      this.stopSpinner(); // end the spinner in checkCredentials()
      this.log(
        colors.yellow(`Your ${AUTH_LOCATION} has not been set up yet.\n`),
      );
    } else if (!credentialsGood) {
      this.log(
        colors.red(
          `Your ${AUTH_LOCATION} looks like it has invalid credentials.\n`,
        ),
      );
    } else {
      this.log(
        colors.green(
          `Your ${AUTH_LOCATION} looks valid. You may update it now though.\n`,
        ),
      );
    }

    let deployKey;

    if (this.flags.sso) {
      // category 3
      deployKey = await this.promptForDeployKey();
    } else {
      const email = await this.prompt(
        'What email address do you use to log into Zapier?',
      );
      if (await isSamlEmail(email)) {
        // category 2
        deployKey = await this.promptForDeployKey();
      } else {
        // category 1
        this.log(
          `\n\nNow you'll enter your Zapier password.\nIf you log into Zapier via the ${colors.green(
            'log in with Google button',
          )} (or a different social network), you may not have a Zapier password.\nIf that's the case, hit CTRL+C and re-run this command with the ${colors.cyan(
            `--sso`,
          )} flag.\n\n`,
        );
        const password = await this.promptHidden(
          'What is your Zapier password?',
        );

        let goodResponse;
        try {
          goodResponse = await createCredentials(email, password);
        } catch ({ errText, json: { errors } }) {
          if (errors[0].startsWith('missing totp_code')) {
            const code = await this.prompt(
              'What is your current 6-digit 2FA code?',
              { validate: isValidTotpCode },
            );
            goodResponse = await createCredentials(email, password, code);
          } else {
            this.error(errText);
          }
        }
        deployKey = goodResponse.key;
      }
    }
    await writeFile(
      AUTH_LOCATION,
      prettyJSONstringify({
        [AUTH_KEY]: deployKey,
      }),
    );

    await checkCredentials();

    this.log(`Your deploy key has been saved to ${AUTH_LOCATION}. `);
  }
}

LoginCommand.flags = buildFlags({
  commandFlags: {
    sso: Flags.boolean({
      char: 's',
      description:
        "Use this flag if you log into Zapier a Single Sign-On (SSO) button and don't have a Zapier password.",
    }),
  },
});
LoginCommand.description = `Configure your \`${AUTH_LOCATION_RAW}\` with a deploy key.`;
LoginCommand.skipValidInstallCheck = true;

module.exports = LoginCommand;
