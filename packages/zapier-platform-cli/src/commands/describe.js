const colors = require('colors/safe');
const _ = require('lodash');

const utils = require('../utils');

const possibleMethods = [
  '<%= type %>.<%= key %>.operation.perform',
  '<%= type %>.<%= key %>.operation.performSubscribe',
  '<%= type %>.<%= key %>.operation.performUnsubscribe',
  '<%= type %>.<%= key %>.operation.inputFields',
  '<%= type %>.<%= key %>.operation.outputFields',
].map(method => _.template(method));

const describe = (context) => {
  return Promise.resolve()
    .then(() => utils.localAppCommand({command: 'definition'}))
    .then((definition) => {
      context.line(`A description of your app listed below.\n`);

      // context.line(utils.prettyJSONstringify(definition));
      // TODO: auth and app title/description

      // resources.form.list.operation.perform

      const types = ['triggers', 'searches', 'creates'];

      types.forEach((type) => {
        context.line(colors.bold(_.capitalize(type)) + '\n');
        const rows = _.values(definition[type]).map(row => {
          row.methods = possibleMethods
            .map(method => method({type, key: row.key}))
            .filter(path => _.has(definition, path))
            .join('\n');
          return row;
        });
        const headers = [
          ['Noun', 'noun'],
          ['Label', 'display.label'],
          ['Resource', 'operation.resource', colors.grey('n/a')],
          ['Available Methods', 'methods', colors.grey('n/a')],
        ];
        const ifEmpty = colors.grey(`Nothing found for ${type}, maybe try the \`zapier scaffold\` command?`);
        utils.printData(rows, headers, ifEmpty);
        context.line();
      });
      context.line('If you\'d like to add more, try the `zapier scaffold` command to kickstart!');
    });
};
describe.argsSpec = [];
describe.argOptsSpec = {};
describe.help = 'Describes the current app.';
describe.example = 'zapier describe';
describe.docs = `\
Prints a human readable enumeration of your app's triggers, searches, and actions as seen by Zapier. Useful to understand how your resources convert and relate to different actions.

> These are the same actions we'd display in our editor!

* \`Noun\` -- your action's noun
* \`Label\` -- your action's label
* \`Resource\` -- the resource (if any) this action is tied to
* \`Available Methods\` -- testable methods for this action

**Arguments**

${utils.argsFragment(describe.argsSpec)}
${utils.argOptsFragment(describe.argOptsSpec)}
${utils.defaultArgOptsFragment()}

${'```'}bash
$ zapier describe
# A description of your app "Example" listed below.
# 
# Triggers
# 
# ┌─────────────┬──────────┬───────────────┬────────────────────┬───────────────────┐
# │ key         │ noun     │ display.label │ operation.resource │ operation.perform │
# ├─────────────┼──────────┼───────────────┼────────────────────┼───────────────────┤
# │ hello_world │ Greeting │ New Greeting  │ n/a                │ $func$2$f$        │
# └─────────────┴──────────┴───────────────┴────────────────────┴───────────────────┘
# 
# Searches
# 
#  Nothing found for searches, maybe try the \`zapier scaffold\` command?
# 
# Creates
# 
#  Nothing found for creates, maybe try the \`zapier scaffold\` command?
# 
# If you'd like to add more, try the \`zapier scaffold\` command to kickstart!
${'```'}
`;

module.exports = describe;
