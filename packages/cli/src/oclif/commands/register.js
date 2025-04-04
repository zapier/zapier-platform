const colors = require('colors/safe');
const { Args, Flags } = require('@oclif/core');

const ZapierBaseCommand = require('../ZapierBaseCommand');
const {
  CURRENT_APP_FILE,
  MAX_DESCRIPTION_LENGTH,
  MIN_TITLE_LENGTH,
} = require('../../constants');
const { buildFlags } = require('../buildFlags');
const {
  callAPI,
  getLinkedAppConfig,
  getWritableApp,
  isPublished,
  writeLinkedAppConfig,
} = require('../../utils/api');

class RegisterCommand extends ZapierBaseCommand {
  /**
   * Entry point function that runs when user runs `zapier register`
   */
  async perform() {
    // Flag validation
    this._validateEnumFlags();

    if (
      'desc' in this.flags &&
      this.flags.desc.length > MAX_DESCRIPTION_LENGTH
    ) {
      throw new Error(
        `Please provide a description that is ${MAX_DESCRIPTION_LENGTH} characters or less.`,
      );
    }

    if (
      this.args.title !== undefined &&
      this.args.title.length < MIN_TITLE_LENGTH
    ) {
      throw new Error(
        `Please provide a title that is ${MIN_TITLE_LENGTH} characters or more.`,
      );
    }

    const { appMeta, action } = await this._promptForAppMeta();

    switch (action) {
      case 'update': {
        this.startSpinner(
          `Updating your existing integration "${appMeta.title}"`,
        );
        await callAPI(`/apps/${this.app.id}`, {
          method: 'PUT',
          body: appMeta,
        });
        this.stopSpinner();
        this.log('\nIntegration successfully updated!');
        break;
      }

      case 'register': {
        this.startSpinner(
          `Registering your new integration "${appMeta.title}"`,
        );
        const app = await callAPI('/apps?formId=create', {
          method: 'POST',
          body: appMeta,
        });
        this.stopSpinner();
        this.startSpinner(
          `Linking app to current directory with \`${CURRENT_APP_FILE}\``,
        );
        await writeLinkedAppConfig(app, process.cwd());
        this.stopSpinner();
        this.log(
          '\nFinished! Now that your integration is registered with Zapier, you can `zapier push`!',
        );
        break;
      }
    }
  }

  /**
   * Validates values provided for enum flags against options retrieved from the BE
   * (see getAppRegistrationFieldChoices hook for more details)
   */
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
            .join(', ')}`,
        );
      }
    }
  }

  /**
   * Prompts user for values that have not been provided
   * Flags can heavily impact the behavior of this function
   * @returns { appMeta: {object}, action: string }
   */
  async _promptForAppMeta() {
    const appMeta = {};

    const actionChoices = [
      { name: 'Yes, update current integration', value: 'update' },
      { name: 'No, register a new integration', value: 'register' },
    ];

    let action = actionChoices[1].value; // Default action is register

    const linkedAppId = (await getLinkedAppConfig(undefined, false))?.id;
    if (linkedAppId) {
      console.info(colors.yellow(`${CURRENT_APP_FILE} file detected.`));
      if (this.flags.yes) {
        console.info(
          colors.yellow(
            `-y/--yes flag passed, updating current integration (ID: ${linkedAppId}).`,
          ),
        );
        action = actionChoices[0].value;
      } else {
        action = await this.promptWithList(
          `Would you like to update your current integration (ID: ${linkedAppId})?`,
          actionChoices,
        );
      }
    }

    if (action === 'update') {
      this.startSpinner('Retrieving details for your integration');
      this.app = await getWritableApp();
      this.stopSpinner();

      // Block published apps from updating settings
      if (this.app?.status && isPublished(this.app.status)) {
        throw new Error(
          "You can't edit settings for this integration. To edit your integration details on Zapier's public app directory, email partners@zapier.com.",
        );
      }
    }

    appMeta.title = this.args.title?.trim();
    if (!appMeta.title) {
      appMeta.title = await this.prompt(
        `What is the title of your integration? It must be ${MIN_TITLE_LENGTH} characters at minimum.`,
        {
          required: true,
          charMinimum: MIN_TITLE_LENGTH,
          default: this.app?.title,
        },
      );
    }

    appMeta.description = this.flags.desc?.trim();
    if (!appMeta.description) {
      appMeta.description = await this.prompt(
        `Please provide a sentence describing your app in ${MAX_DESCRIPTION_LENGTH} characters or less.`,
        {
          required: true,
          charLimit: MAX_DESCRIPTION_LENGTH,
          default: this.app?.description,
        },
      );
    }

    appMeta.homepage_url = this.flags.url;
    if (!appMeta.homepage_url) {
      appMeta.homepage_url = await this.prompt(
        'What is the homepage URL of your app? (optional)',
        { default: this.app?.homepage_url },
      );
    }

    appMeta.intention = this.flags.audience;
    if (!appMeta.intention) {
      appMeta.intention = await this.promptWithList(
        'Are you building a public or private integration?',
        this.config.enumFieldChoices.intention,
        { default: this.app?.intention },
      );
    }

    appMeta.role = this.flags.role;
    if (!appMeta.role) {
      appMeta.role = await this.promptWithList(
        "What is your relationship with the app you're integrating with Zapier?",
        this._getRoleChoicesWithAppTitle(
          appMeta.title,
          this.config.enumFieldChoices.role,
        ),
        { default: this.app?.role },
      );
    }

    appMeta.app_category = this.flags.category;
    if (!appMeta.app_category) {
      appMeta.app_category = await this.promptWithList(
        'How would you categorize your app?',
        this.config.enumFieldChoices.app_category,
        { default: this.app?.app_category },
      );
    }

    if (action === 'register') {
      appMeta.subscription = this.flags.subscribe;
      if (typeof this.flags.yes !== 'undefined') {
        appMeta.subscription = true;
      } else if (typeof appMeta.subscription === 'undefined') {
        // boolean field, so using `typeof` === `undefined`
        appMeta.subscription = await this.promptWithList(
          'Subscribe to Updates about your Integration',
          [
            { name: 'Yes', value: true },
            { name: 'No', value: false },
          ],
        );
      }
    }

    return { appMeta, action };
  }

  /**
   *
   * @param {string} title title of integration
   * @param {array} choices retrieved role choices with `[app_title]` tokens
   * @returns {array} array of choices with integration titles (instead of `[app_title]` tokens)
   */
  _getRoleChoicesWithAppTitle(title, choices) {
    return choices.map((choice) => ({
      value: choice.value,
      name: choice.name.replace('[app_title]', title),
    }));
  }
}

RegisterCommand.skipValidInstallCheck = true;
RegisterCommand.args = {
  title: Args.string({
    description:
      "Your integration's public title. Asked interactively if not present.",
  }),
};

RegisterCommand.flags = buildFlags({
  commandFlags: {
    desc: Flags.string({
      char: 'D',
      description: `A sentence describing your app in ${MAX_DESCRIPTION_LENGTH} characters or less, e.g. "Trello is a team collaboration tool to organize tasks and keep projects on track."`,
    }),
    url: Flags.string({
      char: 'u',
      description: 'The homepage URL of your app, e.g., https://example.com.',
    }),
    audience: Flags.string({
      char: 'a',
      description: 'Are you building a public or private integration?',
    }),
    role: Flags.string({
      char: 'r',
      description:
        "What is your relationship with the app you're integrating with Zapier?",
    }),
    category: Flags.string({
      char: 'c',
      description:
        "How would you categorize your app? Choose the most appropriate option for your app's core features.",
    }),
    subscribe: Flags.boolean({
      char: 's',
      description:
        'Get tips and recommendations about this integration along with our monthly newsletter that details the performance of your integration and the latest Zapier news.',
      allowNo: true,
    }),
    yes: Flags.boolean({
      char: 'y',
      description:
        'Assume yes for all yes/no prompts. This flag will also update an existing integration (as opposed to registering a new one) if a .zapierapprc file is found.',
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
RegisterCommand.description = `Register a new integration in your account, or update the existing one if a \`${CURRENT_APP_FILE}\` file is found.

This command creates a new integration and links it in the \`./${CURRENT_APP_FILE}\` file. If \`${CURRENT_APP_FILE}\` already exists, it will ask you if you want to update the currently-linked integration, as opposed to creating a new one.

After registering a new integration, you can run \`zapier push\` to build and upload your integration for use in the Zapier editor. This will change \`${CURRENT_APP_FILE}\`, which identifies this directory as holding code for a specific integration.`;

module.exports = RegisterCommand;
