const { flags } = require('@oclif/command');
const yeoman = require('yeoman-environment');

const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');
const { AUTH_TYPE_CHOICES, ProjectGenerator } = require('../../generators');

class InitCommand extends BaseCommand {
  async perform() {
    const { path } = this.args;
    const { auth } = this.flags;

    const env = yeoman.createEnv();
    env.registerStub(ProjectGenerator, 'zapier:integration');

    env.run('zapier:integration', { path, authType: auth }, () => {
      this.log();
      this.log(`A new integration has been created in directory "${path}"`);
    });
  }
}

InitCommand.flags = buildFlags({
  commandFlags: {
    auth: flags.string({
      char: 'a',
      description: "Your integration's auth type.",
      options: AUTH_TYPE_CHOICES.map(x => x.value)
    })
  }
});
InitCommand.args = [
  {
    name: 'path',
    required: true,
    description:
      "Where to create the new integration. If the directory doesn't exist, it will be created. If the directory isn't empty, we'll ask for confirmation"
  }
];
InitCommand.examples = [
  'zapier yo myapp',
  'zapier yo ./path/myapp --auth oauth2'
];
InitCommand.description = `Initialize a new Zapier integration. Optionally uses a template.

After running this, you'll have a new integration in the specified directory. If you re-run this command on an existing directory, it will prompt before overwriting any existing files.

This doesn't register or deploy the integration with Zapier - try the \`zapier register\` and \`zapier push\` commands for that!`;

InitCommand.skipValidInstallCheck = true;

module.exports = InitCommand;
