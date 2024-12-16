const colors = require('colors/safe');
const { Flags } = require('@oclif/core');

const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');
const { flattenCheckResult } = require('../../utils/display');
const { localAppCommand } = require('../../utils/local');
const { validateApp } = require('../../utils/api');

class ValidateCommand extends BaseCommand {
  async perform() {
    this.log('Validating project locally');

    const errors = await localAppCommand({ command: 'validate' });
    const newErrors = errors.map((error) => ({
      ...error,
      property: error.property.replace(/^instance/, 'App'),
      docLinks: (error.docLinks || []).join('\n'),
    }));
    this.logTable({
      rows: newErrors,
      headers: [
        ['Property', 'property'],
        ['Message', 'message'],
        ['Links', 'docLinks'],
      ],
      emptyMessage: 'No structural errors found during validation routine.',
    });

    if (newErrors.length) {
      this.log(
        'Your integration is structurally invalid. Address concerns and run this command again.',
      );
      process.exitCode = 1;
    } else {
      this.log('This project is structurally sound!');
    }

    let checkResult = {};
    if (this.flags['without-style'] || process.exitCode === 1) {
      if (process.exitCode === 1) {
        this.log(
          colors.grey(
            '\nSkipping integration checks because schema did not validate.',
          ),
        );
      }
      return;
    } else {
      this.log();
      this.startSpinner('Running integration checks');

      const rawDefinition = await localAppCommand({
        command: 'definition',
      });

      checkResult = await validateApp(rawDefinition);
    }

    const doneMessage = checkResult.passes
      ? `Running integration checks ... ${checkResult.passes.length} checks passed`
      : undefined;
    this.stopSpinner({ message: doneMessage });

    const checkIssues = flattenCheckResult(checkResult);

    this.log();
    if (checkIssues.length) {
      this.log('Here are the issues we found:');
    }

    this.logTable({
      rows: checkIssues,
      headers: [
        ['Category', 'category'],
        ['Method', 'method'],
        ['Description', 'description'],
        ['Link', 'link'],
      ],
      emptyMessage: 'Integration checks passed, no issues found.',
    });

    const errorDisplay = checkResult.errors.display_label;
    const warningDisplay = checkResult.warnings.display_label;
    const suggestionDisplay = checkResult.suggestions.display_label;

    if (checkIssues.length) {
      this.logTable({
        headers: [
          ['', 'type'],
          ['', 'description'],
        ],
        rows: [
          {
            type: `- ${colors.bold(errorDisplay)}`,
            description:
              'Issues that will prevent your integration from functioning properly. They block you from pushing.',
          },
          {
            type: `- ${colors.bold(warningDisplay)}`,
            description:
              'To-dos that must be addressed before your integration can be included in the App Directory. They block you from promoting and publishing.',
          },
          {
            type: `- ${colors.bold(suggestionDisplay)}`,
            description:
              "Issues and recommendations that need human reviews by Zapier before publishing your integration. They don't block.",
          },
        ],
        hasBorder: false,
        showHeaders: false,
        style: { head: [], 'padding-left': 0, 'padding-right': 0 },
      });
    }
    this.log();
  }
}

ValidateCommand.flags = buildFlags({
  commandFlags: {
    'without-style': Flags.boolean({
      description: 'Forgo pinging the Zapier server to run further checks.',
    }),
  },
  opts: {
    format: true,
  },
});

ValidateCommand.examples = [
  'zapier validate',
  'zapier validate --without-style',
  'zapier validate --format json',
];
ValidateCommand.description = `Validate your integration.

Run the standard validation routine powered by json-schema that checks your integration for any structural errors. This is the same routine that runs during \`zapier build\`, \`zapier upload\`, \`zapier push\` or even as a test in \`zapier test\`.`;

module.exports = ValidateCommand;
