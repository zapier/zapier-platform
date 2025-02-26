const { join } = require('path');

const { Args, Flags } = require('@oclif/core');
const yeoman = require('yeoman-environment');

const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');
const { TEMPLATE_CHOICES, ProjectGenerator } = require('../../generators');

class InitCommand extends BaseCommand {
  async perform() {
    const { path } = this.args;
    const { template } = this.flags;

    const env = yeoman.createEnv();
    env.registerStub(ProjectGenerator, 'zapier:integration');

    await env.run('zapier:integration', { path, template });

    this.log();
    this.log(`A new integration has been created in directory "${path}".`);
    this.log(`Read all about it in "${join(path, 'README.md')}".`);
  }
}

InitCommand.flags = buildFlags({
  commandFlags: {
    template: Flags.string({
      char: 't',
      description: 'The template to start your integration with.',
      options: TEMPLATE_CHOICES,
    }),
    module: Flags.string({
      char: 'm',
      description:
        'Choose module type: CommonJS or ES Modules. Only enabled for Typescript and Minimal templates.',
      options: ['commonjs', 'esm'],
      default: 'commonjs',
    }),
  },
});
InitCommand.args = {
  path: Args.string({
    description:
      "Where to create the new integration. If the directory doesn't exist, it will be created. If the directory isn't empty, we'll ask for confirmation",
    required: true,
  }),
};
InitCommand.examples = [
  'zapier init myapp',
  'zapier init ./path/myapp --template oauth2',
  'zapier init ./path/myapp --template minimal --module esm',
];
InitCommand.description = `Initialize a new Zapier integration with a project template.

After running this, you'll have a new integration in the specified directory. If you re-run this command on an existing directory, it will prompt before overwriting any existing files.

This doesn't register or deploy the integration with Zapier - try the \`zapier register\` and \`zapier push\` commands for that!`;

InitCommand.skipValidInstallCheck = true;

module.exports = InitCommand;
