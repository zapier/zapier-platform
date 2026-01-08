const fsP = require('node:fs/promises');

const _ = require('lodash');
const { Args, Flags } = require('@oclif/core');
const dotenv = require('dotenv');

const BaseCommand = require('../../ZapierBaseCommand');
const { buildFlags } = require('../../buildFlags');
const { localAppCommand } = require('../../../utils/local');
const { readAppPackageJson } = require('../../../utils/misc');
const { getLinkedAppConfig, readCredentials } = require('../../../utils/api');
const { AUTH_KEY } = require('../../../constants');

const {
  AUTH_FIELD_ENV_PREFIX,
  loadAuthDataFromEnv,
  appendEnv,
} = require('./env');
const { startAuth, testAuth, getAuthLabel, refreshAuth } = require('./auth');
const { invokeAction } = require('./action');
const { promptForAuthentication } = require('./prompts');

const ACTION_TYPE_PLURALS = {
  trigger: 'triggers',
  search: 'searches',
  create: 'creates',
};

const ACTION_TYPES = ['auth', ...Object.keys(ACTION_TYPE_PLURALS)];

/**
 * Reads all data from a readable stream and returns it as a string.
 * @param {import('stream').Readable} stream - The readable stream to consume
 * @returns {Promise<string>} The concatenated stream contents
 */
const readStream = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return chunks.join('');
};

/**
 * Recursively finds all non-string primitive values in a data structure.
 * Used to validate that inputData contains only string values.
 * @param {*} data - The data to search
 * @param {string} [path='inputData'] - The current path for error reporting
 * @returns {Array<{path: string, value: *}>} Array of objects with path and non-string value
 */
const findNonStringPrimitives = (data, path = 'inputData') => {
  if (typeof data === 'number' || typeof data === 'boolean' || data === null) {
    return [{ path, value: data }];
  } else if (typeof data === 'string') {
    return [];
  } else if (Array.isArray(data)) {
    const paths = [];
    for (let i = 0; i < data.length; i++) {
      paths.push(...findNonStringPrimitives(data[i], `${path}[${i}]`));
    }
    return paths;
  } else if (_.isPlainObject(data)) {
    const paths = [];
    for (const [k, v] of Object.entries(data)) {
      paths.push(...findNonStringPrimitives(v, `${path}.${k}`));
    }
    return paths;
  } else {
    throw new Error('Unexpected data type');
  }
};

class InvokeCommand extends BaseCommand {
  /**
   * Main entry point for the invoke command. Handles auth operations (start, test, label, refresh)
   * and action invocations (trigger, create, search).
   * @returns {Promise<void>}
   */
  async perform() {
    // Execution context that will be passed around
    const context = {
      // Data directly from command args and flags
      remote: this.flags.remote,
      version: this.flags.version || (await readAppPackageJson()).version,
      authId: this.flags['authentication-id'],
      nonInteractive: this.flags['non-interactive'] || !process.stdin.isTTY,
      actionType: this.args.actionType,
      actionKey: this.args.actionKey,
      timezone: this.flags.timezone,
      redirectUri: this.flags['redirect-uri'],
      port: this.flags['local-port'],
      meta: {
        isLoadingSample: this.flags.isLoadingSample,
        isFillingDynamicDropdown: this.flags.isFillingDynamicDropdown,
        isPopulatingDedupe: this.flags.isPopulatingDedupe,
        limit: this.flags.limit,
        page: this.flags.page,
        paging_token: this.flags['paging-token'],
        isTestingAuth: false, // legacy property
      },

      // Data to be filled later
      actionTypePlural: null,
      appDefinition: null,
      authData: {},
      appId: null,
      deployKey: null,
      inputData: null,

      // These will be used to patch z.cache() and z.cursor()
      zcacheTestObj: {},
      cursorTestObj: {},
    };

    const dotenvResult = dotenv.config({ override: true, quiet: true });
    if (!context.authId && _.isEmpty(dotenvResult.parsed)) {
      console.warn(
        'The .env file does not exist or is empty. ' +
          'You may need to set some environment variables in there if your code uses process.env.',
      );
    }

    if (context.remote && !context.version) {
      throw new Error(
        'Cannot determine the version to invoke. ' +
          'Specify `--version` or make sure your package.json has a `version` field.',
      );
    }

    if (!context.actionType) {
      if (context.nonInteractive) {
        throw new Error(
          'You must specify ACTIONTYPE and ACTIONKEY in non-interactive mode.',
        );
      }
      context.actionType = await this.promptWithList(
        'Which action type would you like to invoke?',
        ACTION_TYPES,
        { useStderr: true },
      );
    }

    context.actionTypePlural = ACTION_TYPE_PLURALS[context.actionType];
    context.appDefinition = await localAppCommand({ command: 'definition' });

    if (!context.actionKey) {
      if (context.nonInteractive) {
        throw new Error('You must specify ACTIONKEY in non-interactive mode.');
      }
      if (context.actionType === 'auth') {
        const actionKeys = ['label', 'refresh', 'start', 'test'];
        context.actionKey = await this.promptWithList(
          'Which auth operation would you like to invoke?',
          actionKeys,
          { useStderr: true },
        );
      } else {
        const actionKeys = Object.keys(
          context.appDefinition[context.actionTypePlural] || {},
        ).sort();
        if (!actionKeys.length) {
          throw new Error(
            `No "${context.actionTypePlural}" found in your integration.`,
          );
        }

        context.actionKey = await this.promptWithList(
          `Which "${context.actionType}" key would you like to invoke?`,
          actionKeys,
          { useStderr: true },
        );
      }
    }

    context.appId = (await getLinkedAppConfig(null, false))?.id;
    context.deployKey = (await readCredentials(false))[AUTH_KEY];

    if (
      context.authId === '-' ||
      context.authId === '' ||
      (context.remote && !context.authId)
    ) {
      if (context.nonInteractive) {
        throw new Error(
          'You must specify an `--authentication-id` (an integer) in non-interactive mode.',
        );
      }
      context.authId = (await promptForAuthentication(this)).toString();
    }

    if (context.authId) {
      context.authId = parseInt(context.authId);
      if (isNaN(context.authId)) {
        throw new Error(
          "`--authentication-id` must be an integer or '-' to select from available authentications.",
        );
      }
    }

    if (context.authId && !context.remote) {
      // Fill authData with curlies if we're in relay mode
      const authFields = context.appDefinition.authentication.fields || [];
      for (const field of authFields) {
        if (field.key) {
          context.authData[field.key] = `{{${field.key}}}`;
        }
      }
    }

    // Load from .env as well even in relay mode, in case the integration code
    // assumes there are values in bundle.authData. Loading from .env at least
    // gives the developer an option to override the values in bundle.authData.
    context.authData = { ...context.authData, ...loadAuthDataFromEnv() };

    if (context.actionType === 'auth') {
      switch (context.actionKey) {
        case 'start': {
          if (context.authId) {
            throw new Error(
              'The `--authentication-id` flag is not applicable. ' +
                'The `auth start` subcommand is to initialize local auth data in the .env file, ' +
                'whereas `--authentication-id` is for proxying requests using production auth data.',
            );
          }
          const newAuthData = await startAuth(this, context);
          if (_.isEmpty(newAuthData)) {
            return;
          }
          await appendEnv(newAuthData, AUTH_FIELD_ENV_PREFIX);
          console.warn(
            'Auth data appended to .env file. Run `zapier-platform invoke auth test` to test it.',
          );
          return;
        }
        case 'refresh': {
          if (context.authId) {
            throw new Error(
              'The `--authentication-id` flag is not applicable. ' +
                'The `auth refresh` subcommand can only refresh your local auth data in the .env file. ' +
                'You might want to run `auth test` instead, which tests and may refresh auth data with the specified authentication ID in production.',
            );
          }
          const newAuthData = await refreshAuth(context);
          if (_.isEmpty(newAuthData)) {
            return;
          }
          await appendEnv(newAuthData, AUTH_FIELD_ENV_PREFIX);
          console.warn(
            'Auth data has been refreshed and appended to .env file. Run `zapier-platform invoke auth test` to test it.',
          );
          return;
        }
        case 'test': {
          const output = await testAuth(context);
          console.log(JSON.stringify(output, null, 2));
          return;
        }
        case 'label': {
          const labelTemplate =
            context.appDefinition.authentication.connectionLabel;
          if (labelTemplate && labelTemplate.startsWith('$func$')) {
            console.warn(
              'Function-based connection label is not supported yet. Printing auth test result instead.',
            );
            const output = await testAuth(context);
            console.log(JSON.stringify(output, null, 2));
          } else {
            const output = await getAuthLabel(context);
            if (output) {
              console.log(output);
            } else {
              console.warn('Connection label is empty.');
            }
          }
          return;
        }
        default:
          throw new Error(
            `Unknown auth operation "${context.actionKey}". ` +
              'The options are "label", "refresh", "start", and "test". \n',
          );
      }
    } else {
      const action =
        context.appDefinition[context.actionTypePlural][context.actionKey];
      if (!action) {
        throw new Error(
          `No "${context.actionType}" found with key "${context.actionKey}".`,
        );
      }

      let { inputData } = this.flags;
      if (inputData) {
        if (inputData.startsWith('@')) {
          const filePath = inputData.substr(1);
          let inputStream;
          if (filePath === '-') {
            inputStream = process.stdin;
          } else {
            const fd = await fsP.open(filePath);
            inputStream = fd.createReadStream({ encoding: 'utf8' });
          }
          inputData = await readStream(inputStream);
        }
        context.inputData = JSON.parse(inputData);
      } else {
        context.inputData = {};
      }

      // inputData should only contain strings
      const nonStringPrimitives = findNonStringPrimitives(context.inputData);
      if (nonStringPrimitives.length) {
        throw new Error(
          'All primitive values in --inputData must be strings. Found non-string values in these paths:\n' +
            nonStringPrimitives
              .map(({ path, value }) => `* ${value} at ${path}`)
              .join('\n'),
        );
      }

      const output = await invokeAction(this, context);
      console.log(JSON.stringify(output, null, 2));
    }
  }
}

InvokeCommand.flags = buildFlags({
  commandFlags: {
    inputData: Flags.string({
      char: 'i',
      description:
        'The input data to pass to the action. Must be a JSON-encoded object. The data can be passed from the command directly like \'{"key": "value"}\', read from a file like @file.json, or read from stdin like @-.',
    }),
    isFillingDynamicDropdown: Flags.boolean({
      description:
        'Set bundle.meta.isFillingDynamicDropdown to true. Only makes sense for a polling trigger. When true in production, this poll is being used to populate a dynamic dropdown.',
      default: false,
    }),
    isLoadingSample: Flags.boolean({
      description:
        'Set bundle.meta.isLoadingSample to true. When true in production, this run is initiated by the user in the Zap editor trying to pull a sample.',
      default: false,
    }),
    isPopulatingDedupe: Flags.boolean({
      description:
        'Set bundle.meta.isPopulatingDedupe to true. Only makes sense for a polling trigger. When true in production, the results of this poll will be used initialize the deduplication list rather than trigger a Zap. This happens when a user enables a Zap.',
      default: false,
    }),
    limit: Flags.integer({
      description:
        'Set bundle.meta.limit. Only makes sense for a trigger. When used in production, this indicates the number of items you should fetch. -1 means no limit.',
      default: -1,
    }),
    page: Flags.integer({
      char: 'p',
      description:
        'Set bundle.meta.page. Only makes sense for a trigger. When used in production, this indicates which page of items you should fetch. First page is 0.',
      default: 0,
    }),
    'non-interactive': Flags.boolean({
      description: 'Do not show interactive prompts.',
      default: false,
    }),
    timezone: Flags.string({
      char: 'z',
      description:
        'Set the default timezone for datetime field interpretation. If not set, defaults to America/Chicago, which matches Zapier production behavior. Find the list timezone names at https://en.wikipedia.org/wiki/List_of_tz_database_time_zones.',
      default: 'America/Chicago',
    }),
    'redirect-uri': Flags.string({
      description:
        "Only used by `auth start` subcommand. The redirect URI that will be passed to the OAuth2 authorization URL. Usually this should match the one configured in your server's OAuth2 application settings. A local HTTP server will be started to listen for the OAuth2 callback. If your server requires a non-localhost or HTTPS address for the redirect URI, you can set up port forwarding to route the non-localhost or HTTPS address to localhost.",
      default: 'http://localhost:9000',
    }),
    'local-port': Flags.integer({
      description:
        'Only used by `auth start` subcommand. The local port that will be used to start the local HTTP server to listen for the OAuth2 callback. This port can be different from the one in the redirect URI if you have port forwarding set up.',
      default: 9000,
    }),
    remote: Flags.boolean({
      char: 'r',
      description:
        'Run your trigger/action remotely on Zapier production servers instead of locally. This requires deploying your integration first. Because this (remote) mode uses the same set of API endpoints as the Zap editor and other Zapier products, it allows you to verify exactly how your code will behave in production. Note that `--authentication-id` is required and implied in remote mode, as a production authentication is necessary to invoke in production.',
      default: false,
    }),
    version: Flags.string({
      char: 'v',
      description:
        'Only used when `--remote` is set. Specify a deployed version to invoke instead of the one currently set in your local package.json.',
    }),
    'authentication-id': Flags.string({
      char: 'a',
      description:
        'EXPERIMENTAL: Instead of using the local .env file, use the production authentication data with the given authentication ID (aka the "app connection" on Zapier). Find them at https://zapier.com/app/assets/connections (https://zpr.io/z8SjFTdnTFZ2 for instructions) or specify \'-\' to interactively select one from your available authentications. When specified, the code will still run locally, but all outgoing requests will be proxied through Zapier with the production auth data.',
    }),
    'paging-token': Flags.string({
      description:
        'Set bundle.meta.paging_token. Used for search pagination or bulk reads. When used in production, this indicates which page of items you should fetch.',
    }),
  },
});

InvokeCommand.args = {
  actionType: Args.string({
    description: 'The action type you want to invoke.',
    options: ACTION_TYPES,
  }),
  actionKey: Args.string({
    description:
      'The trigger/action key you want to invoke. If ACTIONTYPE is "auth", this can be "label", "refresh", "start", or "test".',
  }),
};

InvokeCommand.examples = [
  'zapier-platform invoke',
  'zapier-platform invoke auth start',
  'zapier-platform invoke auth refresh',
  'zapier-platform invoke auth test',
  'zapier-platform invoke auth label',
  'zapier-platform invoke trigger new_recipe',
  `zapier-platform invoke create add_recipe --inputData '{"title": "Pancakes"}'`,
  'zapier-platform invoke search find_recipe -i @file.json --non-interactive',
  'cat file.json | zapier-platform invoke trigger new_recipe -i @-',
  'zapier-platform invoke search find_ticket --authentication-id 12345',
  'zapier-platform invoke create add_ticket -a -',
  'zapier-platform invoke trigger new_recipe --remote',
  'zapier-platform invoke trigger new_recipe -r -a 12345',
  'zapier-platform invoke -r -v 2.0.0 -a -',
];
InvokeCommand.description = `Invoke an authentication method, a trigger, or a create/search action locally or remotely.

This command allows you to invoke your integration's authentication, triggers, and actions. With this tool, you can test and debug your integration code directly from your terminal without leaving your development environment and opening a browser.

Why use this command?

* Fast feedback loops: Verify your code changes instantly.
* Step-by-step debugging: Use a debugger to step through your code locally.
* Untruncated logs: View complete HTTP logs and errors in your terminal.

### Modes

The \`invoke\` command works in three modes:

1. Local mode (default): runs your code locally, and sends outgoing requests directly from your local machine.
2. Relay mode (experimental): runs your code locally, but proxies all outgoing requests through Zapier using production authentication data.
3. Remote mode: runs your code and sends outgoing requests entirely in/from Zapier production environment.

**Local mode** is the default mode. Without the \`--remote\` (or \`-r\`) flag or the \`--authentication-id\` (or \`-a\`) flag, the command runs in local mode. It's useful when you want to quickly test your integration code locally. You'll need to set up local auth data in the \`.env\` file using the \`zapier-platform invoke auth start\` command.

**Relay mode** is currently experimental. It's enabled when the \`-a\` flag is specified. It's useful when you want to test code locally but setting up local auth data is troublesome, such as when your OAuth2 server requires a non-localhost or HTTPS redirect URI. By specifying \`-a <authentication-id>\`, all outgoing requests will be proxied through Zapier's relay service using the production auth data with the given authentication ID. See the **Authentication** section below for more details.

Both local and relay mode **emulate** how your code would run in Zapier production environment, so the behavior might not be exactly the same. But we consider every inconsistency a bug or a limitation to be fixed. For 100% match with production behavior, use remote mode.

**Remote mode** is enabled when the \`--remote\` (or \`-r\`) flag is specified. It's useful when you want to verify how your code behaves in Zapier production environment. Note that remote mode requires deploying your integration first. If the \`-a\` flag is not specified, the command will prompt you to select one of your available authentications/connections in production. By default, the remote mode invokes the \`version\` set in your \`package.json\`. You can use the \`--version\` (or \`-v\`) flag to specify a different deployed version.

### Authentication

You can supply the authentcation data in two ways: Load from the local \`.env\` file or use the \`--authentication-id\` flag.

#### The local \`.env\` file

This command loads environment variables and \`authData\` from the \`.env\` file in the current directory. If you don't have a \`.env\` file yet, you can use the \`zapier-platform invoke auth start\` command to help you initialize it, or you can manually create it.

The \`zapier-platform invoke auth start\` subcommand will prompt you for the necessary auth fields and save them to the \`.env\` file. For OAuth2, it will start a local HTTP server, open the authorization URL in the browser, wait for the OAuth2 redirect, and get the access token.

Each line in the \`.env\` file should follow one of these formats:

* \`VAR_NAME=VALUE\` for environment variables
* \`authData_FIELD_KEY=VALUE\` for auth data fields

For example, a \`.env\` file for an OAuth2 integration might look like this:

\`\`\`
CLIENT_ID='your_client_id'
CLIENT_SECRET='your_client_secret'
authData_access_token='1234567890'
authData_refresh_token='abcdefg'
authData_account_name='zapier'
\`\`\`


#### The \`--authentication-id\` flag

Setting up local auth data can be troublesome. For instance, in OAuth2, you may have to configure your app server to allow localhost redirect URIs or use a port forwarding tool. This is sometimes not easy to get right.

The \`--authentication-id\` flag (\`-a\` for short) gives you an alternative (and perhaps easier) way to supply your auth data. You can use \`-a\` to specify an existing production authentication/connection. The available authentications can be found at https://zapier.com/app/assets/connections. Check https://zpr.io/z8SjFTdnTFZ2 for more instructions.

When \`-a -\` is specified, such as \`zapier-platform invoke auth test -a -\`, the command will interactively prompt you to select one of your available authentications.

If you know your authentication ID, you can specify it directly, such as \`zapier-platform invoke auth test -a 123456\`.

The \`-a\` flag also works in remote mode with the \`-r\` flag. In remote mode, if \`-a\` is not specified, such as \`zapier-platform invoke -r\`, the command will prompt you to select one of your available authentications.

#### Testing authentication

To test if the auth data is correct, run either one of these:

\`\`\`
zapier-platform invoke auth test   # invokes authentication.test method
zapier-platform invoke auth label  # invokes authentication.test and renders connection label
\`\`\`

To refresh stale auth data for OAuth2 or session auth, run \`zapier-platform invoke auth refresh\`. Note that refreshing is only applicable for local auth data in the \`.env\` file.

### Invoking a trigger or an action

Once you have the correct auth data, you can test an trigger, a search, or a create action. For example, here's how you invoke a trigger with the key \`new_recipe\`:

\`\`\`
zapier-platform invoke trigger new_recipe      # (local mode)
zapier-platform invoke trigger new_recipe -r   # (remote mode)
\`\`\`

To add input data, use the \`--inputData\` flag (\`-i\` for short). The input data can come from the command directly, a file, or stdin. See **EXAMPLES** below.

When you miss any command arguments, such as ACTIONTYPE or ACTIONKEY, the command will prompt you interactively. If you don't want to get interactive prompts, use the \`--non-interactive\` flag.

The \`--debug\` flag will show you the HTTP request logs and any console logs you have in your code.

### Limitations in local and relay mode

The following is a non-exhaustive list of current limitations in local and relay mode. We may support them in the future.

- Hook triggers, including REST hook subscribe/unsubscribe
- Line items
- Output hydration
- File upload
- Function-based connection label
- Buffered create actions
- Search-or-create actions
- Search-powered fields
- autoRefresh for OAuth2 and session auth
`;

module.exports = InvokeCommand;
