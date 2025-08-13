# Contributing

## Terms

This contributor guide is mainly for Zapier employees. However, zapier-platform is a
public repo. Everyone is welcome to submit a pull request (PR). For non-employees, you
must agree to the terms of service listed on https://zapier.com/platform/tos or the
[LICENSE][license] file of the repo before contributing.

## Local Setup

Install [Yarn][yarn] if you haven't. We use Yarn to manage packages.

Clone this repo with git:

```bash
git clone git@github.com:zapier/zapier-platform.git
cd zapier-platform
```

In the repo directory, install dependencies with yarn:

```bash
yarn
```

That's it! Now you have a local environment for development.

## Running Tests

For detailed testing commands and workflow, see [docs-dev/commands.md](docs-dev/commands.md).

Quick overview:
- `yarn test` - Run all tests for all packages
- `yarn validate` - Full validation (test + smoke-test + lint)
- Individual packages: `cd` into package directory first, then `yarn test`

## Development CLI Setup

For setting up the development version of the CLI, see [docs-dev/install-dev.md](docs-dev/install-dev.md).

## Package Linking for Integration Development

For linking development versions of core and schema packages to your integration projects, see the "Package Linking" section in [docs-dev/commands.md](docs-dev/commands.md).

## Releasing a New Version

**Zapier employees only.** Refer to this [internal doc][releasing] on how to cut a release.


[license]: https://github.com/zapier/zapier-platform/blob/main/LICENSE
[yarn]: https://yarnpkg.com
[ci]: https://github.com/zapier/zapier-platform/actions/workflows/ci.yaml
[releasing]: https://coda.io/d/_di0MgBhlCWf/Releasing-a-New-zapier-platform-Version_su5eD
[mocha-only]: https://mochajs.org/#exclusive-tests
[yarn-link]: https://classic.yarnpkg.com/en/docs/cli/link
