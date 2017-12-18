const colors = require('colors/safe');
const _ = require('lodash');

const utils = require('../utils');

const authenticationPaths = [
  'authentication.test',
  'authentication.oauth2Config.getAccessToken',
  'authentication.oauth2Config.refreshAccessToken',
  'authentication.sessionConfig.perform'
];

// {type:triggers}.{key:lead}.operation.perform
const actionTemplates = [
  '<%= type %>.<%= key %>.operation.perform',
  '<%= type %>.<%= key %>.operation.performSubscribe',
  '<%= type %>.<%= key %>.operation.performUnsubscribe',
  '<%= type %>.<%= key %>.operation.inputFields',
  '<%= type %>.<%= key %>.operation.outputFields'
].map(template => _.template(template));

const hydrateTemplate = _.template('hydrators.<%= key %>');

const inlineResourceMethods = [
  'get',
  'hook',
  'list',
  'search',
  'create',
  'searchOrCreate'
];

// resources.{key:lead}.get.operation.perform
const makeResourceTemplates = methods =>
  methods
    .reduce((acc, method) => {
      return acc.concat([
        `resources.<%= key %>.${method}.operation.perform`,
        `resources.<%= key %>.${method}.operation.performSubscribe`,
        `resources.<%= key %>.${method}.operation.performUnsubscribe`,
        `resources.<%= key %>.${method}.operation.inputFields`,
        `resources.<%= key %>.${method}.operation.outputFields`
      ]);
    }, [])
    .map(template => _.template(template));

const allResourceTemplates = makeResourceTemplates(inlineResourceMethods);

const typeMap = {
  triggers: ['list', 'hook'],
  searches: ['search'],
  creates: ['create']
};

const describe = context => {
  return Promise.resolve()
    .then(() =>
      Promise.all([
        utils.getLinkedApp().catch(() => null),
        utils.getLinkedAppConfig().catch(() => null),
        utils.getVersionInfo().catch(() => null),
        utils.localAppCommand({ command: 'definition' })
      ])
    )
    .then(([app, appConfig, version, definition]) => {
      context.line('A description of your app listed below.\n');

      if (app) {
        context.line(colors.bold('Title') + '\n');

        context.line(app.title);

        context.line();

        if (app.description) {
          context.line(colors.bold('Description') + '\n');

          context.line(app.description);

          context.line();
        }
      }

      context.line(colors.bold('Authentication') + '\n');
      let authRows = [];
      if (definition.authentication) {
        const authentication = _.assign({}, definition.authentication);
        authentication.paths = authenticationPaths
          .filter(path => _.has(definition, path))
          .join('\n');
        if (authentication.type === 'oauth2') {
          if (appConfig && version) {
            authentication.redirect_uri = version.oauth_redirect_uri;
          } else {
            authentication.redirect_uri = colors.grey(
              'do zapier push to see redirect_uri!'
            );
          }
        }
        authRows = [authentication];
      }
      const authHeaders = [
        ['Type', 'type'],
        ['Redirect URI', 'redirect_uri', colors.grey('n/a')],
        ['Available Methods', 'paths', colors.grey('n/a')]
      ];
      const authIfEmpty = colors.grey('Nothing found for authentication.');
      utils.printData(authRows, authHeaders, authIfEmpty);
      context.line();

      context.line(colors.bold('Hydrators') + '\n');
      let hydratorRows = _.map(definition.hydrators, (val, key) => {
        return {
          key,
          paths: hydrateTemplate({ key })
        };
      });
      const hydratorHeaders = [
        ['Key', 'key'],
        ['Method', 'paths', colors.grey('n/a')]
      ];
      const hydratorIfEmpty = colors.grey('Nothing found for hydrators.');
      utils.printData(hydratorRows, hydratorHeaders, hydratorIfEmpty);
      context.line();

      const resourceRows = _.values(definition.resources || {}).map(
        resource => {
          resource = _.assign({}, resource);
          resource.paths = allResourceTemplates
            .map(method => method({ key: resource.key }))
            .filter(path => _.has(definition, path))
            .join('\n');
          return resource;
        }
      );
      context.line(colors.bold('Resources') + '\n');
      const resourceHeaders = [
        ['Noun', 'noun'],
        ['Ref', 'key'],
        ['Available Methods', 'paths', colors.grey('n/a')]
      ];
      const resourceIfEmpty = colors.grey(
        'Nothing found for resources, maybe try the `zapier scaffold` command?'
      );
      utils.printData(resourceRows, resourceHeaders, resourceIfEmpty);
      context.line();

      Object.keys(typeMap).forEach(type => {
        context.line(colors.bold(_.capitalize(type)) + '\n');
        const rows = _.values(definition[type]).map(row => {
          row = _.assign({}, row);

          row.paths = [];

          // add possible action paths
          row.paths = row.paths.concat(
            actionTemplates.map(method => method({ type, key: row.key }))
          );

          // add possible resource paths
          if (row.operation.resource) {
            const key = row.operation.resource.split('.')[0];
            const resourceTemplates = makeResourceTemplates(typeMap[type]);
            row.paths = row.paths.concat(
              resourceTemplates.map(method => method({ key }))
            );
          }

          row.paths = row.paths
            .filter(path => _.has(definition, path))
            .join('\n');
          return row;
        });
        const headers = [
          ['Noun', 'noun'],
          ['Label', 'display.label'],
          ['Resource Ref', 'operation.resource', colors.grey('n/a')],
          ['Available Methods', 'paths', colors.grey('n/a')]
        ];
        const ifEmpty = colors.grey(
          `Nothing found for ${type}, maybe try the \`zapier scaffold\` command?`
        );
        utils.printData(rows, headers, ifEmpty);
        context.line();
      });
      context.line(
        "If you'd like to add more, try the `zapier scaffold` command to kickstart!"
      );
    });
};
describe.argsSpec = [];
describe.argOptsSpec = {};
describe.help = 'Describes the current app.';
describe.example = 'zapier describe';
describe.docs = `
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
# ┌────────────┬────────────────────┬──────────────┬───────────────────────────────────────────────┐
# │ Noun       │ Label              │ Resource Ref │ Available Methods                             │
# ├────────────┼────────────────────┼──────────────┼───────────────────────────────────────────────┤
# │ Member     │ Updated Subscriber │ member       │ triggers.updated_member.operation.perform     │
# │            │                    │              │ triggers.updated_member.operation.inputFields │
# │            │                    │              │ resources.member.list.operation.perform       │
# │            │                    │              │ resources.member.list.operation.inputFields   │
# └────────────┴────────────────────┴──────────────┴───────────────────────────────────────────────┘
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
