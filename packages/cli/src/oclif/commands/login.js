const colors = require('colors/safe');

const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');

const {
  AUTH_LOCATION,
  AUTH_LOCATION_RAW,
  AUTH_KEY
} = require('../../constants');
const {
  readCredentials,
  checkCredentials,
  createCredentials
} = require('../../utils/api');
const { writeFile } = require('../../utils/files');
const { prettyJSONstringify } = require('../../utils/display');

const isValidTotpCode = i => {
  const num = parseInt(i, 10);
  return Number.isInteger(num) && i.length === 6
    ? true
    : 'Must be a 6 digit number';
};

class LoginCommand extends BaseCommand {
  async perform() {
    const checks = [
      readCredentials()
        .then(() => true)
        .catch(() => false),
      checkCredentials()
        .then(() => true)
        .catch(() => false)
    ];
    const [credentialsPresent, credentialsGood] = await Promise.all(checks);

    if (!credentialsPresent) {
      this.log(
        colors.yellow(`Your ${AUTH_LOCATION} has not been set up yet.\n`)
      );
    } else if (!credentialsGood) {
      this.log(
        colors.red(
          `Your ${AUTH_LOCATION} looks like it has invalid credentials.\n`
        )
      );
    } else {
      this.log(
        colors.green(
          `Your ${AUTH_LOCATION} looks valid. You may update it now though.\n`
        )
      );
    }
    const username = await this.prompt(
      'What is your Zapier login email address? (Ctrl-C to cancel)'
    );
    this.log(
      `\n\nNow you'll enter your Zapier password.\nIf you log into Zapier via the ${colors.green(
        'log in with Google button'
      )}, you may not have a Zapier password.\nIf that's the case, go to https://zapier.com/app/login/forgot and create one.\n\n`
    );
    const password = await this.promptHidden(
      'What is your Zapier login password?'
    );

    let goodResponse;
    try {
      goodResponse = await createCredentials(username, password);
    } catch ({ errText, json: { errors } }) {
      if (errors[0].startsWith('missing totp_code')) {
        const code = await this.prompt(
          'What is your current 6-digit 2FA code?',
          { validate: isValidTotpCode }
        );
        goodResponse = await createCredentials(username, password, code);
      } else {
        this.error(errText);
      }
    }
    const deployKey = goodResponse.key;
    await writeFile(
      AUTH_LOCATION,
      prettyJSONstringify({
        [AUTH_KEY]: deployKey
      })
    );

    await checkCredentials();

    this.log(`Your deploy key has been saved to ${AUTH_LOCATION}. `);
  }
}

LoginCommand.flags = buildFlags();
LoginCommand.examples = ['zapier login'];
LoginCommand.description = `Configure your \`${AUTH_LOCATION_RAW}\` with a deploy key.`;

module.exports = LoginCommand;
