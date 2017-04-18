const utils = require('../utils');
const colors = require('colors/safe');

const logs = (context) => {
  context.line(`The logs of your app listed below.\n`);

  utils.startSpinner();
  return utils.listLogs(global.argOpts)
    .then((data) => {
      utils.endSpinner('');

      let columns;
      const type = global.argOpts.type || logs.argOptsSpec.type.default;
      if (type === 'http') {
        columns = [
          ['Status', 'response_status_code'],
          ['Method', 'request_method'],
          ['URL', 'request_url'],
          ['Querystring', 'request_params'],
          ['Version', 'app_cli_version'],
          ['Step ID', 'step'],
          // ['ID', 'id'],
          ['Timestamp', 'timestamp'],
        ];

        if (global.argOpts.detailed) {
          columns.push(['Request Headers', 'request_headers']);
          columns.push(['Request Body', 'request_data']);
          columns.push(['Response Headers', 'response_headers']);
          columns.push(['Response Body', 'response_content']);
        }
      } else {
        columns = [
          ['Log', 'full_message'],
          ['Version', 'app_cli_version'],
          ['Step', 'step'],
          // ['ID', 'id'],
          ['Timestamp', 'timestamp'],
        ];
      }

      const ifEmpty = colors.grey('No logs found. Try adding some `z.request()`, `z.console.log()` and doing a `zapier push`!\n');

      const listLogs = [].concat(data.logs);
      listLogs.reverse();
      utils.printData(listLogs, columns, ifEmpty, true);

      context.line(colors.grey('  Most recent logs near the bottom.'));

      if (type === 'http' && !global.argOpts.detailed) {
        context.line(colors.grey('  TIP: Use `zapier logs --type=http --detailed` to include response information.'));
      }
    });
};
logs.argsSpec = [];
logs.argOptsSpec = {
  version: {help: 'display only this version\'s logs (default is all versions)'},
  status: {help: 'display only success logs (status code < 400 / info) or error (status code > 400 / tracebacks)', choices: ['any', 'success', 'error'], default: 'any'},
  type: {help: 'display only console or http logs', choices: ['console', 'http'], default: 'console'},
  detailed: {help: 'show detailed logs (like request/response body and headers)', flag: true},
  user: {help: 'display only this user\'s logs', example: 'user@example.com', 'default': 'me'},
  limit: {help: 'control the maximum result size', default: 50},
};
logs.help = 'Prints recent logs. See help for filter arguments.';
logs.example = 'zapier logs';
logs.docs = `\
Get the logs that are automatically collected during the running of your app. Either explicitly during \`z.console.log()\`, automatically via \`z.request()\`, or any sort of traceback or error.

> Does not collect or list the errors found locally during \`zapier test\`.

**Arguments**

${utils.argsFragment(logs.argsSpec)}
${utils.argOptsFragment(logs.argOptsSpec)}
${utils.defaultArgOptsFragment()}

${'```'}bash
$ zapier logs
# The logs of your app "Example" listed below.
#
# ┌──────────────────────────────────────────────────────┐
# │ = 1 =                                                │
# │     Log       │ console says hello world!            │
# │     Version   │ 1.0.0                                │
# │     Step      │ 99c16565-1547-4b16-bcb5-45189d9d8afa │
# │     Timestamp │ 2016-01-01T23:04:36-05:00            │
# └───────────────┴──────────────────────────────────────┘

$ zapier logs --type=http
# The logs of your app "Example" listed below.
#
# ┌────────────────────────────────────────────────────────┐
# │ = 1 =                                                  │
# │     Status      │ 200                                  │
# │     URL         │ http://httpbin.org/get               │
# │     Querystring │ hello=world                          │
# │     Version     │ 1.0.0                                │
# │     Step        │ 99c16565-1547-4b16-bcb5-45189d9d8afa │
# │     Timestamp   │ 2016-01-01T23:04:36-05:00            │
# └─────────────────┴──────────────────────────────────────┘

$ zapier logs --type=http --detailed --format=plain
# The logs of your app "Example" listed below.
#
# == Status
# 200
# == URL
# http://httpbin.org/get
# == Querystring
# hello=world
# == Version
# 1.0.0
# == Step
# 99c16565-1547-4b16-bcb5-45189d9d8afa
# == Timestamp
# 2016-08-03T23:04:36-05:00
# == Request Body
# == Response Body
# {
#   "args": {
#     "hello": "world"
#   },
#   "headers": {
#     "Accept": "*/*",
#     "Accept-Encoding": "gzip,deflate",
#     "Host": "httpbin.org",
#     "User-Agent": "Zapier"
#   },
#   "origin": "123.123.123.123",
#   "url": "http://httpbin.org/get?hello=world"
# }
${'```'}
`;

module.exports = logs;
