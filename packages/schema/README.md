# Zapier Platform Schema

This is the schema for Zapier integrations.

For documentation:

- [Platform Docs](https://docs.zapier.com/platform)
- [CLI Reference](https://github.com/zapier/zapier-platform/blob/main/packages/cli/docs/cli.md)
- [Schema Reference](https://github.com/zapier/zapier-platform/blob/main/packages/schema/docs/build/schema.md)

## Development

See [CONTRIBUTING.md](https://github.com/zapier/zapier-platform/blob/main/CONTRIBUTING.md) and [ARCHITECTURE.md](https://github.com/zapier/zapier-platform/blob/main/packages/schema/ARCHITECTURE.md) of this package in particular.

Useful commands:

- `pnpm` to install packages and get started
- `pnpm lint` to lint code
- `pnpm test` to run tests
- `pnpm smoke-test` to run smoke tests
- `pnpm coverage` to run tests and display test coverage
- `pnpm validate` to run tests, smoke tests, and linter
- `pnpm export` to update the exported-schema (even if only the version changes)
- `pnpm docs` to update docs (even if only the version changes)
- `pnpm build` to update docs and the exported-schema (even if only the version changes)

## Publishing

Only do this after merging your PR to `main`.

- `pnpm version --[patch|minor|major]` will pull, test, update exported-schema, update docs, increment version in package.json, push tags, and publish to npm
