# Zapier Platform Core

This is the SDK used in Zapier integrations.

## Development

See [CONTRIBUTING.md](https://github.com/zapier/zapier-platform/blob/main/CONTRIBUTING.md) and [ARCHITECTURE.md](https://github.com/zapier/zapier-platform/blob/main/packages/core/ARCHITECTURE.md) of this package in particular.

Useful commands:

* `npm install` for getting started
* `npm test` for running unit tests
* `npm run local-integration-test` for running integration tests locally
* `npm run build-boilerplate -- --debug` for building a `build-boilerplate/*.zip` (if you want to test buildless locally)

### Integration Test on AWS Lambda

Make sure your AWS access key have permission to update and run Lambda functions, and then you can use these commands to run tests on AWS Lambda:

* `npm run deploy-integration-test` builds and deploys a zip to a function named `integration-test-cli` on Lambda
* `npm run lambda-integration-test` runs the integration test using the live Lambda function `integration-test-cli`

## Publishing

Only do this after merging your PR to `main`.

* `npm version [patch|minor|major]` will pull, test, update schema version in dependencies for this package, update docs, increment version in package.json, and push tags, which then will tell Travis to publish to npm
