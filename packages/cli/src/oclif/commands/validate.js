const colors = require('colors/safe');
const { flags } = require('@oclif/command');

const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');
const { flattenCheckResult } = require('../../utils/display');
const { localAppCommand } = require('../../utils/local');
const { validateApp } = require('../../utils/api');

class ValidateCommand extends BaseCommand {
  async perform() {
    this.log('Validating project locally.');

    const errors = await localAppCommand({ command: 'validate' });

    const newErrors = errors.map(error => ({
      error,
      property: error.property.replace(/^instance/, 'App'),
      docLinks: (error.docLinks || []).join('\n')
    }));
    this.logTable({
      rows: newErrors,
      headers: [
        ['Property', 'property'],
        ['Message', 'message'],
        ['Links', 'docLinks']
      ],
      emptyMessage: 'No structural errors found during validation routine.'
    });

    if (newErrors.length) {
      this.log(
        'Your app is structurally invalid. Address concerns and run this command again.'
      );
      process.exitCode = 1;
    } else {
      this.log('This project is structurally sound!');
    }

    let checkResult = {};
    if (this.flags['without-style'] || process.exitCode === 1) {
      if (process.exitCode === 1) {
        this.log(
          colors.grey('\nSkipping app checks because app did not validate.')
        );
      }
      return;
    } else {
      this.log();
      this.startSpinner('Running app checks');

      const rawDefinition = await localAppCommand({
        command: 'definition'
      });

      checkResult = await validateApp(rawDefinition);
    }

    const doneMessage = checkResult.passes
      ? `Running app checks ... ${checkResult.passes.length} checks passed`
      : undefined;
    this.stopSpinner({ message: doneMessage });

    const checkIssues = flattenCheckResult(checkResult);

    this.log('\nHere are the issues we found:');
    this.logTable({
      rows: checkIssues,
      headers: [
        ['Category', 'category'],
        ['Method', 'method'],
        ['Description', 'description'],
        ['Link', 'link']
      ],
      emptyMessage: 'App checks passed, no issues found.'
    });

    if (checkResult.errors && checkResult.errors.results.length) {
      process.exitCode = 1;
      this.log(
        'Errors will block you from pushing; warnings will only block you from going public or promoting a version.\n'
      );
    } else if (checkResult.warnings && checkResult.warnings.results.length) {
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
    'without-style': flags.boolean({
      description: 'Forgo pinging the Zapier server to run further checks'
    })
  },
  opts: {
    format: true
  }
});

ValidateCommand.examples = [
  'zapier validate',
  'zapier validate --without-style',
  'zapier validate --format json'
];
ValidateCommand.description = `Validates your Zapier app.

Runs the standard validation routine powered by json-schema that checks your app for any structural errors. This is the same routine that runs during \`zapier build\`, \`zapier upload\`, \`zapier push\` or even as a test in \`zapier test\`.`;

module.exports = ValidateCommand;
