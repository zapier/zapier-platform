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
const { camelCase, snakeCase } = require('../../utils/misc');
const { splitFileFromPath } = require('../../utils/string');
const { createRootRequire, addKeyToPropertyOnApp } = require('../../utils/ast');

// what is the `resources: {}` app definition point?
// const typeMap = {
//   resource: 'resources',
//   trigger: 'triggers',
//   search: 'searches',
//   create: 'creates'
// };

const plural = type => (type === 'search' ? `${type}es` : `${type}s`);

const fileDestination = (type, name, test = false) =>
  `${test ? 'test' : ''}${plural(type)}/${snakeCase(name)}`;

const createTemplateContext = (type, name) => {
  const contextKey = snakeCase(name);

  // where will we create/required the new file?
  // const destMap = {
  //   resource: `resources/${contextKey}`,
  //   trigger: `triggers/${contextKey}`,
  //   search: `searches/${contextKey}`,
  //   create: `creates/${contextKey}`
  // };

  return {
    CAMEL: camelCase(name),
    KEY: contextKey,
    NOUN: _.capitalize(name),
    LOWER_NOUN: name.toLowerCase(),
    INPUT_FIELDS: '',
    TYPE: type,
    TYPE_PLURAL: plural(type),
    // resources need an extra line for tests to "just run"
    MAYBE_RESOURCE: type === 'resource' ? 'list.' : ''
    // defaultDest: destMap[type],
    // defaultTestDest: `test/${destMap[type]}`
  };
};

const getTemplatePath = type =>
  path.join(__dirname, '../../..', `scaffold/${type}.template.js`);

class ScaffoldCommand extends BaseCommand {
  async perform() {
    const { noun, type: actionType } = this.args;

    // TODO: interactive portion here?

    const {
      defaultDest,
      defaultTestDest,
      ...templateContext
    } = createTemplateContext(actionType, name);

    const {
      dest = defaultDest,
      testDest = defaultTestDest,
      entry = 'index.js'
    } = this.flags;
    const entryFilePath = path.join(process.cwd(), entry);

    this.log(`Adding a new ${actionType} to your project.\n`);

    // TODO: read from config file?
    await this.writeTemplateFile(actionType, templateContext, dest);
    await this.writeTemplateFile('test', templateContext, testDest);

    this.startSpinner(`Rewriting your ${entry}`);

    await this.updateEntryFile(
      entryFilePath,
      templateContext.CAMEL,
      dest,
      templateContext.KEY
    );

    this.stopSpinner();

    this.log(`\nFinished! Your new ${actionType} is ready to use.`);
  }

  async writeTemplateFile(type, templateContext, dest) {
    const templatePath = getTemplatePath(type);
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

    const template = await readFile(templatePath);
    const renderTemplate = _.template(template.toString(), {
      interpolate: /<%=([\s\S]+?)%>/g
    });

    this.startSpinner(`Writing new file ${dest}.js`);

    await ensureDir(path.dirname(destPath));
    await writeFile(destPath, renderTemplate(templateContext));
    this.stopSpinner();
  }

  async updateEntryFile(entryFilePath, nameAdded, pathRequired, actionKey) {
    const { type } = this.args;
    let codeStr = (await readFile(entryFilePath)).toString();
    const entryName = splitFileFromPath(entryFilePath)[1];

    const varName = `${nameAdded}${camelCase(type)}`;

    try {
      codeStr = createRootRequire(codeStr, varName, `./${pathRequired}`);
      codeStr = addKeyToPropertyOnApp(codeStr, plural(type), varName);
      await writeFile(entryFilePath, codeStr);

      // validate the edit happened correctly
      // can't think of why it wouldn't, but it doesn't hurt to double check
      const rewrittenIndex = require(entryFilePath);
      if (!_.get(rewrittenIndex, [plural(type), actionKey])) {
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
          ` * \`[${varName}.key]: ${varName}\` in the "${type}" object in your root integration definition`
        ].join('\n')
      );
    }
  }
}

ScaffoldCommand.args = [
  {
    name: 'type',
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
        "Sets the new file's path. Use this flag when you want to create a different folder structure such as `src/triggers/my_trigger` The default destination is {type}s/{name}."
    }),
    'test-dest': flags.string({
      char: 't',
      description:
        "Sets the new test file's path. Use this flag when you want to create a different folder structure such as `src/tests/triggers/my_trigger` The default destination is {type}s/{name}."
    }),
    entry: flags.string({
      char: 'e',
      description:
        'Where to import the new file. Supply this if your index is in a subfolder, like `src`.',
      default: 'index.js'
    }),
    force: flags.boolean({
      char: 'f',
      description:
        'Should we overwrite an exisiting trigger/search/create file?',
      default: false
    })
  }
});

ScaffoldCommand.examples = [
  'zapier scaffold trigger "New Contact"',
  'zapier scaffold search "Find Contact" --dest=searches/contact',
  'zapier scaffold create "Add Contact" --entry=index.js',
  'zapier scaffold resource "Contact" --force'
];

ScaffoldCommand.description = `Add a starting trigger, create, search, or resource to your integration.

The first argument should be one of \`resource|trigger|search|create\` followed by the name of the file.

The scaffold command does two general things:

* Creates a new file (such as \`triggers/contact.js\`)
* Imports and register it inside your \`index.js\`

You can mix and match several options to customize the created scaffold for your project.


`;

module.exports = ScaffoldCommand;
