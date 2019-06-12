# Core for Zapier CLI Platform [![Travis](https://img.shields.io/travis/zapier/zapier-platform-core.svg)](https://travis-ci.org/zapier/zapier-platform-core)

This is the code that powers our [Zapier Platform CLI](https://zapier.github.io/zapier-platform-cli). You'll want to head to that repo to see how it's used.

## Development

* `npm install` for getting started
* `npm test` for running unit tests
* `npm run local-integration-test` for running integration tests locally
* `npm run build-boilerplate -- --debug` for building a `build-boilerplate/*.zip` (if you want to test buildless locally)

### Integration Test on AWS Lambda

Make sure your AWS access key have permission to update and run Lambda functions, and then you can use these commands to run tests on AWS Lambda:

* `npm run deploy-integration-test` builds and deploys a zip to a function named `integration-test-cli` on Lambda
* `npm run lambda-integration-test` runs the integration test using the live Lambda function `integration-test-cli`

## Publishing (after merging)

* `npm version [patch|minor|major]` will pull, test, update schema version in dependencies for this package, update docs, increment version in package.json, and push tags, which then will tell Travis to publish to npm
