const { flags } = require('@oclif/command');

const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');

class AICommand extends BaseCommand {
  async perform() {
    const { operation, actionType, instructions } = this.args;
    const { 'add-url': addUrl, 'add-file': addFile } = this.flags;

    // TODO: Implement AI logic here
    this.log(`Executing AI command:`);
    this.log(`Operation: ${operation}`);
    this.log(`Action Type: ${actionType}`);
    this.log(`Instructions: ${instructions}`);
    this.log(`Add URLs: ${addUrl ? addUrl.join(', ') : 'None'}`);
    this.log(`Add Files: ${addFile ? addFile.join(', ') : 'None'}`);

    // Placeholder for AI processing
    this.startSpinner('Processing AI request...');
    // Simulating some work
    await new Promise(resolve => setTimeout(resolve, 2000));
    this.stopSpinner();

    this.log('\nAI command executed successfully!');
  }
}

AICommand.args = [
  {
    name: 'operation',
    required: true,
    options: ['new', 'update'],
    description: 'The operation to perform (new or update)',
  },
  {
    name: 'actionType',
    required: true,
    description: 'The type of action to work on (e.g., trigger, search, create)',
  },
  {
    name: 'instructions',
    required: true,
    description: 'Instructions for the AI',
  },
];

AICommand.flags = buildFlags({
  commandFlags: {
    'add-url': flags.string({
      description: 'Add a URL for additional context (can be used multiple times)',
      multiple: true,
    }),
    'add-file': flags.string({
      description: 'Add a local file for additional context (can be used multiple times)',
      multiple: true,
    }),
    // Ready for more flags to be added here
  },
});

AICommand.description = `Execute AI-powered operations on your Zapier integration.

This command allows you to leverage AI to create new triggers, searches, or creates in your Zapier integration.

Usage:
zapier ai [new|update] [actionType] ["Some instructions"] [--add-url=<url>] [--add-file=<file>]

- [new|update]: Specify whether to create a new trigger, search, or create in your Zapier integration.
- [actionType]: The type of action to work on (e.g., trigger, search, create).
- ["Some instructions"]: Provide instructions for the AI in quotes.
- [--add-url=<url>]: Optional flag to include additional URL context in the AI request (can be used multiple times).
- [--add-file=<file>]: Optional flag to include local file context in the AI request (can be used multiple times).`;

AICommand.examples = [
  'zapier ai new trigger "Create a trigger for new email messages"',
  'zapier ai update search "Modify the contact search to include phone number" --add-url="https://example.com/docs/search" --add-file="./local_schema.json"',
];

module.exports = AICommand;