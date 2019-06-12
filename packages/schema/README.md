# Schema For Zapier CLI Platform

[Visit the CLI for basic documentation and instructions on how to use](https://zapier.github.io/zapier-platform-cli).

[View all the schema definitions](https://zapier.github.io/zapier-platform-schema/build/schema.html).

## Development

- `npm install` for getting started
- `npm test` for running tests
- `npm run export` for updating the exported-schema (even if only the version changes)
- `npm run docs` for updating docs (even if only the version changes)
- `npm run coverage` for running tests and displaying test coverage

## Publishing (after merging)

- `npm version [patch|minor|major]` will pull, test, update exported-schema, update docs, increment version in package.json, push tags, and publish to npm
