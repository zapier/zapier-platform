# Zapier CLI Command Reference

These are the generated docs for all Zapier platform CLI commands.

You can install the CLI with `npm install -g zapier-platform-cli`.

```bash
$ npm install -g zapier-platform-cli
```

# Commands

## analytics

> Show the status of the analytics that are collected. Also used to change what is collected.

**Usage**: `zapier analytics`

**Flags**
* `-m, --mode` | Choose how much information to share. Anonymous mode drops the OS type and Zapier user id, but keeps command info. Identifying information is used only for debugging purposes. One of `[enabled | anonymous | disabled]`.
* `-d, --debug` | Show extra debugging output.

**Examples**
* `zapier analytics --mode enabled`


## build

> Build a pushable zip from the current directory.

**Usage**: `zapier build`

This command does the following:

* Creates a temporary folder
* Copies all code into the temporary folder
* Adds an entry point: `zapierwrapper.js`
* Generates and validates app definition.
* Detects dependencies via esbuild (optional, on by default)
* Zips up all needed `.js` files. If you want to include more files, add a "includeInBuild" property (array with strings of regexp paths) to your `.zapierapprc`.
* Moves the zip to `build/build.zip` and `build/source.zip` and deletes the temp folder

This command is typically followed by `zapier upload`.

**Flags**
* `--disable-dependency-detection` | Disable "smart" file inclusion. By default, Zapier only includes files that are required by `index.js`. If you (or your dependencies) require files dynamically (such as with `require(someVar)`), then you may see "Cannot find module" errors. Disabling this may make your `build.zip` too large. If that's the case, try using the `includeInBuild` option in your `.zapierapprc`. See the docs about `includeInBuild` for more info.
* `-d, --debug` | Show extra debugging output.


## canary:create

> Create a new canary deployment, diverting a specified percentage of traffic from one version to another for a specified duration.

**Usage**: `zapier canary:create VERSIONFROM VERSIONTO`

Only one canary can be active at the same time. You can run `zapier canary:list` to check. If you would like to create a new canary with different parameters, you can wait for the canary to finish, or delete it using `zapier canary:delete a.b.c x.y.z`.

Note: this is similar to `zapier migrate` but different in that this is temporary and will "revert" the changes once the specified duration is expired.

**Only use this command to canary traffic between non-breaking versions!**

**Arguments**
* (required) `versionFrom` | Version to route traffic from
* (required) `versionTo` | Version to canary traffic to

**Flags**
* (required) `-p, --percent` | Percent of traffic to route to new version
* (required) `-d, --duration` | Duration of the canary in seconds
* `-d, --debug` | Show extra debugging output.

**Examples**
* `zapier canary:create 1.0.0 1.1.0 -p 25 -d 720`
* `zapier canary:create 2.0.0 2.1.0 --percent 50 --duration 300`


## canary:delete

> Delete an active canary deployment

**Usage**: `zapier canary:delete VERSIONFROM VERSIONTO`

**Arguments**
* (required) `versionFrom` | Version to route traffic from
* (required) `versionTo` | Version canary traffic is routed to

**Examples**
* `zapier canary:delete 1.0.0 1.1.0`


## canary:list

> List all active canary deployments

**Usage**: `zapier canary:list`

**Flags**
* `-d, --debug` | Show extra debugging output.
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as jq. One of `[plain | json | raw | row | table]`. Defaults to `table`.

**Examples**
* `zapier canary:list`


## convert

> Convert a Visual Builder integration to a CLI integration.

**Usage**: `zapier convert INTEGRATIONID PATH`

The resulting CLI integration will be identical to its Visual Builder version and ready to push and use immediately!

If you re-run this command on an existing directory it will leave existing files alone and not clobber them.

You'll need to do a `zapier push` before the new version is visible in the editor, but otherwise you're good to go.

**Arguments**
* (required) `integrationId` | To get the integration/app ID, go to "https://developer.zapier.com", click on an integration, and copy the number directly after "/app/" in the URL.
* (required) `path` | Relative to your current path - IE: `.` for current directory.

**Flags**
* (required) `-v, --version` | Convert a specific version. Required when converting a Visual Builder integration.
* `-d, --debug` | Show extra debugging output.


## delete:integration

> Delete your integration (including all versions).

**Usage**: `zapier delete:integration`

This only works if there are no active users or Zaps on any version. If you only want to delete certain versions, use the `zapier delete:version` command instead. It's unlikely that you'll be able to run this on an app that you've pushed publicly, since there are usually still users.

**Flags**
* `-d, --debug` | Show extra debugging output.

**Aliases**
* `delete:app`


## delete:version

> Delete a specific version of your integration.

**Usage**: `zapier delete:version VERSION`

This only works if there are no users or Zaps on that version. You will probably need to have run `zapier migrate` and `zapier deprecate` before this command will work.

**Arguments**
* (required) `version` | Specify the version to delete. It must have no users or Zaps.

**Flags**
* `-d, --debug` | Show extra debugging output.


## deprecate

> Mark a non-production version of your integration as deprecated, with removal by a certain date.

**Usage**: `zapier deprecate VERSION DATE`

Use this when an integration version will not be supported or start breaking at a known date.

Zapier will immediately send emails warning users of the deprecation if a date less than 30 days in the future is set, otherwise the emails will be sent exactly 30 days before the configured deprecation date.

There are other side effects: they'll start seeing it as "Deprecated" in the UI, and once the deprecation date arrives, if the Zaps weren't updated, they'll be paused and the users will be emailed again explaining what happened.

Do not use deprecation if you only have non-breaking changes, such as:
- Fixing help text
- Adding new triggers/actions
- Improving existing functionality
- other bug fixes that don't break existing automations.

**Arguments**
* (required) `version` | The version to deprecate.
* (required) `date` | The date (YYYY-MM-DD) when Zapier will make the specified version unavailable.

**Flags**
* `-f, --force` | Skip confirmation prompt. Use with caution.
* `-d, --debug` | Show extra debugging output.

**Examples**
* `zapier deprecate 1.2.3 2011-10-01`


## describe

> Describe the current integration.

**Usage**: `zapier describe`

This command prints a human readable enumeration of your integrations's
triggers, searches, and creates as seen by Zapier. Useful to understand how your
resources convert and relate to different actions.

* **Noun**: your action's noun
* **Label**: your action's label
* **Resource**: the resource (if any) this action is tied to
* **Available Methods**: testable methods for this action

**Flags**
* `-d, --debug` | Show extra debugging output.
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as jq. One of `[plain | json | raw | row | table]`. Defaults to `table`.


## env:get

> Get environment variables for a version.

**Usage**: `zapier env:get VERSION`

**Arguments**
* (required) `version` | The version to get the environment for.

**Flags**
* `-d, --debug` | Show extra debugging output.
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as jq. One of `[plain | json | raw | row | table]`. Defaults to `table`.

**Examples**
* `zapier env:get 1.2.3`


## env:set

> Set environment variables for a version.

**Usage**: `zapier env:set VERSION [KEY-VALUE PAIRS...]`

**Arguments**
* (required) `version` | The version to set the environment for. Values are copied forward when a new version is created, but this command will only ever affect the specified version.
* `key-value pairs...` | The key-value pairs to set. Keys are case-insensitive. Each pair should be space separated and pairs should be separated by an `=`. For example: `A=123 B=456`

**Flags**
* `-f, --force` | Force the update of environment variables regardless if the app version is production or not. Use with caution.
* `-d, --debug` | Show extra debugging output.

**Examples**
* `zapier env:set 1.2.3 SECRET=12345 OTHER=4321`


## env:unset

> Unset environment variables for a version.

**Usage**: `zapier env:unset VERSION [KEYS...]`

**Arguments**
* (required) `version` | The version to set the environment for.
* `keys...` | The keys to unset. Keys are case-insensitive.

**Flags**
* `-f, --force` | Force the update of environment variables regardless if the app version is production or not. Use with caution.
* `-d, --debug` | Show extra debugging output.

**Examples**
* `zapier env:unset 1.2.3 SECRET OTHER`


## history

> Get the history of your integration.

**Usage**: `zapier history`

History includes all the changes made over the lifetime of your integration. This includes everything from creation, updates, migrations, admins, and invitee changes, as well as who made the change and when.

**Flags**
* `-d, --debug` | Show extra debugging output.
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as jq. One of `[plain | json | raw | row | table]`. Defaults to `table`.


## init

> Initialize a new Zapier integration with a project template.

**Usage**: `zapier init PATH`

After running this, you'll have a new integration in the specified directory. If you re-run this command on an existing directory, it will prompt before overwriting any existing files.

This doesn't register or deploy the integration with Zapier - try the `zapier register` and `zapier push` commands for that!

**Arguments**
* (required) `path` | Where to create the new integration. If the directory doesn't exist, it will be created. If the directory isn't empty, we'll ask for confirmation

**Flags**
* `-t, --template` | The template to start your integration with. One of `[basic-auth | callback | custom-auth | digest-auth | dynamic-dropdown | files | minimal | oauth1-trello | oauth2 | openai | search-or-create | session-auth | typescript]`.
* `-m, --module` | Choose module type: CommonJS or ES Modules. Only enabled for Typescript and Minimal templates. One of `[commonjs | esm]`.
* `-d, --debug` | Show extra debugging output.

**Examples**
* `zapier init myapp`
* `zapier init ./path/myapp --template oauth2`
* `zapier init ./path/myapp --template minimal --module esm`


## integrations

> List integrations you have admin access to.

**Usage**: `zapier integrations`

This command also checks the current directory for a linked integration.

**Flags**
* `-d, --debug` | Show extra debugging output.
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as jq. One of `[plain | json | raw | row | table]`. Defaults to `table`.

**Aliases**
* `apps`


## invoke

> Invoke an auth operation, a trigger, or a create/search action locally.

**Usage**: `zapier invoke [ACTIONTYPE] [ACTIONKEY]`

This command emulates how Zapier production environment would invoke your integration. It runs code locally, so you can use this command to quickly test your integration without deploying it to Zapier. This is especially useful for debugging and development.

Why use this command?

* Fast feedback loop: Write code and run this command to verify if it works immediately
* Step-by-step debugging: Running locally means you can use a debugger to step through your code
* Untruncated logs: View complete logs and errors in your terminal

### Authentication

You can supply the authentcation data in two ways: Load from the local `.env` file or use the (experimental) `--authentication-id` flag.

#### The local `.env` file

This command loads environment variables and `authData` from the `.env` file in the current directory. If you don't have a `.env` file yet, you can use the `zapier invoke auth start` command to help you initialize it, or you can manually create it.

The `zapier invoke auth start` subcommand will prompt you for the necessary auth fields and save them to the `.env` file. For OAuth2, it will start a local HTTP server, open the authorization URL in the browser, wait for the OAuth2 redirect, and get the access token.

Each line in the `.env` file should follow one of these formats:

* `VAR_NAME=VALUE` for environment variables
* `authData_FIELD_KEY=VALUE` for auth data fields

For example, a `.env` file for an OAuth2 integration might look like this:

```
CLIENT_ID='your_client_id'
CLIENT_SECRET='your_client_secret'
authData_access_token='1234567890'
authData_refresh_token='abcdefg'
authData_account_name='zapier'
```


#### The `--authentication-id` flag (EXPERIMENTAL)

Setting up local auth data can be troublesome. You'd have to configure your app server to allow localhost redirect URIs or use a port forwarding tool. This is sometimes not easy to get right.

The `--authentication-id` flag (`-a` for short) gives you an alternative (and perhaps easier) way to supply your auth data. You can use `-a` to specify an existing production authentication/connection. The available authentications can be found at https://zapier.com/app/assets/connections. Check https://zpr.io/z8SjFTdnTFZ2 for more instructions.

When `-a -` is specified, such as `zapier invoke auth test -a -`, the command will interactively prompt you to select one of your available authentications.

If you know your authentication ID, you can specify it directly, such as `zapier invoke auth test -a 123456`.

#### Testing authentication

To test if the auth data is correct, run either one of these:

```
zapier invoke auth test   # invokes authentication.test method
zapier invoke auth label  # invokes authentication.test and renders connection label
```

To refresh stale auth data for OAuth2 or session auth, run `zapier invoke auth refresh`. Note that refreshing is only applicable for local auth data in the `.env` file.

### Invoking a trigger or an action

Once you have the correct auth data, you can test an trigger, a search, or a create action. For example, here's how you invoke a trigger with the key `new_recipe`:

```
zapier invoke trigger new_recipe
```

To add input data, use the `--inputData` flag (`-i` for short). The input data can come from the command directly, a file, or stdin. See **EXAMPLES** below.

When you miss any command arguments, such as ACTIONTYPE or ACTIONKEY, the command will prompt you interactively. If you don't want to get interactive prompts, use the `--non-interactive` flag.

The `--debug` flag will show you the HTTP request logs and any console logs you have in your code.

### Limitations

The following is a non-exhaustive list of current limitations and may be supported in the future:

- Hook triggers, including REST hook subscribe/unsubscribe
- Line items
- Output hydration
- File upload
- Dynamic dropdown pagination
- Function-based connection label
- Buffered create actions
- Search-or-create actions
- Search-powered fields
- Field choices
- autoRefresh for OAuth2 and session auth


**Arguments**
* `actionType` | The action type you want to invoke.
* `actionKey` | The trigger/action key you want to invoke. If ACTIONTYPE is "auth", this can be "label", "refresh", "start", or "test".

**Flags**
* `-i, --inputData` | The input data to pass to the action. Must be a JSON-encoded object. The data can be passed from the command directly like '{"key": "value"}', read from a file like @file.json, or read from stdin like @-.
* `--isFillingDynamicDropdown` | Set bundle.meta.isFillingDynamicDropdown to true. Only makes sense for a polling trigger. When true in production, this poll is being used to populate a dynamic dropdown.
* `--isLoadingSample` | Set bundle.meta.isLoadingSample to true. When true in production, this run is initiated by the user in the Zap editor trying to pull a sample.
* `--isPopulatingDedupe` | Set bundle.meta.isPopulatingDedupe to true. Only makes sense for a polling trigger. When true in production, the results of this poll will be used initialize the deduplication list rather than trigger a Zap. This happens when a user enables a Zap.
* `--limit` | Set bundle.meta.limit. Only makes sense for a trigger. When used in production, this indicates the number of items you should fetch. -1 means no limit.  Defaults to `-1`.
* `-p, --page` | Set bundle.meta.page. Only makes sense for a trigger. When used in production, this indicates which page of items you should fetch. First page is 0.
* `--non-interactive` | Do not show interactive prompts.
* `-z, --timezone` | Set the default timezone for datetime field interpretation. If not set, defaults to America/Chicago, which matches Zapier production behavior. Find the list timezone names at https://en.wikipedia.org/wiki/List_of_tz_database_time_zones.  Defaults to `America/Chicago`.
* `--redirect-uri` | Only used by `auth start` subcommand. The redirect URI that will be passed to the OAuth2 authorization URL. Usually this should match the one configured in your server's OAuth2 application settings. A local HTTP server will be started to listen for the OAuth2 callback. If your server requires a non-localhost or HTTPS address for the redirect URI, you can set up port forwarding to route the non-localhost or HTTPS address to localhost.  Defaults to `http://localhost:9000`.
* `--local-port` | Only used by `auth start` subcommand. The local port that will be used to start the local HTTP server to listen for the OAuth2 callback. This port can be different from the one in the redirect URI if you have port forwarding set up.  Defaults to `9000`.
* `-a, --authentication-id` | EXPERIMENTAL: Instead of using the local .env file, use the production authentication data with the given authentication ID (aka the "app connection" on Zapier). Find them at https://zapier.com/app/assets/connections (https://zpr.io/z8SjFTdnTFZ2 for instructions) or specify '-' to interactively select one from your available authentications. When specified, the code will still run locally, but all outgoing requests will be proxied through Zapier with the production auth data.
* `-d, --debug` | Show extra debugging output.

**Examples**
* `zapier invoke`
* `zapier invoke auth start`
* `zapier invoke auth refresh`
* `zapier invoke auth test`
* `zapier invoke auth label`
* `zapier invoke trigger new_recipe`
* `zapier invoke create add_recipe --inputData '{"title": "Pancakes"}'`
* `zapier invoke search find_recipe -i @file.json --non-interactive`
* `cat file.json | zapier invoke trigger new_recipe -i @-`
* `zapier invoke search find_ticket --authentication-id 12345`
* `zapier invoke create add_ticket -a -`


## jobs

> Lists ongoing migration or promotion jobs for the current integration.

**Usage**: `zapier jobs`

A job represents a background process that will be queued up when users execute a "migrate" or "promote" command for the current integration.

Each job will be added to the end of a queue of "promote" and "migration" jobs where the "Job Stage" will then be initialized with "requested".

Job stages will then move to "estimating", "in_progress" and finally one of four "end" stages: "complete", "aborted", "errored" or "paused".

Job times will vary as it depends on the size of the queue and how many users your integration has.

Jobs are returned from oldest to newest.


**Flags**
* `-d, --debug` | Show extra debugging output.
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as jq. One of `[plain | json | raw | row | table]`. Defaults to `table`.

**Examples**
* `zapier jobs`


## legacy

> Mark a non-production version of your integration as legacy.

**Usage**: `zapier legacy VERSION`

Use this when an integration version is no longer recommended for new users, but you don't want to block existing users from using it.

Reasons why you might want to mark a version as legacy:
- this version may be discontinued in the future
- this version has bugs
- a newer version has been released and you want to encourage users to upgrade

**Arguments**
* (required) `version` | The version to mark as legacy.

**Flags**
* `-f, --force` | Skip confirmation prompt. Use with caution.
* `-d, --debug` | Show extra debugging output.

**Examples**
* `zapier legacy 1.2.3`


## link

> Link the current directory with an existing integration.

**Usage**: `zapier link`

This command generates a `.zapierapprc` file in the directory in which it's ran. This file ties this code to an integration and is referenced frequently during `push` and `validate` operations. This file should be checked into source control.

If you're starting an integration from scratch, use `zapier init` instead.

**Flags**
* `-d, --debug` | Show extra debugging output.


## login

> Configure your `~/.zapierrc` with a deploy key.

**Usage**: `zapier login`

**Flags**
* `-s, --sso` | Use this flag if you log into Zapier a Single Sign-On (SSO) button and don't have a Zapier password.
* `-d, --debug` | Show extra debugging output.


## logout

> Deactivate your active deploy key and reset `~/.zapierrc`.

**Usage**: `zapier logout`

**Flags**
* `-d, --debug` | Show extra debugging output.


## logs

> Print recent logs.

**Usage**: `zapier logs`

Logs are created when your integration is run as part of a Zap. They come from explicit calls to `z.console.log()`, usage of `z.request()`, and any runtime errors.

This won't show logs from running locally with `zapier test`, since those never hit our server.

**Flags**
* `-v, --version` | Filter logs to the specified version.
* `-s, --status` | Filter logs to only see errors or successes One of `[any | success | error]`. Defaults to `any`.
* `-t, --type` | See logs of the specified type One of `[console | bundle | http]`. Defaults to `console`.
* `--detailed` | See extra info, like request/response body and headers.
* `-u, --user` | Only show logs for this user. Defaults to your account.  Defaults to `me`.
* `--limit` | Cap the number of logs returned. Max is 50 (also the default)  Defaults to `50`.
* `-d, --debug` | Show extra debugging output.
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as jq. One of `[plain | json | raw | row | table]`. Defaults to `table`.


## migrate

> Migrate a percentage of users or a single user from one version of your integration to another.

**Usage**: `zapier migrate FROMVERSION TOVERSION [PERCENT]`

Start a migration to move users between different versions of your integration. You may also "revert" by simply swapping the from/to verion strings in the command line arguments (i.e. `zapier migrate 1.0.1 1.0.0`).

**Only use this command to migrate users between non-breaking versions, use `zapier deprecate` if you have breaking changes!**

Migration time varies based on the number of affected Zaps. Be patient and check `zapier jobs` to track the status. Or use `zapier history` if you want to see older jobs.

Since a migration is only for non-breaking changes, users are not emailed about the update/migration. It will be a transparent process for them.

We recommend migrating a small subset of users first, via the percent argument, then watching error logs of the new version for any sort of odd behavior. When you feel confident there are no bugs, go ahead and migrate everyone. If you see unexpected errors, you can revert.

You can migrate a specific user's Zaps by using `--user` (i.e. `zapier migrate 1.0.0 1.0.1 --user=user@example.com`). This will migrate Zaps that are private for that user. Zaps that are

  - [shared across the team](https://help.zapier.com/hc/en-us/articles/8496277647629),
  - [shared app connections](https://help.zapier.com/hc/en-us/articles/8496326497037-Share-app-connections-with-your-team), or
  - in a [team/company account](https://help.zapier.com/hc/en-us/articles/22330977078157-Collaborate-with-members-of-your-Team-or-Company-account)

will **not** be migrated.

Alternatively, you can pass the `--account` flag, (i.e. `zapier migrate 1.0.0 1.0.1 --account=account@example.com`). This will migrate all Zaps owned by the user, Private & Shared, within all accounts for which the specified user is a member.

**The `--account` flag should be used cautiously as it can break shared Zaps for other users in Team or Enterprise accounts.**

You cannot pass both `PERCENT` and `--user` or `--account`.

You cannot pass both `--user` and `--account`.

**Arguments**
* (required) `fromVersion` | The version FROM which to migrate users.
* (required) `toVersion` | The version TO which to migrate users.
* `percent` | Percentage (between 1 and 100) of users to migrate.

**Flags**
* `--user` | Migrates all of a users' Private Zaps within all accounts for which the specified user is a member
* `--account` | Migrates all of a users' Zaps, Private & Shared, within all accounts for which the specified user is a member
* `-y, --yes` | Automatically answer "yes" to any prompts. Useful if you want to avoid interactive prompts to run this command in CI.
* `-d, --debug` | Show extra debugging output.

**Examples**
* `zapier migrate 1.0.0 1.0.1`
* `zapier migrate 1.0.1 2.0.0 10`
* `zapier migrate 2.0.0 2.0.1 --user=user@example.com`
* `zapier migrate 2.0.0 2.0.1 --account=account@example.com`


## promote

> Promote a specific version to public access.

**Usage**: `zapier promote VERSION`

Promote an integration version into production (non-private) rotation, which means new users can use this integration version.

* This **does** mark the version as the official public version - all other versions & users are grandfathered.
* This does **NOT** build/upload or deploy a version to Zapier - you should `zapier push` first.
* This does **NOT** move old users over to this version - `zapier migrate 1.0.0 1.0.1` does that.
* This does **NOT** recommend old users stop using this version - `zapier deprecate 1.0.0 2017-01-01` does that.

Promotes are an inherently safe operation for all existing users of your integration.

After a promotion, go to your developer platform to [close issues that were resolved](https://platform.zapier.com/manage/user-feedback#3-close-resolved-issues) in the updated version.

If your integration is private and passes our integration checks, this will give you a URL to a form where you can fill in additional information for your integration to go public. After reviewing, the Zapier team will approve to make it public if there are no issues or decline with feedback.

Check `zapier jobs` to track the status of the promotion. Or use `zapier history` if you want to see older jobs.

**Arguments**
* (required) `version` | The version you want to promote.

**Flags**
* `-y, --yes` | Automatically answer "yes" to any prompts. Useful if you want to avoid interactive prompts to run this command in CI.
* `-d, --debug` | Show extra debugging output.

**Examples**
* `zapier promote 1.0.0`


## pull

> Retrieve and update your local integration files with the latest version.

**Usage**: `zapier pull`

This command updates your local integration files with the latest version. You will be prompted with a confirmation dialog before continuing if there any destructive file changes.

Zapier may release new versions of your integration with bug fixes or new features. In the event this occurs, you will be unable to do the following until your local files are updated by running `zapier pull`:

* push to the promoted version
* promote a new version
* migrate users from one version to another

**Flags**
* `-d, --debug` | Show extra debugging output.


## push

> Build and upload the current integration.

**Usage**: `zapier push`

This command is the same as running `zapier build` and `zapier upload` in sequence. See those for more info.

**Flags**
* `--disable-dependency-detection` | Disable "smart" file inclusion. By default, Zapier only includes files that are required by `index.js`. If you (or your dependencies) require files dynamically (such as with `require(someVar)`), then you may see "Cannot find module" errors. Disabling this may make your `build.zip` too large. If that's the case, try using the `includeInBuild` option in your `.zapierapprc`. See the docs about `includeInBuild` for more info.
* `-d, --debug` | Show extra debugging output.


## register

> Register a new integration in your account, or update the existing one if a `.zapierapprc` file is found.

**Usage**: `zapier register [TITLE]`

This command creates a new integration and links it in the `./.zapierapprc` file. If `.zapierapprc` already exists, it will ask you if you want to update the currently-linked integration, as opposed to creating a new one.

After registering a new integration, you can run `zapier push` to build and upload your integration for use in the Zapier editor. This will change `.zapierapprc`, which identifies this directory as holding code for a specific integration.

**Arguments**
* `title` | Your integration's public title. Asked interactively if not present.

**Flags**
* `-D, --desc` | A sentence describing your app in 140 characters or less, e.g. "Trello is a team collaboration tool to organize tasks and keep projects on track."
* `-u, --url` | The homepage URL of your app, e.g., https://example.com.
* `-a, --audience` | Are you building a public or private integration?
* `-r, --role` | What is your relationship with the app you're integrating with Zapier?
* `-c, --category` | How would you categorize your app? Choose the most appropriate option for your app's core features.
* `-s, --subscribe` | Get tips and recommendations about this integration along with our monthly newsletter that details the performance of your integration and the latest Zapier news.
* `-y, --yes` | Assume yes for all yes/no prompts. This flag will also update an existing integration (as opposed to registering a new one) if a .zapierapprc file is found.
* `-d, --debug` | Show extra debugging output.

**Examples**
* `zapier register`
* `zapier register "My Cool Integration"`
* `zapier register "My Cool Integration" --desc "My Cool Integration helps you integrate your apps with the apps that you need." --no-subscribe`
* `zapier register "My Cool Integration" --url "https://www.zapier.com" --audience private --role employee --category marketing-automation`
* `zapier register --subscribe`


## scaffold

> Add a starting trigger, create, search, or resource to your integration.

**Usage**: `zapier scaffold ACTIONTYPE NOUN`

The first argument should be one of `trigger|search|create|resource` followed by the noun that this will act on (something like "contact" or "deal").

The scaffold command does two general things:

* Creates a new file (such as `triggers/contact.js`)
* Imports and registers it inside your `index.js`

You can mix and match several options to customize the created scaffold for your project.

**Arguments**
* (required) `actionType` | undefined
* (required) `noun` | undefined

**Flags**
* `-d, --dest` | Specify the new file's directory. Use this flag when you want to create a different folder structure such as `src/triggers` instead of the default `triggers`. Defaults to `[triggers|searches|creates]/{noun}`.
* `--test-dest` | Specify the new test file's directory. Use this flag when you want to create a different folder structure such as `src/triggers` instead of the default `triggers`. Defaults to `test/[triggers|searches|creates]/{noun}`.
* `-e, --entry` | Supply the path to your integration's entry point (`index.js` or `src/index.ts`). This will try to automatically detect the correct file if not provided.
* `-f, --force` | Should we overwrite an existing trigger/search/create file?
* `--no-help` | When scaffolding, should we skip adding helpful intro comments? Useful if this isn't your first rodeo.
* `-d, --debug` | Show extra debugging output.

**Examples**
* `zapier scaffold trigger contact`
* `zapier scaffold search contact --dest=my_src/searches`
* `zapier scaffold create contact --entry=src/index.js`
* `zapier scaffold resource contact --force`


## team:add

> Add a team member to your integration.

**Usage**: `zapier team:add EMAIL ROLE [MESSAGE]`

These users come in three levels:

  * `admin`, who can edit everything about the integration
  * `collaborator`, who has read-only access for the app, and will receive periodic email updates. These updates include quarterly health scores and more.
  * `subscriber`, who can't directly access the app, but will receive periodic email updates. These updates include quarterly health scores and more.

Team members can be freely added and removed.

**Arguments**
* (required) `email` | The user to be invited. If they don't have a Zapier account, they'll be prompted to create one.
* (required) `role` | The level the invited team member should be at. Admins can edit everything and get email updates. Collaborators have read-access to the app and get email updates. Subscribers only get email updates.
* `message` | A message sent in the email to your team member, if you need to provide context. Wrap the message in quotes to ensure spaces get saved.

**Flags**
* `-d, --debug` | Show extra debugging output.

**Examples**
* `zapier team:add bruce@wayne.com admin`
* `zapier team:add robin@wayne.com collaborator "Hey Robin, check out this app."`
* `zapier team:add alfred@wayne.com subscriber "Hey Alfred, check out this app."`

**Aliases**
* `team:invite`


## team:get

> Get team members involved with your integration.

**Usage**: `zapier team:get`

These users come in three levels:

  * `admin`, who can edit everything about the integration
  * `collaborator`, who has read-only access for the app, and will receive periodic email updates. These updates include quarterly health scores and more.
  * `subscriber`, who can't directly access the app, but will receive periodic email updates. These updates include quarterly health scores and more.

Use the `zapier team:add` and `zapier team:remove` commands to modify your team.


**Flags**
* `-d, --debug` | Show extra debugging output.
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as jq. One of `[plain | json | raw | row | table]`. Defaults to `table`.

**Aliases**
* `team:list`


## team:remove

> Remove a team member from all versions of your integration.

**Usage**: `zapier team:remove`

Admins will immediately lose write access to the integration.
Collaborators will immediately lose read access to the integration.
Subscribers won't receive future email updates.

**Flags**
* `-d, --debug` | Show extra debugging output.

**Aliases**
* `team:delete`


## test

> Test your integration via the "test" script in your "package.json".

**Usage**: `zapier test`

This command is a wrapper around `npm test` that also validates the structure of your integration and sets up extra environment variables.

You can pass any args/flags after a `--`; they will get forwarded onto your test script.

**Flags**
* `--skip-validate` | Forgo running `zapier validate` before tests are run. This will speed up tests if you're modifying functionality of an existing integration rather than adding new actions.
* `--yarn` | Use `yarn` instead of `npm`. This happens automatically if there's a `yarn.lock` file, but you can manually force `yarn` if you run tests from a sub-directory.
* `--pnpm` | Use `pnpm` instead of `npm`. This happens automatically if there's a `pnpm-lock.yaml` file, but you can manually force `pnpm` if you run tests from a sub-directory.
* `-d, --debug` | Show extra debugging output.

**Examples**
* `zapier test`
* `zapier test --skip-validate -- -t 30000 --grep api`
* `zapier test -- -fo --testNamePattern "auth pass"`


## upload

> Upload the latest build of your integration to Zapier.

**Usage**: `zapier upload`

This command sends both build/build.zip and build/source.zip to Zapier for use.

Typically we recommend using `zapier push`, which does a build and upload, rather than `upload` by itself.


**Flags**
* `-d, --debug` | Show extra debugging output.


## users:add

> Add a user to some or all versions of your integration.

**Usage**: `zapier users:add EMAIL [VERSION]`

When this command is run, we'll send an email to the user inviting them to try your integration. You can track the status of that invite using the `zapier users:get` command.

Invited users will be able to see your integration's name, logo, and description. They'll also be able to create Zaps using any available triggers and actions.

**Arguments**
* (required) `email` | The user to be invited. If they don't have a Zapier account, they'll be prompted to create one.
* `version` | A version string (like 1.2.3). Optional, used only if you want to invite a user to a specific version instead of all versions.

**Flags**
* `-f, --force` | Skip confirmation. Useful for running programatically.
* `-d, --debug` | Show extra debugging output.

**Examples**
* `zapier users:add bruce@wayne.com`
* `zapier users:add alfred@wayne.com 1.2.3`

**Aliases**
* `users:invite`


## users:get

> Get a list of users who have been invited to your integration.

**Usage**: `zapier users:get`

Note that this list of users is NOT a comprehensive list of everyone who is using your integration. It only includes users who were invited directly by email (using the `zapier users:add` command or the web UI). Users who joined by clicking links generated using the `zapier user:links` command won't show up here.

**Flags**
* `-d, --debug` | Show extra debugging output.
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as jq. One of `[plain | json | raw | row | table]`. Defaults to `table`.

**Aliases**
* `users:list`


## users:links

> Get a list of links that are used to invite users to your integration.

**Usage**: `zapier users:links`

**Flags**
* `-d, --debug` | Show extra debugging output.
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as jq. One of `[plain | json | raw | row | table]`. Defaults to `table`.


## users:remove

> Remove a user from all versions of your integration.

**Usage**: `zapier users:remove EMAIL`

When this command is run, their Zaps will immediately turn off. They won't be able to use your app again until they're re-invited or it has gone public. In practice, this command isn't run often as it's very disruptive to users.

**Arguments**
* (required) `email` | The user to be removed.

**Flags**
* `-f, --force` | Skips confirmation. Useful for running programatically.
* `-d, --debug` | Show extra debugging output.

**Aliases**
* `users:delete`


## validate

> Validate your integration.

**Usage**: `zapier validate`

Run the standard validation routine powered by json-schema that checks your integration for any structural errors. This is the same routine that runs during `zapier build`, `zapier upload`, `zapier push` or even as a test in `zapier test`.

**Flags**
* `--without-style` | Forgo pinging the Zapier server to run further checks.
* `-d, --debug` | Show extra debugging output.
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as jq. One of `[plain | json | raw | row | table]`. Defaults to `table`.

**Examples**
* `zapier validate`
* `zapier validate --without-style`
* `zapier validate --format json`


## versions

> List the versions of your integration available for use in Zapier automations.

**Usage**: `zapier versions`

**Flags**
* `-d, --debug` | Show extra debugging output.
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as jq. One of `[plain | json | raw | row | table]`. Defaults to `table`.
