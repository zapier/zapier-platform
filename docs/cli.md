# Zapier CLI Reference

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

* Detects dependencies via browserify (optional, on by default)

* Zips up all needed `.js` files. If you want to include more files, add a "includeInBuild" property (array with strings of regexp paths) to your `.zapierapprc`.

* Moves the zip to `build/build.zip` and `build/source.zip` and deletes the temp folder

This command is typically followed by `zapier upload`.

**Flags**
* `--disable-dependency-detection` | Disable "smart" file inclusion. By default, Zapier only includes files that are required by `index.js`. If you (or your dependencies) require files dynamically (such as with `require(someVar)`), then you may see "Cannot find module" errors. Disabling this may make your `build.zip` too large. If that's the case, try using the `includeInBuild` option in your `.zapierapprc`. See the docs about `includeInBuild` for more info.
* `-d, --debug` | Show extra debugging output.


## convert

> Convert a Visual Builder integration to a CLI integration.

**Usage**: `zapier convert INTEGRATIONID PATH`

The resulting CLI integraiton will be identical to its Visual Builder version and ready to push and use immediately!

If you re-run this command on an existing directory it will leave existing files alone and not clobber them.

You'll need to do a `zapier push` before the new version is visible in the editor, but otherwise you're good to go.

**Arguments**
* (required) `integrationId` | To get the integration/app ID, go to "https://developer.zapier.com//app/developer", click on an integration, and copy the number directly after "/app/" in the URL.
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

Zapier will send an email warning users of the deprecation once a date is set, they'll start seeing it as "Deprecated" in the UI, and once the deprecation date arrives, if the Zaps weren't updated, they'll be paused and the users will be emailed again explaining what happened.

After the deprecation date has passed it will be safe to delete that integration version.

Do not use this if you have non-breaking changes, such as fixing help text.

**Arguments**
* (required) `version` | The version to deprecate.
* (required) `date` | The date (YYYY-MM-DD) when Zapier will make the specified version unavailable.

**Flags**
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
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as jq. One of `[plain | json | raw | row | table]`. Defaults to `table`.
* `-d, --debug` | Show extra debugging output.


## env:get

> Get environment variables for a version.

**Usage**: `zapier env:get VERSION`

**Arguments**
* (required) `version` | The version to get the environment for.

**Flags**
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as jq. One of `[plain | json | raw | row | table]`. Defaults to `table`.
* `-d, --debug` | Show extra debugging output.

**Examples**
* `zapier env:get 1.2.3`


## env:set

> Set environment variables for a version.

**Usage**: `zapier env:set VERSION [KEY-VALUE PAIRS...]`

**Arguments**
* (required) `version` | The version to set the environment for. Values are copied forward when a new version is created, but this command will only ever affect the specified version.
* `key-value pairs...` | The key-value pairs to set. Keys are case-insensitive. Each pair should be space separated and pairs should be separated by an `=`. For example: `A=123 B=456`

**Flags**
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
* `-d, --debug` | Show extra debugging output.

**Examples**
* `zapier env:unset 1.2.3 SECRET OTHER`


## history

> Get the history of your integration.

**Usage**: `zapier history`

History includes all the changes made over the lifetime of your integration. This includes everything from creation, updates, migrations, admins, and invitee changes, as well as who made the change and when.

**Flags**
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as jq. One of `[plain | json | raw | row | table]`. Defaults to `table`.
* `-d, --debug` | Show extra debugging output.


## init

> Initialize a new Zapier integration with a project template.

**Usage**: `zapier init PATH`

After running this, you'll have a new integration in the specified directory. If you re-run this command on an existing directory, it will prompt before overwriting any existing files.

This doesn't register or deploy the integration with Zapier - try the `zapier register` and `zapier push` commands for that!

**Arguments**
* (required) `path` | Where to create the new integration. If the directory doesn't exist, it will be created. If the directory isn't empty, we'll ask for confirmation

**Flags**
* `-t, --template` | The template to start your integration with. One of `[basic-auth | callback | custom-auth | digest-auth | dynamic-dropdown | files | minimal | oauth1-trello | oauth2 | search-or-create | session-auth | typescript]`.
* `-d, --debug` | Show extra debugging output.

**Examples**
* `zapier init myapp`
* `zapier init ./path/myapp --template oauth2`


## integrations

> List integrations you have admin access to.

**Usage**: `zapier integrations`

This command also checks the current directory for a linked integration.

**Flags**
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as jq. One of `[plain | json | raw | row | table]`. Defaults to `table`.
* `-d, --debug` | Show extra debugging output.

**Aliases**
* `apps`


## jobs

> Lists ongoing migration or promotion jobs for the current integration.

**Usage**: `zapier jobs`

A job represents a background process that will be queued up when users execute a "migrate" or "promote" command for the current integration.

Each job will be added to the end of a queue of "promote" and "migration" jobs where the "Job Stage" will then be initialized with "requested".

Job stages will then move to "estimating", "in_progress" and finally one of four "end" stages: "complete", "aborted", "errored" or "paused".

Job times will vary as it depends on the size of the queue and how many users your integration has.

Jobs are returned from oldest to newest.

**Flags**
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as jq. One of `[plain | json | raw | row | table]`. Defaults to `table`.
* `-d, --debug` | Show extra debugging output.

**Examples**
* `zapier jobs`


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
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as jq. One of `[plain | json | raw | row | table]`. Defaults to `table`.
* `-d, --debug` | Show extra debugging output.


## migrate

> Migrate a percentage of users or a single user from one version of your integration to another.

**Usage**: `zapier migrate FROMVERSION TOVERSION [PERCENT]`

Start a migration to move users between different versions of your integration. You may also "revert" by simply swapping the from/to verion strings in the command line arguments (i.e. `zapier migrate 1.0.1 1.0.0`).

**Only use this command to migrate users between non-breaking versions, use `zapier deprecate` if you have breaking changes!**

Migration time varies based on the number of affected Zaps. Be patient and check `zapier jobs` to track the status. Or use `zapier history` if you want to see older jobs.

Since a migration is only for non-breaking changes, users are not emailed about the update/migration. It will be a transparent process for them.

We recommend migrating a small subset of users first, via the percent argument, then watching error logs of the new version for any sort of odd behavior. When you feel confident there are no bugs, go ahead and migrate everyone. If you see unexpected errors, you can revert.

You can migrate a specific user's Zaps by using `--user` (i.e. `zapier migrate 1.0.0 1.0.1 --user=user@example.com`). This will migrate Zaps in any account the user is a member of where the following criteria is met.

  - The Zap is owned by the user.

  - The Zap is not shared.

  - The integration auth used is not shared.

Alternatively, you can pass the `--account` flag, (i.e. `zapier migrate 1.0.0 1.0.1 --account=account@example.com`). This will migrate all users' Zaps, Private & Shared, within all accounts for which the specified user is a member.

**The `--account` flag should be used cautiously as it can break shared Zaps for other users in Team or Company accounts.**

You cannot pass both `PERCENT` and `--user` or `--account`.

You cannot pass both `--user` and `--account`.

**Arguments**
* (required) `fromVersion` | The version FROM which to migrate users.
* (required) `toVersion` | The version TO which to migrate users.
* `percent` | Percentage (between 1 and 100) of users to migrate.

**Flags**
* `--user` | Migrates all of a users' Private Zaps within all accounts for which the specified user is a member
* `--account` | Migrates all of a users' Zaps, Private & Shared, within all accounts for which the specified user is a member
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

If your integration is private and passes our integration checks, this will give you a URL to a form where you can fill in additional information for your integration to go public. After reviewing, the Zapier team will approve to make it public if there are no issues or decline with feedback.

Check `zapier jobs` to track the status of the promotion. Or use `zapier history` if you want to see older jobs.

**Arguments**
* (required) `version` | The version you want to promote.

**Flags**
* `-y, --yes` | Automatically answer "yes" to any prompts. Useful if you want to avoid interactive prompts to run this command in CI.
* `-d, --debug` | Show extra debugging output.

**Examples**
* `zapier promote 1.0.0`


## push

> Build and upload the current integration.

**Usage**: `zapier push`

This command is the same as running `zapier build` and `zapier upload` in sequence. See those for more info.

**Flags**
* `--disable-dependency-detection` | Disable "smart" file inclusion. By default, Zapier only includes files that are required by `index.js`. If you (or your dependencies) require files dynamically (such as with `require(someVar)`), then you may see "Cannot find module" errors. Disabling this may make your `build.zip` too large. If that's the case, try using the `includeInBuild` option in your `.zapierapprc`. See the docs about `includeInBuild` for more info.
* `-d, --debug` | Show extra debugging output.


## register

> Register a new integration in your account.

**Usage**: `zapier register [TITLE]`

After running this, you can run `zapier push` to build and upload your integration for use in the Zapier editor.

This will change the  `./.zapierapprc` (which identifies this directory as holding code for a specific integration).

**Arguments**
* `title` | Your integrations's public title. Asked interactively if not present.

**Flags**
* `-d, --debug` | Show extra debugging output.

**Examples**
* `zapier register`
* `zapier register "My Cool Integration"`


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
* `-e, --entry` | Supply the path to your integration's root (`index.js`). Only needed if your `index.js` is in a subfolder, like `src`.  Defaults to `index.js`.
* `-f, --force` | Should we overwrite an exisiting trigger/search/create file?
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
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as jq. One of `[plain | json | raw | row | table]`. Defaults to `table`.
* `-d, --debug` | Show extra debugging output.

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
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as jq. One of `[plain | json | raw | row | table]`. Defaults to `table`.
* `-d, --debug` | Show extra debugging output.

**Aliases**
* `users:list`


## users:links

> Get a list of links that are used to invite users to your integration.

**Usage**: `zapier users:links`

**Flags**
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as jq. One of `[plain | json | raw | row | table]`. Defaults to `table`.
* `-d, --debug` | Show extra debugging output.


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
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as jq. One of `[plain | json | raw | row | table]`. Defaults to `table`.
* `-d, --debug` | Show extra debugging output.

**Examples**
* `zapier validate`
* `zapier validate --without-style`
* `zapier validate --format json`


## versions

> List the versions of your integration available for use in the Zapier editor.

**Usage**: `zapier versions`

**Flags**
* `-f, --format` | Change the way structured data is presented. If "json" or "raw", you can pipe the output of the command into other tools, such as jq. One of `[plain | json | raw | row | table]`. Defaults to `table`.
* `-d, --debug` | Show extra debugging output.
