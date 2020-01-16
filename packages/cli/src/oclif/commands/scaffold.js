const _ = require('lodash');
const path = require('path');
const colors = require('colors/safe');

const { flags } = require('@oclif/command');

const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');
const {
  ensureDir,
  fileExistsSync,
  readFile,
  writeFile
} = require('../../utils/files');
const { snakeCase } = require('../../utils/misc');
const { splitFileFromPath } = require('../../utils/string');
const { createRootRequire, addKeyToPropertyOnApp } = require('../../utils/ast');

const plural = type => (type === 'search' ? `${type}es` : `${type}s`);

const getNewFileDirectory = (action, test = false) =>
  `${test ? 'test/' : ''}${plural(action)}`;

/**
 * both the string to `require` and the filepath to write to
 */
const getFilename = (directory, noun) => `${directory}/${noun}.js`;

// useful for making sure we don't conflict with other, similarly named things
const variablePrefixes = {
  trigger: 'get',
  search: 'find',
  create: 'create'
};
const getVariableName = (action, noun) =>
  action === 'resource'
    ? `${noun.toLowerCase()}Resource` // contactResource
    : `${variablePrefixes[action]}${_.capitalize(noun)}`; // getContact

const createTemplateContext = (action, noun, includeComments) => {
  // if noun is "Cool Contact"
  return {
    ACTION: action, // trigger
    ACTION_PLURAL: plural(action), // triggers

    KEY: snakeCase(noun), // "cool_contact", the action key
    NOUN: _.capitalize(noun), // "Cool contact", the noun
    LOWER_NOUN: noun.toLowerCase(), // "cool contact", for use in comments
    // resources need an extra line for tests to "just run"
    MAYBE_RESOURCE: action === 'resource' ? 'list.' : '',
    INCLUDE_INTRO_COMMENTS: includeComments
  };
};

const getTemplatePath = type =>
  path.join(__dirname, '../../..', `scaffold/${type}.template.js`);

class ScaffoldCommand extends BaseCommand {
  async perform() {
    const { action, noun } = this.args;
    // TODO: interactive portion here?
    const {
      dest = getNewFileDirectory(action),
      testDest = getNewFileDirectory(action, true),
      entry = 'index.js'
    } = this.flags;

    const shouldIncludeComments = !this.flags['no-help']; // when called from other commands (namely init) this will be false
    const templateContext = createTemplateContext(
      action,
      noun,
      shouldIncludeComments
    );

    // * create 2 new files - the scaffold and the test
    this.log(`Adding a new ${action} to your project.\n`);

    // TODO: read from config file?
    await this.writeTemplateFile(
      action,
      templateContext,
      getFilename(dest, noun)
    );
    await this.writeTemplateFile(
      'test',
      templateContext,
      getFilename(testDest, noun)
    );

    // * rewire the index.js to point ot the new file
    this.startSpinner(`Rewriting your ${entry}`);

    const entryFilePath = path.join(process.cwd(), entry);
    await this.updateEntryFile(
      entryFilePath,
      getVariableName(action, noun),
      getFilename(dest, noun),
      templateContext.KEY
    );

    this.stopSpinner();

    this.log(`\nFinished! Your new ${action} is ready to use.`);
  }

  async writeTemplateFile(action, templateContext, dest) {
    const templatePath = getTemplatePath(action);
    const destPath = path.join(process.cwd(), `${dest}.js`);
    const preventOverwrite = !this.flags.force;

    if (preventOverwrite && fileExistsSync(destPath)) {
      const [location, filename] = splitFileFromPath(destPath);

      this.error(
        [
          `File ${colors.bold(filename)} already exists within ${colors.bold(
            location
          )}.`,
          'You can either:',
          '  1. Choose a different filename',
          `  2. Delete ${filename} from ${location}`,
          `  3. Run ${colors.italic('scaffold')} with ${colors.bold(
            '--force'
          )} to overwrite the current ${filename}`
        ].join('\n')
      );
    }

    const template = (await readFile(templatePath)).toString();
    const renderTemplate = _.template(template);

    this.startSpinner(`Writing new file ${dest}.js`);
    await ensureDir(path.dirname(destPath));
    await writeFile(destPath, renderTemplate(templateContext));
    this.stopSpinner();
  }

  async updateEntryFile(entryFilePath, varName, pathRequired, actionKey) {
    const { action } = this.args;
    let codeStr = (await readFile(entryFilePath)).toString();
    const entryName = splitFileFromPath(entryFilePath)[1];

    try {
      codeStr = createRootRequire(codeStr, varName, `./${pathRequired}`);
      codeStr = addKeyToPropertyOnApp(codeStr, plural(action), varName);
      await writeFile(entryFilePath, codeStr);

      // validate the edit happened correctly
      // can't think of why it wouldn't, but it doesn't hurt to double check
      const rewrittenIndex = require(entryFilePath);
      if (!_.get(rewrittenIndex, [plural(action), actionKey])) {
        throw new Error();
      }
    } catch (e) {
      if (e.message) {
        throw e;
      }
      // if we get here, just throw something generic
      this.error(
        [
          `\n${colors.bold(
            `Oops, we could not reliably rewrite your ${entryName}.`
          )} Please ensure the following lines exist:`,
          ` * \`const ${varName} = require('./${pathRequired}');\` at the top-level`,
          ` * \`[${varName}.key]: ${varName}\` in the "${action}" object in your root integration definition`
        ].join('\n')
      );
    }
  }
}

ScaffoldCommand.args = [
  {
    name: 'action',
    help: 'What type of step type are you creating?',
    required: true,
    options: ['trigger', 'search', 'create', 'resource']
  },
  {
    name: 'noun',
    help:
      'What sort of object this action acts on. For example,  of the new thing to create',
    required: true
  }
];

ScaffoldCommand.flags = buildFlags({
  commandFlags: {
    dest: flags.string({
      char: 'd',
      description:
        "Specify the new file's directory. Use this flag when you want to create a different folder structure such as `src/triggers` instead of the default `triggers`. Defaults to `[triggers|searches|creates]/{noun}`."
    }),
    'test-dest': flags.string({
      description:
        "Specify the new test file's directory. Use this flag when you want to create a different folder structure such as `src/triggers` instead of the default `triggers`. Defaults to `test/[triggers|searches|creates]/{noun}`."
    }),
    entry: flags.string({
      char: 'e',
      description:
        "Supply the path to your integration's root (`index.js`). Only needed if  your `index.js` is in a subfolder, like `src`.",
      default: 'index.js'
    }),
    force: flags.boolean({
      char: 'f',
      description:
        'Should we overwrite an exisiting trigger/search/create file?',
      default: false
    }),
    'no-help': flags.boolean({
      description:
        "When scaffolding, should we skip adding helpful intro comments? Useful if this isn't your first rodeo.",
      default: false
    })
    // TODO: typescript? jscodeshift supports it. We could tweak a template for it
  }
});

ScaffoldCommand.examples = [
  'zapier scaffold trigger contact',
  'zapier scaffold search contact --dest=my_src/searches',
  'zapier scaffold create contact --entry=src/index.js',
  'zapier scaffold resource contact --force'
];

ScaffoldCommand.description = `Add a starting trigger, create, search, or resource to your integration.

The first argument should be one of \`trigger|search|create|resource\` followed by the noun that this will act on (something like "contact" or "deal").

The scaffold command does two general things:

* Creates a new file (such as \`triggers/contact.js\`)
* Imports and registers it inside your \`index.js\`

You can mix and match several options to customize the created scaffold for your project.`;

module.exports = ScaffoldCommand;
