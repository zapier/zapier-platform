const _ = require('lodash');
const path = require('path');
const colors = require('colors/safe');

const { flags } = require('@oclif/command');

const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');
const utils = require('../../utils');

class ScaffoldCommand extends BaseCommand {
  writeTemplateFile(templatePath, templateContext, dest) {
    const destPath = path.join(process.cwd(), `${dest}.js`);
    const preventOverwrite = !this.flags.force;

    if (preventOverwrite && utils.fileExistsSync(destPath)) {
      const [location, filename] = dest.concat('.js').split('/');
      return Promise.reject(
        [
          `File ${colors.bold(filename)} already exists within ${colors.bold(
            location
          )}.`,
          'You could:',
          '1. Choose a different filename',
          `2. Delete ${filename} from ${location}`,
          `3. Run ${colors.italic('scaffold')} with ${colors.bold(
            '--force'
          )} to overwrite the current ${filename}`
        ].join('\n')
      );
    }

    return utils
      .readFile(templatePath)
      .then(templateBuf => templateBuf.toString())
      .then(template =>
        _.template(template, { interpolate: /<%=([\s\S]+?)%>/g })(
          templateContext
        )
      )
      .then(rendered => {
        this.startSpinner(`Writing new ${dest}.js`);
        return utils
          .ensureDir(path.dirname(destPath))
          .then(() => utils.writeFile(destPath, rendered));
      })
      .then(this.stopSpinner);
  }

  async perform() {
    const { name, type } = this.args;
    const templateContext = {
      CAMEL: utils.camelCase(name),
      KEY: utils.snakeCase(name),
      NOUN: _.capitalize(name),
      LOWER_NOUN: name.toLowerCase(),
      INPUT_FIELDS: '',
      TYPE: type,
      TYPE_PLURAL: type === 'search' ? `${type}es` : `${type}s`,
      // resources need an extra line for tests to "just run"
      MAYBE_RESOURCE: type === 'resource' ? 'list.' : ''
    };

    // what is the `resources: {}` app definition point?
    const typeMap = {
      resource: 'resources',
      trigger: 'triggers',
      search: 'searches',
      create: 'creates'
    };

    // where will we create/required the new file?
    const destMap = {
      resource: `resources/${templateContext.KEY}`,
      trigger: `triggers/${templateContext.KEY}`,
      search: `searches/${templateContext.KEY}`,
      create: `creates/${templateContext.KEY}`
    };

    if (!typeMap[type]) {
      this.log(
        `Scaffold type "${type}" not found! Please see \`zaper help scaffold\`.`
      );
      return Promise.resolve();
    }

    const templateFile = path.join(
      __dirname,
      '../../..',
      `scaffold/${type}.template.js`
    );
    const testTemplateFile = path.join(
      __dirname,
      '../../..',
      'scaffold/test.template.js'
    );

    const { dest = destMap[type], entry = 'index.js' } = this.flags;
    const entryFile = path.join(process.cwd(), entry);

    this.log(`Adding ${type} scaffold to your project.\n`);

    return this.writeTemplateFile(templateFile, templateContext, dest)
      .then(() =>
        this.writeTemplateFile(
          testTemplateFile,
          templateContext,
          `test/${dest}`
        )
      )
      .then(() => utils.readFile(entryFile))
      .then(entryBuf => entryBuf.toString())
      .then(entryJs => {
        this.startSpinner(`Rewriting your ${entry}`);
        const lines = entryJs.split('\n');

        // this is very dumb and will definitely break, it inserts lines of code
        // we should look at jscodeshift or friends to do this instead

        // insert Resource = require() line at top
        const varName = `${templateContext.CAMEL}${utils.camelCase(type)}`;
        const importerLine = `const ${varName} = require('./${dest}');`;
        lines.splice(0, 0, importerLine);

        // insert '[Resource.key]: Resource,' after 'resources:' line
        const injectAfter = `${typeMap[type]}: {`;
        const injectorLine = `[${varName}.key]: ${varName},`;
        const linesDefIndex = lines.findIndex(line =>
          line.endsWith(injectAfter)
        );

        if (linesDefIndex === -1) {
          this.stopSpinner(false);
          this.log();
          this.log(
            colors.bold(`Oops, we could not reliably rewrite your ${entry}.`) +
              ' Please add:'
          );
          this.log(` * \`${importerLine}\` to the top`);
          this.log(
            ` * \`${injectAfter} ${injectorLine} },\` in your app definition`
          );
          return Promise.resolve();
        } else {
          lines.splice(linesDefIndex + 1, 0, '    ' + injectorLine);
          return utils
            .writeFile(entryFile, lines.join('\n'))
            .then(this.stopSpinner);
        }
      })
      .then(() =>
        this.log(
          '\nFinished! We did the best we could, you might gut check your files though.'
        )
      )
      .catch(message => {
        this.stopSpinner(false);
        this.log(colors.red(`We couldn't scaffold your files:`));
        this.log(message);
      });
  }
}

ScaffoldCommand.args = [
  {
    name: 'type',
    help: 'what type of thing are you creating',
    required: true,
    options: ['resource', 'trigger', 'search', 'create']
  },
  {
    name: 'name',
    help: 'the name of the new thing to create',
    required: true
  }
];

ScaffoldCommand.flags = buildFlags({
  commandFlags: {
    dest: flags.string({
      description:
        "Sets the new file's path. The default pattern is {type}s/{name}"
    }),
    entry: flags.string({
      description: 'Where to import the new file',
      default: 'index.js'
    }),
    force: flags.boolean({
      char: 'f',
      description: 'Should we overwrite an exisiting file',
      default: false
    })
  }
});

ScaffoldCommand.examples = [
  'zapier scaffold resource "Contact"',
  'zapier scaffold resource "Contact" --entry=index.js',
  'zapier scaffold resource "Contag Tag" --dest=resources/tag',
  'zapier scaffold trigger "Existing Create" --force'
];

ScaffoldCommand.description = `Adds a starting resource, trigger, action or search to your app.

The first argument should one of \`resource|trigger|search|create\` followed by the name of the file.

The scaffold command does two general things:

* Creates a new destination file like \`resources/contact.js\`
* (Attempts to) import and register it inside your entry \`index.js\`

You can mix and match several options to customize the created scaffold for your project.

> Note, we may fail to rewrite your \`index.js\` so you may need to handle the require and registration yourself.
`;

module.exports = ScaffoldCommand;
