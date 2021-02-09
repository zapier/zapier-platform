# `zapier-platform-schema` Architecture

## Purpose

- This package, released as `zapier-platform-schema` publicly on [npm](https://www.npmjs.com/package/zapier-platform-schema), dictates the full schema against which apps are validated
- It's powered by [JSONSchema](https://json-schema.org/)

## Technical Organization

> `schema/...`, when used in a path to a file, is shorthand for `zapier-platform/packages/schema/...`

- Schemas are declared, one-per-file, in `schema/lib/schemas`.
- The "root" schema is `schema/lib/schemas/AppSchema.js`, but that one doesn't change much.
- There are also functional constraints in `schema/lib/schemas/functional-constraints`, which validate things that JSONSchema can't cover (such as pairs of fields needing to have the same keys).
- Docs (in `schema/docs`) are generated directly from schemas via `yarn docs`.

### Tests

- tests live in `schema/test`.
- Each schema has an array of `examples` and `anti-examples`.
- Basic tests take each schema and ensure that it passes each of its `examples` and fails each of its `anti-examples`.
- There are separate tests for functional constraints.
