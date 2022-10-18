const path = require('path');

const { flags } = require('@oclif/command');

const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');

const {
  createTemplateContext,
  getRelativeRequirePath,
  plural,
  updateEntryFile,
  isValidEntryFileUpdate,
  writeTemplateFile,
} = require('../../utils/scaffold');
const { splitFileFromPath } = require('../../utils/string');
const { isValidAppInstall } = require('../../utils/misc');
const { writeFile } = require('../../utils/files');
const { ISSUES_URL } = require('../../constants');

const getNewFileDirectory = (action, test = false) =>
  path.join(test ? 'test/' : '', plural(action));

const getLocalFilePath = (directory, actionKey) =>
  path.join(directory, actionKey);
/**
 * both the string to `require` and later, the filepath to write to
 */
const getFullActionFilePath = (directory, actionKey) =>
  path.join(process.cwd(), getLocalFilePath(directory, actionKey));

const getFullActionFilePathWithExtension = (directory, actionKey, isTest) =>
  `${getFullActionFilePath(directory, actionKey)}${isTest ? '.test' : ''}.js`;

class ScaffoldCommand extends BaseCommand {
  async perform() {
    const { actionType, noun } = this.args;

    // TODO: interactive portion here?
    const {
      dest: newActionDir = getNewFileDirectory(actionType),
      testDest: newTestActionDir = getNewFileDirectory(actionType, true),
      entry = 'index.js',
      force,
    } = this.flags;

    // this is possible, just extra work that's out of scope
    // const tsParser = j.withParser('ts')
    // tsParser(codeStr)
    // will have to change logic probably though
    if (entry.endsWith('ts')) {
      this.error(
        `Typescript isn't supported for scaffolding yet. Instead, try copying the example code at https://github.com/zapier/zapier-platform/blob/b8224ec9855be91c66c924b731199a068b1e913a/example-apps/typescript/src/resources/recipe.ts`
      );
    }

    const shouldIncludeComments = !this.flags['no-help']; // when called from other commands (namely `init`) this will be false
    const templateContext = createTemplateContext(
      actionType,
      noun,
      shouldIncludeComments
    );

    const actionKey = templateContext.KEY;

    const preventOverwrite = !force;
    // TODO: read from config file?

    this.startSpinner(
      `Creating new file: ${getLocalFilePath(newActionDir, actionKey)}.js`
    );
    await writeTemplateFile(
      actionType,
      templateContext,
      getFullActionFilePathWithExtension(newActionDir, actionKey),
      preventOverwrite
    );
    this.stopSpinner();

    this.startSpinner(
      `Creating new test file: ${getLocalFilePath(
        newTestActionDir,
        actionKey
      )}.js`
    );
    await writeTemplateFile(
      'test',
      templateContext,
      getFullActionFilePathWithExtension(newTestActionDir, actionKey, true),
      preventOverwrite
    );
    this.stopSpinner();

    // * rewire the index.js to point to the new file
    this.startSpinner(`Rewriting your ${entry}`);

    const entryFilePath = path.join(process.cwd(), entry);

    const originalContents = await updateEntryFile(
      entryFilePath,
      templateContext.VARIABLE,
      getFullActionFilePath(newActionDir, actionKey),
      actionType,
      templateContext.KEY
    );

    if (isValidAppInstall().valid) {
      const success = isValidEntryFileUpdate(
        entryFilePath,
        actionType,
        templateContext.KEY
      );

      this.stopSpinner({ success });

      if (!success) {
        const entryName = splitFileFromPath(entryFilePath)[1];

        this.startSpinner(
          `Unable to successfully rewrite your ${entryName}. Rolling back...`
        );
        await writeFile(entryFilePath, originalContents);
        this.stopSpinner();

        this.error(
          [
            `\nPlease add the following lines to ${entryFilePath}:`,
            ` * \`const ${
              templateContext.VARIABLE
            } = require('./${getRelativeRequirePath(
              entryFilePath,
              getFullActionFilePath(newActionDir, actionKey)
            )}');\` at the top-level`,
            ` * \`[${templateContext.VARIABLE}.key]: ${
              templateContext.VARIABLE
            }\` in the "${plural(
              actionType
            )}" object in your exported integration definition.`,
            '',
            `Also, please file an issue at ${ISSUES_URL} with the contents of your ${entryFilePath}.`,
          ].join('\n')
        );
      }
    }

    this.stopSpinner();

    if (!this.flags.invokedFromAnotherCommand) {
      this.log(`\nAll done! Your new ${actionType} is ready to use.`);
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
    help: 'What sort of object this action acts on. For example, the name of the new thing to create',
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
