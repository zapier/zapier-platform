const ZapierBaseCommand = require('../ZapierBaseCommand');
const { CURRENT_APP_FILE, MAX_DESCRIPTION_LENGTH } = require('../../constants');
const { buildFlags } = require('../buildFlags');
const { callAPI, writeLinkedAppConfig } = require('../../utils/api');

const { flags } = require('@oclif/command');

class RegisterCommand extends ZapierBaseCommand {
  async perform() {
    // Flag validation
    this._validateEnumFlags();
    if (
      'desc' in this.flags &&
      this.flags.desc.length > MAX_DESCRIPTION_LENGTH
    ) {
      throw new Error(
        `Please provide a description that is ${MAX_DESCRIPTION_LENGTH} characters or less.`
      );
    }

    const appMeta = await this._promptForAppMeta();

    this.startSpinner(`Registering your new integration "${appMeta.title}"`);
    const app = await callAPI('/apps?formId=create', {
      method: 'POST',
      body: appMeta,
    });
    this.stopSpinner();
    this.startSpinner(
      `Linking app to current directory with \`${CURRENT_APP_FILE}\``
    );
    await writeLinkedAppConfig(app, process.cwd());
    this.stopSpinner();
    this.log(
      '\nFinished! Now that your integration is registered with Zapier, you can `zapier push`!'
    );
  }

  _validateEnumFlags() {
    const flagFieldMappings = {
      audience: 'intention',
      role: 'role',
      category: 'app_category',
    };

    for (const [flag, flagValue] of Object.entries(this.flags)) {
      // Only validate user input for enum flags (in flagFieldMappings)
      if (!flagFieldMappings[flag]) {
        continue;
      }

      // Check user input against this.config.enumFieldChoices (retrieved in getAppRegistrationFieldChoices hook)
      const enumFieldChoices =
        this.config.enumFieldChoices[flagFieldMappings[flag]];
      if (!enumFieldChoices.find((option) => option.value === flagValue)) {
        throw new Error(
          `${flagValue} is not a valid value for ${flag}. Must be one of the following: ${enumFieldChoices
            .map((option) => option.value)
            .join(', ')}`
        );
      }
    }
  }

  async _promptForAppMeta() {
    const appMeta = {};

    appMeta.title = this.args.title?.trim();
    if (!appMeta.title) {
      appMeta.title = await this.prompt(
        'What is the title of your integration?',
        { required: true }
      );
    }

    appMeta.description = this.flags.desc?.trim();
    if (!appMeta.description) {
      appMeta.description = await this.prompt(
        `Please provide a sentence describing your app in ${MAX_DESCRIPTION_LENGTH} characters or less.`,
        { required: true, charLimit: MAX_DESCRIPTION_LENGTH }
      );
    }

    appMeta.homepage_url = this.flags.url;
    if (!appMeta.homepage_url) {
      appMeta.homepage_url = await this.prompt(
        'What is the homepage URL of your app? (optional)'
      );
    }

    appMeta.intention = this.flags.audience;
    if (!appMeta.intention) {
      appMeta.intention = await this.promptWithList(
        'Are you building a public or private integration?',
        this.config.enumFieldChoices.intention
      );
    }

    appMeta.role = this.flags.role;
    if (!appMeta.role) {
      appMeta.role = await this.promptWithList(
        "What is your relationship with the app you're integrating with Zapier?",
        this._getRoleChoicesWithAppTitle(
          appMeta.title,
          this.config.enumFieldChoices.role
        )
      );
    }

    appMeta.app_category = this.flags.category;
    if (!appMeta.app_category) {
      appMeta.app_category = await this.promptWithList(
        'How would you categorize your app?',
        this.config.enumFieldChoices.app_category
      );
    }

    appMeta.subscription = this.flags.subscribe;
    // boolean field, so using `typeof` === `undefined`
    if (typeof appMeta.subscription === 'undefined') {
      appMeta.subscription = await this.promptWithList(
        'Subscribe to Updates about your Integration',
        [
          { name: 'Yes', value: true },
          { name: 'No', value: false },
        ]
      );
    }

    return appMeta;
  }

  _getRoleChoicesWithAppTitle(title, choices) {
    return choices.map((choice) => ({
      value: choice.value,
      name: choice.name.replace('[app_title]', title),
    }));
  }
}

RegisterCommand.skipValidInstallCheck = true;
RegisterCommand.args = [
  {
    name: 'title',
    description:
      "Your integrations's public title. Asked interactively if not present.",
  },
];

RegisterCommand.flags = buildFlags({
  commandFlags: {
    desc: flags.string({
      char: 'D',
      description: `A sentence describing your app in ${MAX_DESCRIPTION_LENGTH} characters or less, e.g. "Trello is a team collaboration tool to organize tasks and keep projects on track."`,
    }),
    url: flags.string({
      char: 'u',
      description: 'The homepage URL of your app, e.g., https://example.com.',
    }),
    audience: flags.string({
      char: 'a',
      description: 'Are you building a public or private integration?',
    }),
    role: flags.string({
      char: 'r',
      description:
        "What is your relationship with the app you're integrating with Zapier?",
    }),
    category: flags.string({
      char: 'c',
      description:
        "How would you categorize your app? Choose the most appropriate option for your app's core features.",
    }),
    subscribe: flags.boolean({
      char: 's',
      description:
        'Get tips and recommendations about this integration along with our monthly newsletter that details the performance of your integration and the latest Zapier news.',
      allowNo: true,
    }),
  },
});
RegisterCommand.examples = [
  'zapier register',
  'zapier register "My Cool Integration"',
  'zapier register "My Cool Integration" --desc "My Cool Integration helps you integrate your apps with the apps that you need." --no-subscribe',
  'zapier register "My Cool Integration" --url "https://www.zapier.com" --audience private --role employee --category marketing-automation',
  'zapier register --subscribe',
];
RegisterCommand.description = `Register a new integration in your account.

After running this, you can run \`zapier push\` to build and upload your integration for use in the Zapier editor.

This will change the  \`./${CURRENT_APP_FILE}\` (which identifies this directory as holding code for a specific integration).`;

module.exports = RegisterCommand;
