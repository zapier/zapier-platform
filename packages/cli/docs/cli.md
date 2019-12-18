# Zapier CLI Reference

These are the generated docs for all Zapier platform CLI commands.

You can install the CLI with `npm install -g zapier-platform-cli`.

```bash
$ npm install -g zapier-platform-cli
```

# Commands

## analytics

> Shows the status of the analytics that are collected. Also used to change what is collected.

**Usage**: `zapier analytics`

**Flags**
* `-m, --mode` | Choose how much information to share. Anonymous mode drops the OS type and Zapier user id, but keeps command info. Identifying information is used only for debugging purposes. One of `[enabled | anonymous | disabled]`.
* `-d, --debug` | Show extra debugging output

**Examples**
* `zapier analytics --mode enabled`


## build

> Builds a pushable zip from the current directory.

**Usage**: `zapier build`

This command does the following:

* Creates a temporary folder

* Copies all code into the temporary folder

* Adds an entry point: `zapierwrapper.js`

* Generates and validates app definition.

* Detects dependencies via browserify (optional, on by default)

* Zips up all needed `.js` files. If you want to include more files, add a "includeInBuild" property (array with strings of regexp paths) to your `.zapierapprc`.

* Moves the zip to `build/build.zip` and `build/source.zip` and deletes the temp folder

This command is typically followed by `zapier upload`.

**Flags**
* `--disable-dependency-detection` | Disables "smart" file inclusion. By default, Zapier only includes files that are required by `index.js`. If you (or your dependencies) require files dynamically (such as with `require(someVar)`), then you may see "Cannot find module" errors. Disabling this may make your `build.zip` too large. If that's the case, try using the `includeInBuild` option in your `.zapierapprc`. [See the docs](includeInBuild) for more info.
* `-d, --debug` | Show extra debugging output


## convert

  > Converts a Legacy Web Builder or Visual Builder app to a CLI app.

  **Usage:** `zapier convert appid path`

  
Creates a new CLI app from an existing app.

If you're converting a **Legacy Web Builder** app: the new app contains code stubs only. It is supposed to get you started - it isn't going to create a complete app!

After running this, you'll have a new app in your directory, with stubs for your trigger and actions.  If you re-run this command on an existing directory it will leave existing files alone and not clobber them.

Once you've run the command, make sure to run `zapier push` to see it in the editor.

If you're converting a **Visual Builder** app, then it will be identical and ready to push and use immediately! You'll need to do a `zapier push` before the new version is visible in the editor, but otherwise you're good to go.

**Arguments**

* `appid [value]` -- **required**, Get the appid from "https://zapier.com/app/developer", clicking on an integration, and taking the number after "/app" in the url.
* `location [value]` -- **required**, Relative to your current path - IE: `.` for current directory
* `--version=1.0.0` -- _optional_, Convert a specific version. Required when converting a Visual Builder app

```bash
$ zapier convert 1234 .
# Let's convert your app!
#
#   Downloading app from Zapier - done!
#   Writing triggers/trigger.js - done!
#   Writing package.json - done!
#   Writing index.js - done!
#   Copy ./index.js - done!
#   Copy ./package.json - done!
#   Copy ./triggers/trigger.js - done!
#
# Finished! You might need to `npm install` then try `zapier test`!
```


## delete:integration

> Deletes your integration (including all versions).

**Usage**: `zapier delete:integration`

This only works if there are no active users or Zaps on any version. If you only want to delete certain versions, use the `zapier delete:version` command instead. It's unlikely that you'll be able to run this on an app that you've pushed publicly, since there are usually still users.

**Flags**
* `-d, --debug` | Show extra debugging output

**Aliases**
* `delete:app`


## delete:version

> Deletes a specific version of your integration.

**Usage**: `zapier delete:version VERSION`

This only works if there are no users or Zaps on that version. You will probably need to have run `zapier migrate` and `zapier deprecate` before this comand will work.

**Arguments**
* (required) `version` | Specify the version to delete. It must have no users or Zaps.

**Flags**
* `-d, --debug` | Show extra debugging output


## deprecate

> Marks a non-production version of your integration as deprecated, with removal by a certain date.

**Usage**: `zapier deprecate VERSION DATE`

Use this when an integration version will not be supported or start breaking at a known date.

Zapier will send an email warning users of the deprecation once a date is set, they'll start seeing it as "Deprecated" in the UI, and once the deprecation date arrives, if the Zaps weren't updated, they'll be paused and the users will be emailed again explaining what happened.

After the deprecation date has passed it will be safe to delete that integration version.

> Do not use this if you have non-breaking changes, such as fixing help text.

**Arguments**
* (required) `version` | The version to deprecate.
* (required) `date` | The date (YYYY-MM-DD) when Zapier will make the specified version unavailable.

**Flags**
* `-d, --debug` | Show extra debugging output

**Examples**
* `zapier deprecate 1.2.3 2011-10-01`


## describe

> Describes the current integraiton.

**Usage**: `zapier describe`

Prints a human readable enumeration of your integrations's triggers, searches, and creates as seen by Zapier. Useful to understand how your resources convert and relate to different actions.

* `Noun` -- your action's noun

* `Label` -- your action's label

* `Resource` -- the resource (if any) this action is tied to

* `Available Methods` -- testable methods for this action

**Flags**
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as `jq`. One of `[plain | json | raw | row | table]`. Defaults to `table`.
* `-d, --debug` | Show extra debugging output


## env:get

> Gets Environment variables for a version.

**Usage**: `zapier env:get VERSION`

**Arguments**
* (required) `version` | The version to get the environment for.

**Flags**
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as `jq`. One of `[plain | json | raw | row | table]`. Defaults to `table`.
* `-d, --debug` | Show extra debugging output

**Examples**
* `zapier env:get 1.2.3`


## env:set

> Sets environment variable(s) for a version.

**Usage**: `zapier env:set VERSION [KEY-VALUE PAIRS...]`

**Arguments**
* (required) `version` | The version to set the environment for. Values are copied forward when a new version is created, but this command will only ever affect the specified version.
* `key-value pairs...` | The key-value pairs to set. Keys are case-insensitive. Each pair should be space separated and pairs should be separated by an `=`. For example: `A=123 B=456`

**Flags**
* `-d, --debug` | Show extra debugging output

**Examples**
* `zapier env:set 1.2.3 SECRET=12345 OTHER=4321`


## env:unset

> Unsets environment variable(s) for a version.

**Usage**: `zapier env:unset VERSION [KEYS...]`

**Arguments**
* (required) `version` | The version to set the environment for.
* `keys...` | The keys to unset. Keys are case-insensitive.

**Flags**
* `-d, --debug` | Show extra debugging output

**Examples**
* `zapier env:unset 1.2.3 SECRET OTHER`


## help

  > Lists all the commands you can use.

  **Usage:** `zapier help [command]`

  
Prints documentation to the terminal screen.

Generally - the `zapier` command works off of two files:

 * ~/.zapierrc      (home directory identifies the deploy key & user)
 * ./.zapierapprc   (current directory identifies the app)

The `zapier login` and `zapier register "Example"` or `zapier link` commands will help manage those files. All commands listed below.

**Arguments**

* _none_ -- print all commands
* `cmd [value]` -- _optional_, the command to view docs for
* `--format={plain,json,raw,row,table}` -- _optional_, display format. Default is `table`
* `--help` -- _optional_, prints this help text
* `--debug` -- _optional_, print debug API calls and tracebacks

```bash
$ zapier help apps
$ zapier help scaffold
$ zapier help
# Usage: zapier COMMAND [command-specific-arguments] [--command-specific-options]
#
# ┌─────────────┬───────────────────────────────────────┬────────────────────────────────────────────────────────────────────────────┐
# │ Command     │ Example                               │ Help                                                                       │
# ├─────────────┼───────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
# │ apps        │ zapier apps                           │ Lists all the apps you can access.                                         │
# │ build       │ zapier build                          │ Builds a uploadable zip from the current directory.                        │
# │ collaborate │ zapier collaborate [user@example.com] │ Manage the admins on your project. Can optionally --remove.         │
# │ push        │ zapier push                           │ Build and upload the current app - does not promote.                       │
# │ deprecate   │ zapier deprecate 1.0.0 2017-01-20     │ Mark a non-production version of your app as deprecated by a certain date. │
# │ describe    │ zapier describe                       │ Describes the current app.                                                 │
# │ env         │ zapier env 1.0.0 CLIENT_SECRET 12345  │ Read and write environment variables.                                      │
# │ help        │ zapier help [command]                 │ Lists all the commands you can use.                                        │
# │ history     │ zapier history                        │ Prints all recent history for your app.                                    │
# │ init        │ zapier init path                      │ Initializes a new zapier app in a directory.                               │
# │ invite      │ zapier invite [user@example.com]      │ Manage the invitees/testers on your project. Can optionally --remove.      │
# │ link        │ zapier link                           │ Link the current directory to an app you have access to.                   │
# │ login       │ zapier login                          │ Configure your `~/.zapierrc` with a deploy key.                            │
$ │ logout      │ zapier logout                         │ Deactivates all your personal deploy keys and resets `~/.zapierrc`.        │
# │ logs        │ zapier logs                           │ Prints recent logs. See help for filter arguments.                         │
# │ migrate     │ zapier migrate 1.0.0 1.0.1 [10%]      │ Migrate users from one version to another.                                 │
# │ promote     │ zapier promote 1.0.0                  │ Promotes a specific version to public access.                              │
# │ register    │ zapier register "Example"             │ Registers a new app in your account.                                       │
# │ scaffold    │ zapier scaffold resource "Contact"    │ Adds a starting resource, trigger, action or search to your app.           │
# │ test        │ zapier test                           │ Tests your app via `npm test`.                                             │
# │ upload      │ zapier upload                         │ Upload the last build as a version.                                        │
# │ validate    │ zapier validate                       │ Validates the current project.                                             │
# │ versions    │ zapier versions                       │ Lists all the versions of the current app.                                 │
# └─────────────┴───────────────────────────────────────┴────────────────────────────────────────────────────────────────────────────┘
```


## history

> Gets the history of your integration.

**Usage**: `zapier history`

History includes all the changes made over the lifetime of your integration. This includes everything from creation, updates, migrations, admins, and invitee changes, as well as who made the change and when.

**Flags**
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as `jq`. One of `[plain | json | raw | row | table]`. Defaults to `table`.
* `-d, --debug` | Show extra debugging output


## init

> Initializes a new Zapier integration. Optionally uses a template.

**Usage**: `zapier init PATH`

After running this, you'll have a new example integration in your directory. If you re-run this command on an existing directory it will leave existing files alone and not clobber them.

> Note: this doesn't register or deploy the integration with Zapier - try the `zapier register` and `zapier push` commands for that!

**Arguments**
* (required) `path` | Where to create the new integration. If the directory doesn't exist, it will be created. If the directory isn't empty, we'll ask for confirmation

**Flags**
* `-t, --template` | The template to start your integration with. One of `[minimal | trigger | search | create | basic-auth | custom-auth | digest-auth | oauth2 | oauth1-trello | oauth1-tumblr | oauth1-twitter | session-auth | dynamic-dropdown | files | middleware | resource | rest-hooks | search-or-create | babel | typescript | github | onedrive]`. Defaults to `minimal`.
* `-d, --debug` | Show extra debugging output

**Examples**
* `zapier init ./some/path`
* `zapier init . --template typescript`


## integrations

> Lists any integrations that you have admin access to.

**Usage**: `zapier integrations`

This command also checks the current directory for a linked integration.

**Flags**
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as `jq`. One of `[plain | json | raw | row | table]`. Defaults to `table`.
* `-d, --debug` | Show extra debugging output

**Aliases**
* `apps`


## link

> Link the current directory with an existing integration

**Usage**: `zapier link`

This command generates a .zapierapprc file in the directory in which it's ran. This file ties this code to an integration and is referenced frequently during `push` and `validate` operations. This file should be checked into source control.

If you're starting an integration from scratch, use `zapier init` instead.

**Flags**
* `-d, --debug` | Show extra debugging output


## login

> Configures your `~/.zapierrc` with a deploy key.

**Usage**: `zapier login`

**Flags**
* `-s, --sso` | Use this flag if you log into Zapier a Single Sign-On (SSO) button and don't have a Zapier password
* `-d, --debug` | Show extra debugging output


## logout

> Deactivates your acive deploy key and resets `~/.zapierrc`.

**Usage**: `zapier logout`

**Flags**
* `-d, --debug` | Show extra debugging output


## logs

> Prints recent logs.

**Usage**: `zapier logs`

Logs are created when your integration is run as part of a Zap. They come from explicit calls to `z.console.log()`, usage of `z.request()`, and any runtime errors. Note: this won't show logs from running locally with `zapier test`, since those never hit our server.

**Flags**
* `-v, --version` | Filter logs to the specified version.
* `-s, --status` | Filter logs to only see errors or successes One of `[any | success | error]`. Defaults to `any`.
* `-t, --type` | See logs of the specified type One of `[console | bundle | http]`. Defaults to `console`.
* `--detailed` | See extra info, like request/response body and headers.
* `-u, --user` | Only show logs for this user. Defaults to your account.  Defaults to `me`.
* `--limit` | Cap the number of logs returned. Max is 50 (also the default)  Defaults to `50`.
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as `jq`. One of `[plain | json | raw | row | table]`. Defaults to `table`.
* `-d, --debug` | Show extra debugging output


## migrate

> Migrates users from one version of your integration to another.

**Usage**: `zapier migrate FROMVERSION TOVERSION [PERCENT]`

Starts a migration to move users between different versions of your integration. You may also "revert" by simply swapping the from/to verion strings in the command line arguments (i.e. `zapier migrate 1.0.1 1.0.0`).

Only migrate users between non-breaking versions, use `zapier deprecate` if you have breaking changes!

Migrations can take between 5-10 minutes, so be patient and check `zapier history` to track the status.

Note: since a migration is only for non-breaking changes, users are not emailed about the update/migration. It will be a transparent process for them.

> Tip: We recommend migrating a small subset of users first, then watching error logs of the new version for any sort of odd behavior. When you feel confident there are no bugs, go ahead and migrate everyone. If you see unexpected errors, you can revert.

> Tip 2: You can migrate a single user by using `--user` (i.e. `zapier migrate 1.0.0 1.0.1 --user=user@example.com`).

**Arguments**
* (required) `fromVersion` | The version FROM which to migrate users.
* (required) `toVersion` | The version TO which to migrate users.
* `percent` | Percentage (between 1 and 100) of users to migrate.

**Flags**
* `--user` | Migrate only this user
* `-d, --debug` | Show extra debugging output

**Examples**
* `zapier migrate 1.0.0 1.0.1`
* `zapier migrate 1.0.1 2.0.0 10`
* `zapier migrate 2.0.0 2.0.1 --user=user@example.com`


## promote

> Promotes a specific version to public access.

**Usage**: `zapier promote VERSION`

Promotes an integration version into production (non-private) rotation, which means new users can use this integration version.

* This does mark the version as the official public version - all other versions & users are grandfathered.

* This does NOT build/upload or deploy a version to Zapier - you should `zapier push` first.

* This does NOT move old users over to this version - `zapier migrate 1.0.0 1.0.1` does that.

* This does NOT recommend old users stop using this version - `zapier deprecate 1.0.0 2017-01-01` does that.

Promotes are an inherently safe operation for all existing users of your integration.

> If this is your first time promoting - this will start the platform quality assurance process by alerting the Zapier platform team of your intent to make your app public. We'll respond within a few business days.

**Arguments**
* (required) `version` | The version you want promote.

**Flags**
* `-d, --debug` | Show extra debugging output

**Examples**
* `zapier promote 1.0.0`


## push

> Builds and uploads the current app.

**Usage**: `zapier push`

This command is the same as running `zapier build` and `zapier upload` in sequence. See those for more info.

**Flags**
* `--disable-dependency-detection` | Disables "smart" file inclusion. By default, Zapier only includes files that are required by `index.js`. If you (or your dependencies) require files dynamically (such as with `require(someVar)`), then you may see "Cannot find module" errors. Disabling this may make your `build.zip` too large. If that's the case, try using the `includeInBuild` option in your `.zapierapprc`. [See the docs](includeInBuild) for more info.
* `-d, --debug` | Show extra debugging output


## register

> Registers a new integration in your account.

**Usage**: `zapier register [TITLE]`

After running this, you can run `zapier push` to build and upload your integration for use in the Zapier editor.

This will change the  `./.zapierapprc` (which identifies this directory as holding code for a specific integration).

**Arguments**
* `title` | Your integrations's public title. Asked interactively if not present.

**Flags**
* `-d, --debug` | Show extra debugging output

**Examples**
* `zapier register`
* `zapier register "My Cool Integration"`


## scaffold

> Adds a starting resource, trigger, action or search to your app.

**Usage**: `zapier scaffold TYPE NAME`

The first argument should one of `resource|trigger|search|create` followed by the name of the file.

The scaffold command does two general things:

* Creates a new destination file like `resources/contact.js`

* (Attempts to) import and register it inside your entry `index.js`

You can mix and match several options to customize the created scaffold for your project.

> Note, we may fail to correctly rewrite your `index.js`. You may need to write in the require and registration, but we'll provide the code you need.

**Arguments**
* (required) `type` | undefined
* (required) `name` | undefined

**Flags**
* `-d, --dest` | Sets the new file's path. Use this flag when you want to create a different folder structure such as `src/triggers/my_trigger` The default destination is {type}s/{name}
* `-e, --entry` | Where to import the new file  Defaults to `index.js`.
* `-f, --force` | Should we overwrite an exisiting file
* `-d, --debug` | Show extra debugging output

**Examples**
* `zapier scaffold resource "Contact"`
* `zapier scaffold resource "Contact" --entry=index.js`
* `zapier scaffold resource "Contag Tag" --dest=resources/tag`
* `zapier scaffold trigger "Existing Create" --force`


## team:add

> Add a team member to your integration.

**Usage**: `zapier team:add EMAIL ROLE [MESSAGE]`

These users come in two levels:

  * Admins, who can edit everything about the app

  * Subscribers, who can't directly access the app, but will receive periodic email updates. These updates include quarterly health socores and more.

Team members can be freely added and removed.

**Arguments**
* (required) `email` | The user to be invited. If they don't have a Zapier account, they'll be prompted to create one.
* (required) `role` | The level the invited team member should be at. Admins can edit everything and get email updates. Subscribers only get email updates.
* `message` | A message sent in the email to your team member, if you need to provide context. Wrap the message in quotes to ensure spaces get saved.

**Flags**
* `-d, --debug` | Show extra debugging output

**Examples**
* `zapier team:add bruce@wayne.com admin`
* `zapier team:add alfred@wayne.com subscriber "Hey Alfred, check out this app."`

**Aliases**
* `team:invite`


## team:get

> Get a list of team members involved with your app.

**Usage**: `zapier team:get`

These users come in two levels:

  * Admins, who can edit everything about the app

  * Subscribers, who can't directly access the app, but will receive periodic email updates. These updates include quarterly health socores and more.

Use the `zapier team:add` and `zapier team:remove` commands to modify your team.

**Flags**
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as `jq`. One of `[plain | json | raw | row | table]`. Defaults to `table`.
* `-d, --debug` | Show extra debugging output

**Aliases**
* `team:list`


## team:remove

> Remove a team member from all versions of your integration.

**Usage**: `zapier team:remove`

Admins will immediately lose write access to the app. Subscribers won't receive future email updates.

**Flags**
* `-d, --debug` | Show extra debugging output

**Aliases**
* `team:delete`


## test

> Tests your integration via `npm test`.

**Usage**: `zapier test`

This command is effectively the same as `npm test`, except we also validate your integration and set up the environment. We recommend using mocha as your testing framework.

**Flags**
* `-t, --timeout` | Set test-case timeout in milliseconds  Defaults to `2000`.
* `--grep` | Only run tests matching pattern
* `--skip-validate` | Forgo running `zapier validate` before `npm test`
* `--yarn` | Use yarn instead of npm
* `-d, --debug` | Show extra debugging output

**Examples**
* `zapier test`
* `zapier test -t 30000 --grep api --skip-validate`


## upload

> Uploads the latest build of your app to Zapier

**Usage**: `zapier upload`

This command sends both build/build.zip and build/source.zip to Zapier for use.

> Note: Typically we recommend using `zapier push`, which does a build and upload, rather than `upload` by itself.

**Flags**
* `-d, --debug` | Show extra debugging output


## users:add

> Add a user to some or all versions of your integration.

**Usage**: `zapier users:add EMAIL [VERSION]`

When this command is run, we'll send an email to the user inviting them to try your app. You can track the status of that invite using the `zapier users:get` command.

Invited users will be able to see your integration's name, logo, and description. They'll also be able to create Zaps using any available triggers and actions.

**Arguments**
* (required) `email` | The user to be invited. If they don't have a Zapier account, they'll be prompted to create one.
* `version` | A version string (like 1.2.3). Optional, used only if you want to invite a user to a specific version instead of all versions.

**Flags**
* `-f, --force` | Skip confirmation. Useful for running programatically.
* `-d, --debug` | Show extra debugging output

**Aliases**
* `users:invite`


## users:get

> Get a list of users who have been invited to your app.

**Usage**: `zapier users:get`

Note that this list of users is NOT a comprehensive list of everyone who is using your integration. It only includes users who were invited directly by email (using the `zapier users:add` command or the web UI). Users who joined by clicking links generated using the `zapier user:links` command won't show up here.

**Flags**
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as `jq`. One of `[plain | json | raw | row | table]`. Defaults to `table`.
* `-d, --debug` | Show extra debugging output

**Aliases**
* `users:list`


## users:links

> Get a list of links that are used to invite users to your app.

**Usage**: `zapier users:links`

**Flags**
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as `jq`. One of `[plain | json | raw | row | table]`. Defaults to `table`.
* `-d, --debug` | Show extra debugging output


## users:remove

> Remove a user from all versions of your integration.

**Usage**: `zapier users:remove EMAIL`

When this command is run, their Zaps will immediately turn off. They won't be able to use your app again until they're re-invited or it has gone public. In practice, this command isn't run often as it's very disruptive to users.

**Arguments**
* (required) `email` | The user to be removed.

**Flags**
* `-f, --force` | Skip confirmation. Useful for running programatically.
* `-d, --debug` | Show extra debugging output

**Aliases**
* `users:delete`


## validate

> Validates your Zapier integration.

**Usage**: `zapier validate`

Runs the standard validation routine powered by json-schema that checks your integration for any structural errors. This is the same routine that runs during `zapier build`, `zapier upload`, `zapier push` or even as a test in `zapier test`.

**Flags**
* `--without-style` | Forgo pinging the Zapier server to run further checks
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as `jq`. One of `[plain | json | raw | row | table]`. Defaults to `table`.
* `-d, --debug` | Show extra debugging output

**Examples**
* `zapier validate`
* `zapier validate --without-style`
* `zapier validate --format json`


## versions

> Lists the versions of your integration available for use in the Zapier editor.

**Usage**: `zapier versions`

**Flags**
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as `jq`. One of `[plain | json | raw | row | table]`. Defaults to `table`.
* `-d, --debug` | Show extra debugging output
