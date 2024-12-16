const { Flags } = require('@oclif/core');
const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');
const { grey } = require('colors/safe');
const { pick } = require('lodash');

const { listLogs } = require('../../utils/api');

// pulled out so we can pull these explicitly to send to the server
const commandFlags = {
  version: Flags.string({
    char: 'v',
    description: 'Filter logs to the specified version.',
  }),
  status: Flags.string({
    char: 's',
    description: 'Filter logs to only see errors or successes',
    options: ['any', 'success', 'error'],
    default: 'any', // this doesn't really need to be a status
  }),
  type: Flags.string({
    char: 't',
    description: 'See logs of the specified type',
    options: ['console', 'bundle', 'http'],
    default: 'console',
  }),
  detailed: Flags.boolean({
    // no char since it conflicts with --debug
    description: 'See extra info, like request/response body and headers.',
  }),
  user: Flags.string({
    char: 'u',
    description: 'Only show logs for this user. Defaults to your account.',
    default: 'me',
  }),
  limit: Flags.integer({
    description:
      'Cap the number of logs returned. Max is 50 (also the default)',
    default: 50,
  }),
};

class LogsCommand extends BaseCommand {
  async perform() {
    this.startSpinner('Loading logs');

    const flags = pick(this.flags, Object.keys(commandFlags));
    const { logs } = await listLogs(flags);
    this.stopSpinner();
    const hasLogs = Boolean(logs.length);

    let headers;
    if (this.flags.type === 'http') {
      headers = [
        ['Status', 'response_status_code'],
        ['Method', 'request_method'],
        ['URL', 'request_url'],
        ['Querystring', 'request_params'],
        ['Version', 'app_cli_version'],
        ['Step ID', 'step'],
        // ['ID', 'id'],
        ['Timestamp', 'timestamp'],
      ];

      if (this.flags.detailed) {
        headers = headers.concat([
          ['Request Headers', 'request_headers'],
          ['Request Body', 'request_data'],
          ['Response Headers', 'response_headers'],
          ['Response Body', 'response_content'],
        ]);
      }
    } else if (this.flags.type === 'bundle') {
      headers = [
        ['Log', 'message'],
        ['Input', 'input'],
        ['Output', 'output'],
        ['Version', 'app_cli_version'],
        // ['ID', 'id'],
        ['Timestamp', 'timestamp'],
      ];
    } else {
      headers = [
        ['Log', 'full_message'],
        ['Version', 'app_cli_version'],
        ['Step', 'step'],
        // ['ID', 'id'],
        ['Timestamp', 'timestamp'],
      ];
    }

    this.logTable({
      rows: logs.reverse(), // oldest logs first
      headers,
      emptyMessage:
        'No logs found. Try adding some `z.request()`, `z.console.log()` and doing a `zapier push`!\n',
    });

    if (hasLogs) {
      this.log(grey('  Most recent logs near the bottom.'));

      if (this.flags.type === 'http' && !this.flags.detailed) {
        this.log(
          grey(
            '  TIP: Use `zapier logs --type=http --detailed` to include response information.',
          ),
        );
      }
    }
  }
}

LogsCommand.skipValidInstallCheck = true;
LogsCommand.flags = buildFlags({
  commandFlags,
  opts: { format: true },
});
LogsCommand.description = `Print recent logs.

Logs are created when your integration is run as part of a Zap. They come from explicit calls to \`z.console.log()\`, usage of \`z.request()\`, and any runtime errors.

This won't show logs from running locally with \`zapier test\`, since those never hit our server.`;

module.exports = LogsCommand;
