# Zapier Platform Schema

This is the schema for Zapier integrations.

For documentation:

- [Platform Docs](https://docs.zapier.com/platform)
- [CLI Reference](https://github.com/zapier/zapier-platform/blob/main/packages/cli/docs/cli.md)
- [Schema Reference](https://github.com/zapier/zapier-platform/blob/main/packages/schema/docs/build/schema.md)

## Development

See [CONTRIBUTING.md](https://github.com/zapier/zapier-platform/blob/main/CONTRIBUTING.md) and [ARCHITECTURE.md](https://github.com/zapier/zapier-platform/blob/main/packages/schema/ARCHITECTURE.md) of this package in particular.

Useful commands:

- `yarn` to install packages and get started
- `yarn lint` to lint code
- `yarn test` to run tests
- `yarn smoke-test` to run smoke tests
- `yarn coverage` to run tests and display test coverage
- `yarn validate` to run tests, smoke tests, and linter
- `yarn export` to update the exported-schema (even if only the version changes)
- `yarn docs` to update docs (even if only the version changes)
- `yarn build` to update docs and the exported-schema (even if only the version changes)

## Publishing

Only do this after merging your PR to `main`.

- `yarn version --[patch|minor|major]` will pull, test, update exported-schema, update docs, increment version in package.json, push tags, and publish to npm
