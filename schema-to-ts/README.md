# Zapier Schema-to-TS

This is a tool to convert the JSON Schema schemas from
zapier-platform-schema into TypeScript types and interfaces that can be
used in downstream integration application code.

This tool is not intended to be pushed to NPM, but rather to be used
during development of the Zapier Platform CLI. This is why it has been
placed as a top-level package in this repo, and not in `packages/` and
managed by Lerna.

## Development

- `pnpm install` for getting started.
- `pnpm test` for running unit tests.
- `pnpm build` for building this compiler into runnable js inside of `./dist/`.
- `pnpm generate-types` to actually generate the TypeScript interfaces.
  - By default, this will read `packages/schema/exported-schema.json` as input.
  - By default, this will write `packages/core/types/zapier.generated.d.ts` as output.

## "Publishing"

This tool is configured via run `pnpm generate-types` on every commit,
via husky. This will keep the generated TypeScript interfaces up to date
with the latest schema definitions.

## How it Works

This tool reads the contents of `packages/schema/exported-schema.json`,
and, starting with the AppSchema, recursively generates relevant types
and interfaces that it references. Ultimately, it writes a
`schemas.generated.d.ts` file in `packages/core/types/`. These types are
referenced and combined with the other types of zapier-platform-core to
provide a complete set of typings for integration developers to use.

Notably, there is an "override" system in `overrides.ts` that allows for
the raw types and interfaces to be modified or skipped as they are
encountered during conversion from JSONSchema into TypeScript. The
ts-morph library, a wrapper of TypeScript internals, is used to assemble
and write the final output.

## Rationale

Converting our JSON Schema schemas into TypeScript interfaces has been a
longstanding goal at Zapier (See issue
[#8](https://github.com/zapier/zapier-platform/issues/8) and
[#233](https://github.com/zapier/zapier-platform/issues/233)).
While the JSON schemas exist and are useful at the point of uploading
integrations to the Zapier platform, AND the fact there are plenty of
open-source schema TypeScript projects, none would address the fact that
there are features of JavaScript that are necessary when writing a
Zapier CLI integration. Specifically, our JSON Schemas are unable to
express the concepts of functions or promises, or connect the
definitions of input field definitions to the data provided in
bundle.inputData objects in perform functions.

In a similar vein, previous attempts, even to use the
`json-schema-to-typescript` library have floundered, as the level of
documentation and references it provides were undesirable. This project
was born as a HackWeek project in April 2024 to address some of these
issues, and has since been refined and improved.

This schema-to-ts project was rewritten in April 2025 to introduce the
much neater override system and any remove all dependency on the
`json-schema-to-typescript` library.
