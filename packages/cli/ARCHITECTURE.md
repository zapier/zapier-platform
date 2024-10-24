# `zapier-platform-cli` Architecture

## Purpose

- This package, released as `zapier-platform-cli` publicly on [npm](https://www.npmjs.com/package/zapier-platform-cli), powers the Zapier CLI (invoked via the `zapier` command).
- Developers install and use this tool to complete operations required to develop an integration on the Zapier platform.
- The `core`, `schema`, and `cli` packages are always released together under matching version numbers.

## Technical Organization

> `cli/...`, when used in a path to a file, is shorthand for `zapier-platform/packages/cli/...`

### Commands

- We use the [oclif](https://github.com/oclif/oclif) (created for the Heroku CLI) to power our CLI
- Each command (`zapier push`, `zapier test`, etc) gets its own file in the `cli/src/oclif/commands` directory.
- Some sub-commands live in sub-directories, such as `zapier env:get` (which is found in `cli/src/oclif/commands/env/get.js`).
- All commands inherit from `ZapierBaseCommand`, which provides convenient methods for parsing flags, printing structured data, and verifying authentication
- Command code should be responsible for all user-facing behavior, including:
  - loading indicators
  - printing data
  - supplying and parsing args/flags
  - throwing descriptive error messages
- Core functionality should mostly live in the `utils` folder (though we hope to organize it better eventually); see next section

### Everything Else

- All other functionality (especially as it relates to calling APIs) lives in the `cli/src/utils` folder); It's a bit of a kitchen sink
- The most important file is probably `cli/src/utils/api.js`, which controls authentication and API calls against the Zapier monolith
- The next most important file is probably `cli/src/utils/display.js`, which powers the loading spinner and printing tables. In a command you typically won't use these directly (prefer methods on `ZapierBaseCommand`).
- While commands should be user-facing functionality, "business logic" should prefer to live in this folder. It may get a new name at some point

### Tests

- Most functions in `cli/src/utils` have unit test coverage (`cli/src/tests/utils`).
- There are also "smoke tests", which simulate the full flow of the user journey (install, create an app, scaffold a trigger, run the tests), found in `cli/src/smoke-tests`
