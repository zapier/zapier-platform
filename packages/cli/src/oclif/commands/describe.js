const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');
const { bold, grey } = require('colors/safe');
const {
  getWritableApp,
  getLinkedAppConfig,
  getVersionInfo,
} = require('../../utils/api');
const { localAppCommand } = require('../../utils/local');

const _ = require('lodash');

const authenticationPaths = [
  'authentication.test',
  'authentication.oauth2Config.getAccessToken',
  'authentication.oauth2Config.refreshAccessToken',
  'authentication.sessionConfig.perform',
];

// {type:triggers}.{key:lead}.operation.perform
const actionTemplates = [
  '<%= type %>.<%= key %>.operation.perform',
  '<%= type %>.<%= key %>.operation.performSubscribe',
  '<%= type %>.<%= key %>.operation.performUnsubscribe',
  '<%= type %>.<%= key %>.operation.inputFields',
  '<%= type %>.<%= key %>.operation.outputFields',
].map((template) => _.template(template));

const hydrateTemplate = _.template('hydrators.<%= key %>');

const inlineResourceMethods = [
  'get',
  'hook',
  'list',
  'search',
  'create',
  'searchOrCreate',
];

// resources.{key:lead}.get.operation.perform
const makeResourceTemplates = (methods) =>
  methods
    .reduce((acc, method) => {
      return acc.concat([
        `resources.<%= key %>.${method}.operation.perform`,
        `resources.<%= key %>.${method}.operation.performSubscribe`,
        `resources.<%= key %>.${method}.operation.performUnsubscribe`,
        `resources.<%= key %>.${method}.operation.inputFields`,
        `resources.<%= key %>.${method}.operation.outputFields`,
      ]);
    }, [])
    .map((template) => _.template(template));

const allResourceTemplates = makeResourceTemplates(inlineResourceMethods);

const typeMap = {
  triggers: ['list', 'hook'],
  searches: ['search'],
  creates: ['create'],
};

class DescribeCommand extends BaseCommand {
  logTitle(s) {
    this.log(bold(s) + '\n');
  }

  async perform() {
    this.startSpinner('Fetching integration info');
    const [app, appConfig, version, definition] = await Promise.all([
      getWritableApp().catch(() => null),
      getLinkedAppConfig().catch(() => null),
      getVersionInfo().catch(() => null),
      localAppCommand({ command: 'definition' }),
    ]);
    this.stopSpinner();
    if (app) {
      this.logTitle('Title');
      this.log(app.title + '\n');

      if (app.description) {
        this.logTitle('Description');
        this.log(app.description + '\n');
      }
    }

    this.logTitle('Authentication');
    let authRows = [];
    if (definition.authentication) {
      const authentication = { ...definition.authentication };
      authentication.paths = authenticationPaths
        .filter((path) => _.has(definition, path))
        .join('\n');
      if (['oauth2', 'oauth1'].includes(authentication.type)) {
        if (appConfig && version) {
          authentication.redirect_uri = version.oauth_redirect_uri;
        } else {
          authentication.redirect_uri = grey(
            'Run `zapier push` to see the redirect_uri.',
          );
        }
      }
      authRows = [authentication];
    }
    this.logTable({
      rows: authRows,
      headers: [
        ['Type', 'type'],
        ['Redirect URI', 'redirect_uri', grey('n/a')],
        ['Available Methods', 'paths', grey('n/a')],
      ],
      emptyMessage: grey('No authentication found.'),
    });
    this.log();

    const hydratorRows = _.map(definition.hydrators, (val, key) => ({
      key,
      paths: hydrateTemplate({ key }),
    }));
    this.logTitle('Hydrators');
    this.logTable({
      rows: hydratorRows,
      headers: [
        ['Key', 'key'],
        ['Method', 'paths', grey('n/a')],
      ],
      emptyMessage: grey('No hydrators found.'),
    });
    this.log();

    const resourceRows = _.values(definition.resources || {}).map(
      (resource) => ({
        ...resource,
        paths: allResourceTemplates
          .map((method) => method({ key: resource.key }))
          .filter((path) => _.has(definition, path))
          .join('\n'),
      }),
    );
    this.logTitle('Resources');
    this.logTable({
      rows: resourceRows,
      headers: [
        ['Noun', 'noun'],
        ['Ref', 'key'],
        ['Available Methods', 'paths', grey('n/a')],
      ],
      emptyMessage: grey('No resources found.'),
    });
    this.log();

    Object.keys(typeMap).forEach((type) => {
      this.logTitle(_.capitalize(type));
      const rows = _.values(definition[type]).map((row) => {
        // add possible action paths
        let paths = actionTemplates.map((method) =>
          method({ type, key: row.key }),
        );

        // add possible resource paths
        if (row.operation.resource) {
          const key = row.operation.resource.split('.')[0];
          const resourceTemplates = makeResourceTemplates(typeMap[type]);
          paths = paths.concat(
            resourceTemplates.map((method) => method({ key })),
          );
        }

        paths = paths.filter((path) => _.has(definition, path)).join('\n');

        return {
          ...row,
          paths,
        };
      });

      this.logTable({
        rows,
        headers: [
          ['Noun', 'noun'],
          ['Label', 'display.label'],
          ['Resource Ref', 'operation.resource', grey('n/a')],
          ['Available Methods', 'paths', grey('n/a')],
        ],
        emptyMessage: grey(
          `Nothing found for ${type}. Use the \`zapier scaffold\` command to add one.`,
        ),
      });

      this.log();

      this.log('To add more, use the `zapier scaffold` command.');
    });
  }
}

DescribeCommand.flags = buildFlags({ opts: { format: true } });
DescribeCommand.description = `Describe the current integration.

This command prints a human readable enumeration of your integrations's
triggers, searches, and creates as seen by Zapier. Useful to understand how your
resources convert and relate to different actions.

* **Noun**: your action's noun
* **Label**: your action's label
* **Resource**: the resource (if any) this action is tied to
* **Available Methods**: testable methods for this action`;

module.exports = DescribeCommand;
