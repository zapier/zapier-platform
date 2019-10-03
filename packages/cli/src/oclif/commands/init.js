const { flags } = require('@oclif/command');

const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');
const appTemplates = require('../../app-templates');

const { isExistingEmptyDir } = require('../../utils/files');

const { oInitApp } = require('../../utils/init');
const {
  downloadExampleAppTo,
  removeReadme
} = require('../../utils/example-apps');

class InitCommand extends BaseCommand {
  generateCreateFunc(template) {
    return async tempAppDir => {
      this.startSpinner(
        `Downloading the ${template} starter app from https://github.com/zapier/zapier-platform/tree/master/example-apps`
      );
      await downloadExampleAppTo(template, tempAppDir);
      await removeReadme(tempAppDir);
      this.stopSpinner();
    };
  }

  async perform() {
    const { path } = this.args;
    const { template } = this.flags;
    // sometimes the parser acts funny if there's an invalid flag and no arg, so just to double check,
    // I've filed https://github.com/oclif/parser/issues/57
    if (path.startsWith('-')) {
      this.error(`Invalid path: "${path}"`);
    }
    this.log('Initializing new app');
    this.log();
    if (
      (await isExistingEmptyDir(path)) &&
      !(await this.confirm(`Path "${path}" is not empty. Continue anyway?`))
    ) {
      this.exit();
    }

    await oInitApp(path, this.generateCreateFunc(template));
  }
}

InitCommand.flags = buildFlags({
  commandFlags: {
    template: flags.string({
      char: 't',
      description: 'The template to start your app with.',
      options: appTemplates,
      default: 'minimal'
    })
  }
});
InitCommand.args = [
  {
    name: 'path',
    required: true,
    description:
      "Where to create the new app. If the directory doesn't exist, it will be created. If the directory isn't empty, we'll ask for confirmation"
  }
];
InitCommand.examples = [
  'zapier init ./some/path',
  'zaper init . --template typescript'
];
InitCommand.description = `Initializes a new Zapier app. Optionally uses a template.

After running this, you'll have a new example app in your directory. If you re-run this command on an existing directory it will leave existing files alone and not clobber them.

> Note: this doesn't register or deploy the app with Zapier - try the \`zapier register\` and \`zapier push\` commands for that!`;

module.exports = InitCommand;
