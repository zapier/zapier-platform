/* eslint-disable camelcase */
// @ts-check

const path = require('path');

const { flags } = require('@oclif/command');

const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');

const {
  createScaffoldingContext,
  plural,
  updateEntryFile,
  isValidEntryFileUpdate,
  writeTemplateFile,
} = require('../../utils/scaffold');
const { splitFileFromPath } = require('../../utils/string');
const { isValidAppInstall } = require('../../utils/misc');
const { writeFile } = require('../../utils/files');
const { ISSUES_URL } = require('../../constants');

/** * @deprecated */
const getLocalDirectory = (action, test = false) =>
  path.join(test ? 'test/' : '', plural(action));

class ScaffoldCommand extends BaseCommand {
  async perform() {
    const { actionType, noun } = this.args;
    const {
      dest: actionDir = getLocalDirectory(actionType),
      'test-dest': testDir = getLocalDirectory(actionType, true),
      entry: indexFileLocal = 'index.js',
      force,
    } = this.flags;

    // TODO: Auto-detect if index.js points at a TS dist/ etc.
    const language = indexFileLocal.endsWith('.ts') ? 'ts' : 'js';

    const context = createScaffoldingContext({
      actionType,
      noun,
      language,
      indexFileLocal,
      actionDir,
      testDir,
      includeIntroComments: !this.flags['no-help'],
      preventOverwrite: !force,
    });

    // TODO: read from config file?

    this.startSpinner(`Creating new file: ${context.actionFileLocal}`);

    await writeTemplateFile({
      destinationPath: context.actionFileResolved,
      templateType: context.actionType,
      language: context.language,
      preventOverwrite: context.preventOverwrite,
      templateContext: context.templateContext,
    });
    this.stopSpinner();

    this.startSpinner(`Creating new test file: ${context.testFileLocal}`);
    await writeTemplateFile({
      destinationPath: context.testFileResolved,
      templateType: 'test',
      language: context.language,
      preventOverwrite: context.preventOverwrite,
      templateContext: context.templateContext,
    });
    this.stopSpinner();

    // * rewire the index.js to point to the new file
    this.startSpinner(`Rewriting your ${context.indexFileLocal}`);

    const originalContents = await updateEntryFile(
      context.indexFileResolved,
      context.templateContext.VARIABLE,
      context.actionFileResolvedStem,
      context.actionType,
      context.templateContext.KEY
    );

    if (isValidAppInstall().valid) {
      const success = isValidEntryFileUpdate(
        context.indexFileResolved,
        context.actionType,
        context.templateContext.KEY
      );

      this.stopSpinner({ success });

      if (!success) {
        const entryName = splitFileFromPath(context.indexFileResolved)[1];

        this.startSpinner(
          `Unable to successfully rewrite your ${entryName}. Rolling back...`
        );
        await writeFile(context.indexFileResolved, originalContents);
        this.stopSpinner();

        this.error(
          [
            `\nPlease add the following lines to ${context.indexFileResolved}:`,
            ` * \`const ${context.templateContext.VARIABLE} = require('./${context.indexFileRelativeImportPath}');\` at the top-level`,
            ` * \`[${context.templateContext.VARIABLE}.key]: ${context.templateContext.VARIABLE}\` in the "${context.actionTypePlural}" object in your exported integration definition.`,
            '',
            `Also, please file an issue at ${ISSUES_URL} with the contents of your ${context.indexFileResolved}.`,
          ].join('\n')
        );
      }
    }

    this.stopSpinner();

    if (!this.flags.invokedFromAnotherCommand) {
      this.log(`\nAll done! Your new ${context.actionType} is ready to use.`);
    }
  }
}

ScaffoldCommand.args = [
  {
    name: 'actionType',
    help: 'What type of step type are you creating?',
    required: true,
    options: ['trigger', 'search', 'create', 'resource'],
  },
  {
    name: 'noun',
    help:
      'What sort of object this action acts on. For example, the name of the new thing to create',
    required: true,
  },
];

ScaffoldCommand.flags = buildFlags({
  commandFlags: {
    dest: flags.string({
      char: 'd',
      description:
        "Specify the new file's directory. Use this flag when you want to create a different folder structure such as `src/triggers` instead of the default `triggers`. Defaults to `[triggers|searches|creates]/{noun}`.",
    }),
    'test-dest': flags.string({
      description:
        "Specify the new test file's directory. Use this flag when you want to create a different folder structure such as `src/triggers` instead of the default `triggers`. Defaults to `test/[triggers|searches|creates]/{noun}`.",
    }),
    entry: flags.string({
      char: 'e',
      description:
        "Supply the path to your integration's root (`index.js`). Only needed if your `index.js` is in a subfolder, like `src`.",
      default: 'index.js',
    }),
    force: flags.boolean({
      char: 'f',
      description:
        'Should we overwrite an exisiting trigger/search/create file?',
      default: false,
    }),
    'no-help': flags.boolean({
      description:
        "When scaffolding, should we skip adding helpful intro comments? Useful if this isn't your first rodeo.",
      default: false,
    }),
    // TODO: typescript? jscodeshift supports it. We could tweak a template for it
  },
});

ScaffoldCommand.examples = [
  'zapier scaffold trigger contact',
  'zapier scaffold search contact --dest=my_src/searches',
  'zapier scaffold create contact --entry=src/index.js',
  'zapier scaffold resource contact --force',
];

ScaffoldCommand.description = `Add a starting trigger, create, search, or resource to your integration.

The first argument should be one of \`trigger|search|create|resource\` followed by the noun that this will act on (something like "contact" or "deal").

The scaffold command does two general things:

* Creates a new file (such as \`triggers/contact.js\`)
* Imports and registers it inside your \`index.js\`

You can mix and match several options to customize the created scaffold for your project.`;

ScaffoldCommand.skipValidInstallCheck = true;

module.exports = ScaffoldCommand;
