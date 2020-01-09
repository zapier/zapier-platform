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
const { createRootRequire } = require('../../utils/ast');

// what is the `resources: {}` app definition point?
// const typeMap = {
//   resource: 'resources',
//   trigger: 'triggers',
//   search: 'searches',
//   create: 'creates'
// };

function createTemplateContext(type, name) {
  const contextKey = snakeCase(name);

  // where will we create/required the new file?
  const destMap = {
    resource: `resources/${contextKey}`,
    trigger: `triggers/${contextKey}`,
    search: `searches/${contextKey}`,
    create: `creates/${contextKey}`
  };

  return {
    CAMEL: camelCase(name),
    KEY: contextKey,
    NOUN: _.capitalize(name),
    LOWER_NOUN: name.toLowerCase(),
    INPUT_FIELDS: '',
    TYPE: type,
    TYPE_PLURAL: type === 'search' ? `${type}es` : `${type}s`,
    // resources need an extra line for tests to "just run"
    MAYBE_RESOURCE: type === 'resource' ? 'list.' : '',
    defaultDest: destMap[type]
  };
}

function getTemplatePath(type) {
  return path.join(__dirname, '../../..', `scaffold/${type}.template.js`);
}

class ScaffoldCommand extends BaseCommand {
  async updateEntry(filePath, entryName, nameAdded, pathRequired) {
    const { type } = this.args;
    let entry = (await readFile(filePath)).toString();
    // const lines = entry.split('\n');

    // this is very dumb and will definitely break, it inserts lines of code
    // we should look at jscodeshift or friends to do this instead
    const varName = `${nameAdded}${camelCase(type)}`;

    try {
      // insert Resource = require() line at top
      entry = createRootRequire(entry, varName, `./${pathRequired}`);
      // const importerLine = `const ${varName} = require('./${pathRequired}');`;
      // lines.splice(0, 0, importerLine);

      // insert '[Resource.key]: Resource,' after 'resources:' line
      // const injectAfter = `${typeMap[type]}: {`;
      // const injectorLine = `[${varName}.key]: ${varName},`;
      // const linesDefIndex = lines.findIndex(line => line.endsWith(injectAfter));
    } catch (e) {
      this.stopSpinner(false);
      return this.error(
        [
          `\n${colors.bold(
            `Oops, we could not reliably rewrite your ${entryName}.`
          )} Please add:`,
          ` * "const ${varName} = require('./${pathRequired}');" to the top`
          // ` * \`${injectAfter} ${injectorLine} },\` in your root integration definition`
        ].join('\n')
      );
    }
    // if (linesDefIndex === -1) {

    // }

    // lines.splice(linesDefIndex + 1, 0, '    ' + injectorLine);

    await writeFile(filePath, entry);
  }

  async writeTemplateFile(type, templateContext, dest) {
    const templatePath = getTemplatePath(type);
    const destPath = path.join(process.cwd(), `${dest}.js`);
    const preventOverwrite = !this.flags.force;

    if (preventOverwrite && fileExistsSync(destPath)) {
      const [filename, location] = splitFileFromPath(destPath);

      this.error(
        [
          `File ${colors.bold(filename)} already exists within ${colors.bold(
            location
          )}.`,
          'You could:',
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

    this.startSpinner(`Writing new ${dest}.js`);

    await ensureDir(path.dirname(destPath));
    await writeFile(destPath, renderTemplate(templateContext));
    this.stopSpinner();
  }

  async perform() {
    const { name, type } = this.args;

    const { defaultDest, ...templateContext } = createTemplateContext(
      type,
      name
    );
    const { dest = defaultDest, entry = 'index.js' } = this.flags;
    const entryFile = path.join(process.cwd(), entry);

    this.log(`Adding ${type} scaffold to your project.\n`);

    await this.writeTemplateFile(type, templateContext, dest);
    await this.writeTemplateFile('test', templateContext, `test/${dest}`);

    this.startSpinner(`Rewriting your ${entry}`);

    await this.updateEntry(entryFile, entry, templateContext.CAMEL, dest);

    this.stopSpinner();

    this.log(
      '\nFinished! We did the best we could, you might gut check your files though.'
    );
  }
}

ScaffoldCommand.args = [
  {
    name: 'type',
    help: 'What type of thing are you creating',
    required: true,
    options: ['resource', 'trigger', 'search', 'create']
  },
  {
    name: 'name',
    help: 'The name of the new thing to create',
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
    entry: flags.string({
      char: 'e',
      description: 'Where to import the new file.',
      default: 'index.js'
    }),
    force: flags.boolean({
      char: 'f',
      description: 'Should we overwrite an exisiting file.',
      default: false
    })
  }
});

ScaffoldCommand.examples = [
  'zapier scaffold resource "Contact"',
  'zapier scaffold create "Add Contact" --entry=index.js',
  'zapier scaffold search "Find Contact" --dest=searches/contact',
  'zapier scaffold trigger "New Contact" --force'
];

ScaffoldCommand.description = `Add a starting resource, trigger, action, or search to your integration.

The first argument should one of \`resource|trigger|search|create\` followed by the name of the file.

The scaffold command does two general things:

* Creates a new destination file like \`resources/contact.js\`
* (Attempts to) import and register it inside your entry \`index.js\`

You can mix and match several options to customize the created scaffold for your project.

We may fail to correctly rewrite your \`index.js\`. You may need to write in the require and registration, but we'll provide the code you need.
`;

module.exports = ScaffoldCommand;
