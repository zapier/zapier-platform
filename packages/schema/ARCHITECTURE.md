# `zapier-platform-schema` Architecture

## Purpose

- This package, released as `zapier-platform-schema` publicly on [npm](https://www.npmjs.com/package/zapier-platform-schema), dictates the full schema against which apps are validated
- It's powered by [JSONSchema](https://json-schema.org/)
- The `core`, `schema`, and `cli` packages are always released together under matching version numbers.

## Technical Organization

> `schema/...`, when used in a path to a file, is shorthand for `zapier-platform/packages/schema/...`

- Schemas are declared, one-per-file, in `schema/lib/schemas`.
- The "root" schema is `schema/lib/schemas/AppSchema.js`, but that one doesn't change much.
- There are also functional constraints in `schema/lib/schemas/functional-constraints`, which validate things that JSONSchema can't cover (such as pairs of fields needing to have the same keys).
- Docs (in `schema/docs`) are generated directly from schemas via `pnpm build-docs`.
- Each schema has a `validate` that will validate incoming JSON. This is used in `core` to execute the `validation` command (which is exposed as the `zapier validate` command in CLI). See `schema/lib/utils/makeValidator.js`

### Tests

- tests live in `schema/test`.
- Each schema has an array of `examples` and `anti-examples`.
- Basic tests take each schema and ensure that it passes each of its `examples` and fails each of its `anti-examples`.
- There are separate tests for functional constraints.
