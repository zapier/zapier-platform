/* eslint-disable camelcase */
// @ts-check

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

/** * @deprecated */
const getNewFileDirectory = (action, test = false) =>
  path.join(test ? 'test/' : '', plural(action));

/** * @deprecated */
const getLocalFilePath = (directory, actionKey) =>
  path.join(directory, actionKey);

/**
 * Both the string to `require` and later, the filepath to write to
 * @deprecated
 */
const getFullActionFilePath = (directory, actionKey) =>
  path.join(process.cwd(), getLocalFilePath(directory, actionKey));

/** @deprecated */
const getFullActionFilePathWithExtension = (directory, actionKey, isTest) =>
  `${getFullActionFilePath(directory, actionKey)}${isTest ? '.test' : ''}.js`;

class ScaffoldCommand extends BaseCommand {
  async perform() {
    const context = this.getContext();

    // this is possible, just extra work that's out of scope
    // const tsParser = j.withParser('ts')
    // tsParser(codeStr)
    // will have to change logic probably though
    if (context.isTypeScript) {
      this.error(
        `Typescript isn't supported for scaffolding yet. Instead, try copying the example code at https://github.com/zapier/zapier-platform/blob/b8224ec9855be91c66c924b731199a068b1e913a/example-apps/typescript/src/resources/recipe.ts`
      );
    }

    const actionKey = context.templateContext.KEY;

    const preventOverwrite = !context.force;
    // TODO: read from config file?

    // ==== EXTRACTION ====

    // '/Users/sal/zoom/triggers/foobar.js',
    const EX_actionFileResolved = getFullActionFilePathWithExtension(context.newActionDir, actionKey); // prettier-ignore

    // '/Users/sal/zoom/triggers/foobar',
    const EX_actionFileResolvedStem = getFullActionFilePath(context.newActionDir, actionKey); // prettier-ignore

    // 'triggers/foobar',
    const EX_actionFileLocalStem = getLocalFilePath(context.newActionDir, actionKey); // prettier-ignore

    // '/Users/sal/zoom/index.js',
    const EX_entryFileResolved = path.join(process.cwd(), context.entry); // prettier-ignore

    // '/Users/sal/zoom/test/triggers/foobar.test.js',
    const EX_testFileResolved = getFullActionFilePathWithExtension(context.newTestActionDir, actionKey, true); // prettier-ignore

    // 'test/triggers/foobar'
    const EX_testFileLocalStem = getLocalFilePath(context.newTestActionDir, actionKey); // prettier-ignore

    // EX_requirePath 'triggers/foobar',
    const EX_requirePath = getRelativeRequirePath(EX_entryFileResolved, EX_actionFileResolvedStem); // prettier-ignore

    // 'triggers'
    const EX_actionPlural = plural(context.actionType); // prettier-ignore
    // ====================

    this.startSpinner(`Creating new file: ${EX_actionFileLocalStem}.js`);

    await writeTemplateFile(
      context.actionType,
      context.templateContext,
      EX_actionFileResolved,
      preventOverwrite
    );
    this.stopSpinner();

    this.startSpinner(`Creating new test file: ${EX_testFileLocalStem}.js`);
    await writeTemplateFile(
      'test',
      context.templateContext,
      EX_testFileResolved,
      preventOverwrite
    );
    this.stopSpinner();

    // * rewire the index.js to point to the new file
    this.startSpinner(`Rewriting your ${context.entry}`);

    const originalContents = await updateEntryFile(
      EX_entryFileResolved,
      context.templateContext.VARIABLE,
      EX_actionFileResolvedStem,
      context.actionType,
      context.templateContext.KEY
    );

    if (isValidAppInstall().valid) {
      const success = isValidEntryFileUpdate(
        EX_entryFileResolved,
        context.actionType,
        context.templateContext.KEY
      );

      this.stopSpinner({ success });

      if (!success) {
        const entryName = splitFileFromPath(EX_entryFileResolved)[1];

        this.startSpinner(
          `Unable to successfully rewrite your ${entryName}. Rolling back...`
        );
        await writeFile(EX_entryFileResolved, originalContents);
        this.stopSpinner();

        this.error(
          [
            `\nPlease add the following lines to ${EX_entryFileResolved}:`,
            ` * \`const ${context.templateContext.VARIABLE} = require('./${EX_requirePath}');\` at the top-level`,
            ` * \`[${context.templateContext.VARIABLE}.key]: ${context.templateContext.VARIABLE}\` in the "${EX_actionPlural}" object in your exported integration definition.`,
            '',
            `Also, please file an issue at ${ISSUES_URL} with the contents of your ${EX_entryFileResolved}.`,
          ].join('\n')
        );
      }
    }

    this.stopSpinner();

    if (!this.flags.invokedFromAnotherCommand) {
      this.log(`\nAll done! Your new ${context.actionType} is ready to use.`);
    }
  }

  /**
   * Assemble all of the relevant paths, files, transformations, etc.
   * ahead of time for an invocation of the scaffold command.
   *
   * @returns {ScaffoldContext}
   */
  getContext() {
    const { actionType, noun } = this.args;

    // TODO: interactive portion here?
    const {
      dest: newActionDir = getNewFileDirectory(actionType),
      testDest: newTestActionDir = getNewFileDirectory(actionType, true),
      entry = 'index.js',
      force,
    } = this.flags;

    return {
      actionType,
      entry,
      force,
      isTypeScript: entry.endsWith('.ts'),
      newActionDir,
      newActionFile: getLocalFilePath(newActionDir, noun),
      newTestActionDir,
      newTestActionFile: getLocalFilePath(newTestActionDir, noun),
      noun,
      templateContext: createTemplateContext({
        actionType,
        noun,
        includeIntroComments: !this.flags['no-help'],
      }),
    };
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

/**
 * @typedef {Object} ScaffoldContext
 * @property {string} actionType - the action type
 * @property {string} noun - the noun for the action
 * @property {string} newActionDir - the directory for the new action
 * @property {string} newActionFile - the file for the new action
 * @property {string} newTestActionDir - the directory for the new test action
 * @property {string} newTestActionFile - the file for the new test action
 * @property {string} entry - the entry file
 * @property {boolean} isTypeScript - whether the project is TypeScript
 * @property {boolean} force - whether to force overwrite
 * @property {import('../../utils/scaffold').TemplateContext} templateContext - the context for templates
 */
