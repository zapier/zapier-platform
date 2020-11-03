# Schema For Zapier CLI Platform

[Visit the CLI for basic documentation and instructions on how to use](https://zapier.github.io/zapier-platform-cli).

[View all the schema definitions](https://zapier.github.io/zapier-platform-schema/build/schema.html).

## Development

- `yarn` to install packages and get started
- `yarn lint` to lint code
- `yarn test` to run tests
- `yarn smoke-test` to run smoke tests
- `yarn coverage` to run tests and display test coverage
- `yarn validate` to run tests, smoke tests, and linter
- `yarn export` to update the exported-schema (even if only the version changes)
- `yarn docs` to update docs (even if only the version changes)
- `yarn build` to update docs and the exported-schema (even if only the version changes)

## Publishing (after merging)

- `yarn version --[patch|minor|major]` will pull, test, update exported-schema, update docs, increment version in package.json, push tags, and publish to npm
