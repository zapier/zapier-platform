const colors = require('colors/safe');
const { flags } = require('@oclif/command');

const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');
const { flattenCheckResult, formatStyles } = require('../../utils/display');
const { localAppCommand } = require('../../utils/local');
const { validateApp } = require('../../utils/api');

class ValidateCommand extends BaseCommand {
  async perform() {
    this.log('Validating project locally.');

    const errors = await localAppCommand({ command: 'validate' });

    const newErrors = errors.map(error => {
      error = Object.assign({}, error);
      error.property = error.property.replace(/^instance/, 'App');
      error.docLinks = (error.docLinks || []).join('\n');
      return error;
    });
    this.logTable({
      rows: newErrors,
      headers: [
        ['Property', 'property'],
        ['Message', 'message'],
        ['Links', 'docLinks']
      ],
      emptyMessage: colors.grey(
        'No structural errors found during validation routine.'
      )
    });

    if (newErrors.length) {
      this.log(
        'Your app is structurally invalid. Address concerns and run this command again.'
      );
      process.exitCode = 1;
    } else {
      this.log('This project is structurally sound!');
    }

    let checkResult = [];
    if (0 && (this.flags['no-server'] || process.exitCode === 1)) {
      if (process.exitCode === 1) {
        this.log(
          colors.grey('\nSkipping app checks because app did not validate.')
        );
      }
      return;
    } else {
      this.log('\nRunning app checks.');

      const rawDefinition = await localAppCommand({
        command: 'definition'
      });

      checkResult = await validateApp(rawDefinition);
    }

    const checkIssues = flattenCheckResult(checkResult);

    this.logTable({
      rows: checkIssues,
      headers: [
        ['Category', 'category'],
        ['Method', 'method'],
        ['Description', 'description'],
        ['Link', 'link']
      ],
      emptyMessage: colors.grey('App checks passed, no issues found.')
    });

    if (checkResult.errors && checkResult.errors.length) {
      process.exitCode = 1;
      this.log(
        'Errors will block you from pushing; warnings only block you from going public or promoting a version.\n'
      );
    } else if (checkResult.warnings.length) {
      this.log(
        'Your app looks great! Warnings only block you from going public or promoting a version.\n'
      );
    } else {
      this.log('Your app looks great!\n');
    }
  }
}

ValidateCommand.flags = buildFlags({
  commandFlags: {
    format: flags.string({
      char: 'f',
      options: Object.keys(formatStyles),
      default: 'row'
    }),
    'no-server': flags.boolean({
      description: 'Forgo pinging the Zapier server to run further checks'
    })
  }
});

ValidateCommand.args = [];

ValidateCommand.examples = ['zapier validate', 'zapier validate --no-server'];
ValidateCommand.description = `Validates your Zapier app.

Runs the standard validation routine powered by json-schema that checks your app for any structural errors. This is the same routine that runs during \`zapier build\`, \`zapier upload\`, \`zapier push\` or even as a test in \`zapier test\`.`;

module.exports = ValidateCommand;
