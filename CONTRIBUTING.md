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

You can run all tests for all packages and configured tooling with yarn test:

```bash
yarn test
```

You seldom need to run all the tests because we have [CI][ci] do it. You have several ways to
filter running tests.

### Running All Tests in a Package

To run tests for a single package, you go into the package directory and run yarn test.
For example, this is how you run all the tests for the cli package:

```bash
cd packages/cli
yarn test
```

### Running All schema-to-ts Tests

The `schema-to-ts` tool also has its own suite of tests which use `vitest` to run. To run only these tests, do the following:

```bash
cd schema-to-ts
yarn test
```

### Using `.only`

Often you'd need to run a selected subset of tests. You can annotate the test case with
Mocha's [`.only`][mocha-only] to exclude others.

## Using `zapier` CLI Development Version

Add an alias to your `~/.bashrc`, `~/.zshrc`, or equivalent:

```
alias zapier-dev="/path/to/zapier-platform/packages/cli/src/bin/run"
```

This way you can keep stable and development versions separate:

- the `zapier` command keeps pointing to the stable version that you installed using
  `npm install -g zapier-platform-cli`
- `zapier-dev` points to the development version

Restart your shell. The `zapier-dev` command should be available.

## Using zapier-platform-core Development Version for an Integration Project

When you run `npm install` or `yarn` inside an integration project, you install
zapier-platform-core and schema from npm. But for development, you may want to link core
and schema to the ones in your local copy of zapier-platform repo. To do that, you use the
[`yarn link`][yarn-link] command.

First, in zapier-platform/packages/core and zapier-platform/packages/schema, run `yarn link`
to "register" the links:

```
cd /path/to/zapier-platform/packages/core
yarn link
cd /path/to/zapier-platform/packages/schema
yarn link
```

Then, in the integration project, run `yarn link <package_name>` to link core and schema.
This can be done before or after installing dependencies with `npm install` or `yarn` in
your integration project:

```
cd /path/to/your/awesome-app
yarn link zapier-platform-core
yarn link zapier-platform-schema
```


You can verify that it's working by checking if the core and schema are symlinked.

```
$ ls -hl node_modules/zapier-platform-*
... node_modules/zapier-platform-core -> .../.config/yarn/link/zapier-platform-core
... node_modules/zapier-platform-schema -> .../.config/yarn/link/zapier-platform-schema
```

To unlink, you use the `yarn unlink <package_name>` command to make the integration
project go back to use the packages downloaded from npm.

## Releasing a New Version

**Zapier employees only.** Refer to this [internal doc][releasing] on how to cut a release.


[license]: https://github.com/zapier/zapier-platform/blob/main/LICENSE
[yarn]: https://yarnpkg.com
[ci]: https://github.com/zapier/zapier-platform/actions/workflows/ci.yaml
[releasing]: https://coda.io/d/_di0MgBhlCWf/Releasing-a-New-zapier-platform-Version_su5eD
[mocha-only]: https://mochajs.org/#exclusive-tests
[yarn-link]: https://classic.yarnpkg.com/en/docs/cli/link
