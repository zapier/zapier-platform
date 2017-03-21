# Core for Zapier CLI Platform

This is the code that powers our [Zapier Platform CLI](https://github.com/zapier/zapier-platform-cli). You'll want to head to that repo to see how it's used.

## Development

- `npm install` for getting started
- `npm test` for running tests
- `npm run docs` for updating this README

## Publishing (after merging)

- `npm version [patch|minor|major]` will pull, test, update schema version in dependencies for this package, update docs, increment version in package.json, push tags, and publish to npm
