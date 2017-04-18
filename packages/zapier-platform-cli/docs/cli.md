# Zapier CLI Reference

These are the generated docs for all Zapier platform CLI commands.

You can install the CLI with `npm install -g zapier-platform-cli`.

```bash
$ npm install -g zapier-platform-cli
```

# Commands

## apps

  > Lists all the apps you can access.

  **Usage:** `zapier apps`

  Lists any apps that you have admin access to. Also checks the current directory for a linked app, which you can control with `zapier link`.

**Arguments**



* `--format={plain,json,raw,row,table,small}` -- _optional_, display format. Default is `table`
* `--help` -- _optional_, prints this help text
* `--debug` -- _optional_, print debug API calls and tracebacks

```bash
$ zapier apps
# All apps listed below.
# 
# ┌─────────┬───────────-─┬─────────────────────┬────────┐
# │ Title   │ Unique Slug │ Timestamp           │ Linked │
# ├─────────┼───────────-─┼─────────────────────┼────────┤
# │ Example │ Example     │ 2016-01-01T22:19:28 │ ✔      │
# └─────────┴───────────-─┴─────────────────────┴────────┘
# 
# Try linking the current directory to a different app with the `zapier link` command.
```


## build

  > Builds a pushable zip from the current directory.

  **Usage:** `zapier build`

  Builds a ready-to-upload zip file, but does not upload / push the zip file. Generally you'd use `zapier push` which does this and `zapier upload` together.

It does the following steps:

* Creates a temporary folder
* Copies all code into the temporary folder
* Adds an entry point `zapierwrapper.js`
* Generates and validates app definition.
* Detects dependencies via browserify (optional)
* Zips up all needed `.js` files
* Moves the zip to `build/build.zip`

> If you get live errors like `Error: Cannot find module 'some-path'`, try disabling dependency detection.

**Arguments**


* `--disable-dependency-detection` -- _optional_, disables walking required files to slim the build
* `--include-js-map` -- _optional_, include .js.map files (usually source maps

```bash
$ zapier build
# Building project.
#
#   Copying project to temp directory - done!
#   Installing project dependencies - done!
#   Applying entry point file - done!
#   Validating project - done!
#   Building app definition.json - done!
#   Zipping project and dependencies - done!
#   Cleaning up temp directory - done!
#
# Build complete!
```


## collaborate

  > Manage the collaborators on your project. Can optionally --remove.

  **Usage:** `zapier collaborate [user@example.com]`

  Give any user registered on Zapier the ability to collaborate on your app. Commonly, this is useful for teammates, contractors, or other developers who might want to make changes on your app. Only admin access is supported. If you'd only like to provide read-only or testing access, try `zapier invite`.

**Arguments**

* _none_ -- print all collaborators
* `email [user@example.com]` -- _optional_, which user to add/remove
* `--remove` -- _optional_, elect to remove this user
* `--format={plain,json,raw,row,table,small}` -- _optional_, display format. Default is `table`
* `--help` -- _optional_, prints this help text
* `--debug` -- _optional_, print debug API calls and tracebacks

```bash
$ zapier collaborate
# The collaborators on your app "Example" listed below.
# 
# ┌──────────────────┬───────┬──────────┐
# │ Email            │ Role  │ Status   │
# ├──────────────────┼───────┼──────────┤
# │ user@example.com │ admin │ accepted │
# └──────────────────┴───────┴──────────┘

$ zapier collaborate user@example.com
# Preparing to add collaborator user@example.com to your app "Example".
# 
#   Adding user@example.com - done!
# 
# Collaborators updated! Try viewing them with `zapier collaborate`.

$ zapier collaborate user@example.com --remove
# Preparing to remove collaborator user@example.com from your app "Example".
# 
#   Removing user@example.com - done!
# 
# Collaborators updated! Try viewing them with `zapier collaborate`.
```


## convert

  > Converts a Zapier Platform app to a CLI app, stubs only.

  **Usage:** `zapier convert appid path`

  Creates a new Zapier app from an existing app. **The new app contains code stubs only.** It is supposed to get you started - it isn't going to create a complete app!

After running this, you'll have a new app in your directory, with stubs for your trigger and actions.  If you re-run this command on an existing directory it will leave existing files alone and not clobber them.

> Note: this doesn't register or push the app with Zapier - try `zapier register "Example"` and `zapier push` for that!

**Arguments**

* `appid [value]` -- **required**, Get the appid from https://zapier.com/developer/builder/ (check the URL)
* `location [value]` -- **required**, Relative to your current path - IE: `.` for current directory


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


## deprecate

  > Mark a non-production version of your app as deprecated, with removal by a certain date.

  **Usage:** `zapier deprecate 1.0.0 2017-01-20`

  A utility to alert users of breaking changes that require the deprecation of an app version. Zapier will send emails warning users of the deprecation.

> Do not use this if you have non-breaking changes, for example, just fixing help text or labels is a very safe operation.

**Arguments**

* `version [1.0.0]` -- **required**, the version to deprecate
* `deprecation_date [2017-01-20]` -- **required**, date Zapier will remove the version


```bash
$ zapier deprecate 1.0.0 2017-01-20
# Preparing to deprecate version 1.0.0 your app "Example".
# 
#   Deprecating 1.0.0 - done!
#   Deprecation successful!
# 
# We'll let users know that this version is no longer recommended and will cease to work on 2017-01-20.
```


## describe

  > Describes the current app.

  **Usage:** `zapier describe`

  Prints a human readable enumeration of your app's triggers, searches, and actions as seen by Zapier. Useful to understand how your resources convert and relate to different actions.

> These are the same actions we'd display in our editor!

* `Noun` -- your action's noun
* `Label` -- your action's label
* `Resource` -- the resource (if any) this action is tied to
* `Available Methods` -- testable methods for this action

**Arguments**



* `--format={plain,json,raw,row,table,small}` -- _optional_, display format. Default is `table`
* `--help` -- _optional_, prints this help text
* `--debug` -- _optional_, print debug API calls and tracebacks

```bash
$ zapier describe
# A description of your app "Example" listed below.
#
# Triggers
#
# ┌────────────┬────────────────────┬──────────────┬───────────────────────────────────────────────┐
# │ Noun       │ Label              │ Resource Ref │ Available Methods                             │
# ├────────────┼────────────────────┼──────────────┼───────────────────────────────────────────────┤
# │ Member     │ Updated Subscriber │ member       │ triggers.updated_member.operation.perform     │
# │            │                    │              │ triggers.updated_member.operation.inputFields │
# │            │                    │              │ resources.member.list.operation.perform       │
# │            │                    │              │ resources.member.list.operation.inputFields   │
# └────────────┴────────────────────┴──────────────┴───────────────────────────────────────────────┘
#
# Searches
#
#  Nothing found for searches, maybe try the `zapier scaffold` command?
#
# Creates
#
#  Nothing found for creates, maybe try the `zapier scaffold` command?
#
# If you'd like to add more, try the `zapier scaffold` command to kickstart!
```


## env

  > Read and write environment variables.

  **Usage:** `zapier env 1.0.0 CLIENT_SECRET 12345`

  Manage the environment of your app so that `process.env` has the necessary variables, making it easy to match a local environment with a production environment via `CLIENT_SECRET=12345 zapier test`.

**Arguments**

* `version [1.0.0]` -- **required**, the app version's environment to work on
* `key [CLIENT_SECRET]` -- _optional_, the uppercase key of the environment variable to set
* `value [12345]` -- _optional_, the raw value to set to the key
* `--remove` -- _optional_, optionally remove environment variable with this key
* `--format={plain,json,raw,row,table,small}` -- _optional_, display format. Default is `table`
* `--help` -- _optional_, prints this help text
* `--debug` -- _optional_, print debug API calls and tracebacks

```bash
$ zapier env 1.0.0
# The env of your "Example" listed below.
#
# ┌─────────┬───────────────┬───────┐
# │ Version │ Key           │ Value │
# ├─────────┼───────────────┼───────┤
# │ 1.0.0   │ CLIENT_SECRET │ 12345 │
# └─────────┴───────────────┴───────┘
#
# Try setting an env with the `zapier env 1.0.0 CLIENT_SECRET 12345` command.

$ zapier env 1.0.0 CLIENT_SECRET 12345
# Preparing to set environment CLIENT_SECRET for your 1.0.0 "Example".
#
#   Setting CLIENT_SECRET to "12345" - done!
#
# Environment updated! Try viewing it with `zapier env 1.0.0`.

$ zapier env 1.0.0 CLIENT_SECRET --remove
# Preparing to remove environment CLIENT_SECRET for your 1.0.0 "Example".
#
#   Deleting CLIENT_SECRET - done!
#
# Environment updated! Try viewing it with `zapier env 1.0.0`.
```


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
* `--format={plain,json,raw,row,table,small}` -- _optional_, display format. Default is `table`
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
# │ collaborate │ zapier collaborate [user@example.com] │ Manage the collaborators on your project. Can optionally --remove.         │
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
# │ promote     │ zapier promote 1.0.0                  │ Promotes a specific version to global access.                              │
# │ register    │ zapier register "Example"             │ Registers a new app in your account.                                       │
# │ scaffold    │ zapier scaffold resource "Contact"    │ Adds a starting resource, trigger, action or search to your app.           │
# │ test        │ zapier test                           │ Tests your app via `npm test`.                                             │
# │ upload      │ zapier upload                         │ Upload the last build as a version.                                        │
# │ validate    │ zapier validate                       │ Validates the current project.                                             │
# │ versions    │ zapier versions                       │ Lists all the versions of the current app.                                 │
# └─────────────┴───────────────────────────────────────┴────────────────────────────────────────────────────────────────────────────┘
```


## history

  > Prints all edit history for your app.

  **Usage:** `zapier history`

  Get the history of your app, listing all the changes made over the lifetime of your app. This includes everything from creation, updates, migrations, collaborator and invitee changes as well as who made the change and when.

**Arguments**



* `--format={plain,json,raw,row,table,small}` -- _optional_, display format. Default is `table`
* `--help` -- _optional_, prints this help text
* `--debug` -- _optional_, print debug API calls and tracebacks

```bash
$ zapier history
# The history of your app "Example" listed below.
# 
# ┌──────────────────────────┬───────────────────┬──────────────────┬─────────────────────┐
# │ What                     │ Message           │ Who              │ Timestamp           │
# ├──────────────────────────┼───────────────────┼──────────────────┼─────────────────────┤
# │ collaborator added       │ other@example.com │ user@example.com │ 2016-01-10T16:12:33 │
# │ environment variable set │ CLIENT_SECRET     │ user@example.com │ 2016-01-01T22:51:01 │
# │ version added            │ 1.2.52            │ user@example.com │ 2016-01-01T22:19:36 │
# │ app created              │ initial creation  │ user@example.com │ 2016-01-01T22:19:28 │
# └──────────────────────────┴───────────────────┴──────────────────┴─────────────────────┘
```


## init

  > Initializes a new Zapier app in a directory.

  **Usage:** `zapier init path`

  Initializes a new Zapier app. If you specify a template, will download and install the app from that template.

After running this, you'll have a new example app in your directory. If you re-run this command on an existing directory it will leave existing files alone and not clobber them.

> Note: this doesn't register or deploy the app with Zapier - try `zapier register "Example"` and `zapier push` for that!

**Arguments**

* `path [value]` -- **required**,
* `--template={minimal,resource,trigger,create,search,middleware,basic-auth,custom-auth,oauth2,session-auth,babel,rest-hooks,files}` -- _optional_, select a starting app template. Default is `minimal`

```bash
$ zapier init example-app --template=minimal
# Let's initialize your app!
#
#   Downloading zapier/zapier-platform-example-app-minimal starter app - done!
#   Copy /users/username/code/example-app/.gitignore - done!
#   Copy /users/username/code/example-app/index.js - done!
#   Copy /users/username/code/example-app/package.json - done!
#   Copy /users/username/code/example-app/test/index.js - done!
#
# Finished! You might need to `npm install` then try `zapier test`!
```


## invite

  > Manage the invitees/testers on your project. Can optionally --remove.

  **Usage:** `zapier invite [user@example.com]`

  Invite any user registered on Zapier to test your app. Commonly, this is useful for teammates, contractors, or other team members who might want to test, QA, or view your apps. If you'd like to provide full admin access, try `zapier collaborate`.

> Send an email directly, which contains a one-time use link for them only - or share the public URL to "bulk" invite folks!

**Arguments**

* _none_ -- print all invitees
* `email [user@example.com]` -- _optional_, which user to add/remove
* `--remove` -- _optional_, elect to remove this user
* `--format={plain,json,raw,row,table,small}` -- _optional_, display format. Default is `table`
* `--help` -- _optional_, prints this help text
* `--debug` -- _optional_, print debug API calls and tracebacks

```bash
$ zapier invite
# The invitees on your app listed below.
# 
# ┌──────────────────┬─────────┬──────────┐
# │ Email            │ Role    │ Status   │
# ├──────────────────┼─────────┼──────────┤
# │ user@example.com │ invitee │ accepted │
# └──────────────────┴─────────┴──────────┘
# 
# Don't want to send individual invite emails? Use this public link and share with anyone on the web:
# 
#   https://zapier.com/platform/public-invite/1/222dcd03aed943a8676dc80e2427a40d/

$ zapier invite user@example.com
# Preparing to add invitee user@example.com to your app "Example".
# 
#   Adding user@example.com - done!
# 
# Invitees updated! Try viewing them with `zapier invite`.

$ zapier invite user@example.com --remove
# Preparing to remove invitee user@example.com from your app "Example".
# 
#   Removing user@example.com - done!
# 
# Invitees updated! Try viewing them with `zapier invite`.
```


## link

  > Link the current directory to an app you have access to.

  **Usage:** `zapier link`

  Link the current directory to an app you have access to. It is fairly uncommon to run this command - more often you'd just `git clone git@github.com:example-inc/example.git` which would have a `.zapierapprc` file already included. If not, you'd need to be an admin on the app and use this command to regenerate the `.zapierapprc` file.

Or, if you are making an app from scratch - you should prefer `zapier init`.

> This will change the `./.zapierapprc` (which identifies the app assosciated with the current directory).

**Arguments**



* `--format={plain,json,raw,row,table,small}` -- _optional_, display format. Default is `table`
* `--help` -- _optional_, prints this help text
* `--debug` -- _optional_, print debug API calls and tracebacks

```bash
$ zapier link
# Which app would you like to link the current directory to?
#
# ┌────────┬─────────────┬────────────┬─────────────────────┬────────┐
# │ Number │ Title       │ Unique Key │ Timestamp           │ Linked │
# ├────────┼─────────────┼────────────┼─────────────────────┼────────┤
# │ 1      │ Example     │ Example    │ 2016-01-01T22:19:28 │ ✔      │
# └────────┴─────────────┴────────────┴─────────────────────┴────────┘
#      ...or type any title to create new app!
#
# Which app number do you want to link? You also may type a new app title to create one. (Ctrl-C to cancel)
#
  1
#
#   Selecting existing app "Example" - done!
#   Setting up `.zapierapprc` file - done!
#
# Finished! You can `zapier push` now to build & upload a version!
```


## login

  > Configure your `~/.zapierrc` with a deploy key.

  **Usage:** `zapier login`

  This is an interactive prompt which will create, retrieve and store a deploy key.

> This will change the  `~/.zapierrc` (home directory identifies the deploy key & user).

```bash
$ zapier login
# What is your Zapier login email address? (Ctrl-C to cancel)
# What is your Zapier login password?
#  <type here>
# Your deploy key has been saved to ~/.zapierrc. Now try `zapier init .` to start a new local app.
```


## logout

  > Deactivates all your personal deploy keys and resets `~/.zapierrc`.

  **Usage:** `zapier logout`

  Deactivates all your personal deploy keys and resets your local config. Does not delete any apps or versions.

> This will delete the  `~/.zapierrc` (home directory identifies the deploy key & user).

```bash
$ zapier logout
Preparing to deactivate personal deploy keys and reset local configs.

  Deactivating personal deploy keys - done!
  Destroying `~/.zapierrc` - done!

All personal keys deactivated - now try `zapier login` to login again.
```


## logs

  > Prints recent logs. See help for filter arguments.

  **Usage:** `zapier logs`

  Get the logs that are automatically collected during the running of your app. Either explicitly during `z.console.log()`, automatically via `z.request()`, or any sort of traceback or error.

> Does not collect or list the errors found locally during `zapier test`.

**Arguments**


* `--version=value` -- _optional_, display only this version's logs (default is all versions)
* `--status={any,success,error}` -- _optional_, display only success logs (status code < 400 / info) or error (status code > 400 / tracebacks). Default is `any`
* `--type={console,http}` -- _optional_, display only console or http logs. Default is `console`
* `--detailed` -- _optional_, show detailed logs (like request/response body and headers)
* `--user=user@example.com` -- _optional_, display only this user's logs. Default is `me`
* `--limit=50` -- _optional_, control the maximum result size. Default is `50`
* `--format={plain,json,raw,row,table,small}` -- _optional_, display format. Default is `table`
* `--help` -- _optional_, prints this help text
* `--debug` -- _optional_, print debug API calls and tracebacks

```bash
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
```


## migrate

  > Migrate users from one version of your app to another.

  **Usage:** `zapier migrate 1.0.0 1.0.1 [10%]`

  Starts a migration to move users between different versions of your app. You may also "revert" by simply swapping the from/to verion strings in the command line arguments (IE: `zapier migrate 1.0.1 1.0.0`).

Only migrate users between non-breaking versions, use `zapier deprecate` if you have breaking changes!

Migrations can take between 5-10 minutes, so be patient and check `zapier history` to track the status.

> Tip! We recommend migrating a small subset of users first, then watching error logs of the new version for any sort of odd behavior. When you feel confident there are no bugs, go ahead and migrate everyone. If you see unexpected errors, you can revert.

**Arguments**

* `fromVersion [1.0.0]` -- **required**, the version **from** which to migrate users
* `toVersion [1.0.1]` -- **required**, the version **to** which to migrate users
* `percent [100%]` -- _optional_, percent of users to migrate. Default is `100%`


```bash
$ zapier migrate 1.0.0 1.0.1 15%
# Getting ready to migrate your app "Example" from 1.0.0 to 1.0.1.
# 
#   Starting migration from 1.0.0 to 1.0.1 for 15% - done!
# 
# Migration successfully queued, please check `zapier history` to track the status. Normal migrations take between 5-10 minutes.
```


## promote

  > Promotes a specific version to global access.

  **Usage:** `zapier promote 1.0.0`

  Promotes an app version into production (non-private) rotation, which means new users can use this app version.

* This **does** mark the version as the official global version - all other versions & users are grandfathered.
* This **does not** build/upload or deploy a version to Zapier - you should `zapier push` first.
* This **does not** move old users over to this version - `zapier migrate 1.0.0 1.0.1` does that.
* This **does not** recommend old users stop using this version - `zapier deprecate 1.0.0 2017-01-01` does that.

Promotes are an inherently safe operation for all existing users of your app.

> If this is your first time promoting - this will start the platform quality assurance process by alerting the Zapier platform team of your intent to go global. We'll respond within a few business days.

**Arguments**

* `version [1.0.0]` -- **required**,


```bash
$ zapier promote 1.0.0
# Preparing to promote version 1.0.0 your app "Example".
# 
#   Promoting 1.0.0 - done!
#   Promition successful!
# 
# Optionally try the `zapier migrate 1.0.0 1.0.1 [10%]` command to move users to this version.
```


## push

  > Build and upload the current app - does not promote.

  **Usage:** `zapier push`

  A shortcut for `zapier build && zapier upload` - this is our recommended way to push an app. This is a common workflow:

1. Make changes in `index.js` or other files.
2. Run `zapier test`.
3. Run `zapier push`.
4. QA/experiment in the Zapier.com Zap editor.
5. Go to 1 and repeat.

> Note: this is always a safe operation as live/production apps are protected from pushes. You must use `zapier promote` or `zapier migrate` to impact live users.

If you have not yet registered your app, this command will prompt you for your app title and register the app.

```bash
$ zapier push
# Preparing to build and upload app.
#
#   Copying project to temp directory - done!
#   Installing project dependencies - done!
#   Applying entry point file - done!
#   Validating project - done!
#   Building app definition.json - done!
#   Zipping project and dependencies - done!
#   Cleaning up temp directory - done!
#   Uploading version 1.0.0 - done!
#
# Build and upload complete! Try loading the Zapier editor now, or try `zapier promote` to put it into rotation or `zapier migrate` to move users over
```


## register

  > Registers a new app in your account.

  **Usage:** `zapier register "Example"`

  This command registers your app with Zapier. After running this, you can run `zapier push` to push a version of your app that you can use in the Zapier editor.

> This will change the  `./.zapierapprc` (which identifies the app associated with the current directory).

**Arguments**

* `title ["My App Name"]` -- **required**,


```bash
$ zapier register "Example"
# Let's register your app "Example" on Zapier!
#
#   Creating a new app named "Example" on Zapier - done!
#   Setting up .zapierapprc file - done!
#   Applying entry point file - done!
#
# Finished!
```


## scaffold

  > Adds a starting resource, trigger, action or search to your app.

  **Usage:** `zapier scaffold {resource|trigger|search|create} "Name"`

  The scaffold command does two general things:

* Creates a new destination file like `resources/contact.js`
* (Attempts to) import and register it inside your entry `index.js`

You can mix and match several options to customize the created scaffold for your project.

> Note, we may fail to rewrite your `index.js` so you may need to handle the require and registration yourself.

**Arguments**

* `type [{resource,trigger,search,create}]` -- **required**, what type of thing are you creating
* `name ["Some Name"]` -- **required**, the name of the new thing to create
* `--dest={type}s/{name}` -- _optional_, sets the new file's path. Default is `{type}s/{name}`
* `--entry=index.js` -- _optional_, where to import the new file. Default is `index.js`

```bash
$ zapier scaffold resource "Contact"
$ zapier scaffold resource "Contact" --entry=index.js
$ zapier scaffold resource "Contag Tag" --dest=resources/tag
$ zapier scaffold resource "Tag" --entry=index.js --dest=resources/tag
# Adding resource scaffold to your project.
# 
#   Writing new resources/tag.js - done!
#   Rewriting your index.js - done!
# 
# Finished! We did the best we could, you might gut check your files though.
```


## test

  > Tests your app via `npm test`.

  **Usage:** `zapier test`

  This command is effectively the same as `npm test`, except we wire in some custom tests to validate your app. We recommend using mocha as your testing framework.

**Arguments**


* `--debug` -- _optional_, print zapier detailed logs to standard out
* `--timeout=value` -- _optional_, add a default timeout to mocha, in milliseconds

```bash
$ zapier test
#
#   app
#     validation
#       ✓ should be a valid app
#
#   triggers
#     hello world
#       ✓ should load fine (777ms)
#
#   2 passing (817ms)
#
```


## upload

  > Upload the last build as a version.

  **Usage:** `zapier upload`

  Upload the zip file already built by `zapier build` in build/build.zip. The version and other app details are read by Zapier from the zip file.

> Note: we generally recommend using `zapier push` which does both `zapier build && zapier upload` in one step.

```bash
$ zapier upload
# Preparing to upload a new version.
# 
#   Uploading version 1.0.0 - done!
# 
# Upload of build/build.zip complete! Try `zapier versions` now!
```


## validate

  > Validates the current app.

  **Usage:** `zapier validate`

  Runs the standard validation routine powered by json-schema that checks your app for any structural errors. This is the same routine that runs during `zapier build`, `zapier uploard`, `zapier push` or even as a test in `zapier test`.

**Arguments**



* `--format={plain,json,raw,row,table,small}` -- _optional_, display format. Default is `table`
* `--help` -- _optional_, prints this help text
* `--debug` -- _optional_, print debug API calls and tracebacks

```bash
$ zapier validate
# Validating project locally.
# 
# No errors found during validation routine.
# 
# This project looks good!

$ zapier validate
# Validating project locally.
# 
# ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
# │ = 1 =                                                                                                      │
# │     Property │ instance                                                                                    │
# │     Message  │ requires property "platformVersion"                                                         │
# │     Links    │ https://github.com/zapier/zapier-platform-schema/blob/v1.0.0/docs/build/schema.md#appschema │
# └──────────────┴─────────────────────────────────────────────────────────────────────────────────────────────┘
# 
# Make any changes to your project and rerun this command.
```


## versions

  > Lists all the versions of the current app.

  **Usage:** `zapier versions`

  Lists the versions of your app available for use in the Zapier editor.

**Arguments**



* `--format={plain,json,raw,row,table,small}` -- _optional_, display format. Default is `table`
* `--help` -- _optional_, prints this help text
* `--debug` -- _optional_, print debug API calls and tracebacks

```bash
$ zapier versions
# All versions of your app "Example" listed below.
# 
# ┌─────────┬──────────┬───────┬────────────────┬──────────────────┬─────────────────────┐
# │ Version │ Platform │ Users │ Deployment     │ Deprecation Date │ Timestamp           │
# ├─────────┼──────────┼───────┼────────────────┼──────────────────┼─────────────────────┤
# │ 1.0.0   │ 3.0.0    │ 0     │ non-production │ null             │ 2016-01-01T22:19:36 │
# └─────────┴──────────┴───────┴────────────────┴──────────────────┴─────────────────────┘
```
