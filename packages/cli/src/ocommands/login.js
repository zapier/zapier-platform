const colors = require('colors/safe');
const { AUTH_LOCATION, AUTH_KEY } = require('../constants');

const BaseCommand = require('../baseCommand');
const {
  checkCredentials,
  readCredentials,
  createCredentials
} = require('../utils/api');
const { writeFile } = require('../utils/files');
const { prettyJSONstringify } = require('../utils/display');

const QUESTION_USERNAME =
  'What is your Zapier login email address? (Ctrl-C to cancel)';
const QUESTION_PASSWORD = 'What is your Zapier login password?';
const QUESTION_TOTP = 'What is your current 6-digit 2FA code?';

class LoginCommand extends BaseCommand {
  async run() {
    this.flags = this.parse(LoginCommand).flags;

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

    const username = await this.prompt(QUESTION_USERNAME);
    this.log(
      "\nNow you'll enter your Zapier password. If you log into Zapier via the Google button, you may not have a Zapier password. If that's the case, go to https://zapier.com/app/login/forgot and create one.\n"
    );
    const password = await this.prompt(QUESTION_PASSWORD, { hide: true });

    let goodResponse;
    try {
      goodResponse = await createCredentials(username, password);
    } catch ({ errText, json: { errors } }) {
      if (errors[0].startsWith('missing totp_code')) {
        const code = await this.prompt(QUESTION_TOTP);
        goodResponse = await createCredentials(username, password, code);
      } else {
        throw new Error(errText);
      }
    }

    const deployKey = goodResponse.key;

    await writeFile(
      AUTH_LOCATION,
      prettyJSONstringify({
        [AUTH_KEY]: deployKey
      })
    );

    await checkCredentials(); // last check to make sure everything is happy

    context.line(
      `Your deploy key has been successfully saved to ${AUTH_LOCATION}. `
    );
  }
}

module.exports = LoginCommand;
