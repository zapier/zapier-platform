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

You can run all tests for all packages with yarn test:

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

### Using .only

TBA

## Releasing a New Version

**Zapier employees only.** Refer to this [internal doc](releasing) on how to cut a release.


[license]: https://github.com/zapier/zapier-platform/blob/master/LICENSE
[yarn]: https://yarnpkg.com
[ci]: https://github.com/zapier/zapier-platform/actions/workflows/ci.yaml
[releasing]: https://coda.io/d/Team-Developer-Platform_di0MgBhlCWf
