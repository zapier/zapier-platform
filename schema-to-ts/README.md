# Zapier Schema-to-TS

This is a tool to convert the JSON Schema schemas from
zapier-platform-schema into TypeScript interfaces that can be used in
downstream integration application code.

This tool is not intended to be pushed to NPM, but rather to be used
during development of the Zapier Platform CLI. This is why it has been
placed as a top-level package in this repo, and not in `packages/` and
managed by Lerna.

## Development

- `yarn install` for getting started.
- `yarn test` for running unit tests.
- `yarn build` for building this compiler into runnable js inside of `./dist/`.
- `yarn generate-types` to actually generate the TypeScript interfaces.
  - By default, this will read `packages/schema/exported-schema.json` as input.
  - By default, this will write `packages/core/types/zapier.generated.d.ts` as output.

## "Publishing"

This tool is configured via run `yarn generate-types` on every commit,
via husky. This will keep the generated TypeScript interfaces up to date
with the latest schema definitions.

## How it Works

This tool relies heavily on the
[json-schema-to-typescript](https://github.com/bcherny/json-schema-to-typescript)
package, which does the heavy lifting of converting the JSON Schema
objects into mostly-parsed TypeScript interface definitions. Instead of
using it's typescript output though, we only use it's parsing and AST
generation steps. From there we manipulate the AST of each schema to our
liking, and then finally generate the TypeScript code we want to an
output file.

The sequence of steps to compile a schema to TypeScript are:

- Read the schemas from disk (typically `packages/schema/exported-schema.json`)
- _"Precompile"_ the schemas. Each schema is converted into a `NamedAst`
  node in this step. The steps for this are inherited straight from
  json-schema-to-typescript, and implemented by `precompile.ts:compileToAst()`
  - _Dereference_ `$ref` pointers.
  - _Link_ named schemas to their definitions.
  - _Normalise_ schema components into consistent structures.
  - _Parse_ schemas into AST node instances.
  - _Optimise_ and cleanup the AST.
- _Transform_ the nodes with our own custom logic. This does things like
  cleanup the formatting of the doc comments, injects references to the
  `PerformFunction`, and more. This is implemented by
  `transform.ts:applyAllTransformations()`.
- _Generate_ the TypeScript code from the AST. This is implemented by
  `generate.ts:generateTypeScript()`.
- _Format_ the typescript code with prettier. This is implemented by
  `formatter.ts:format()`.

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
express the concepts of functions or Promises.

In a similar vein, previous attempts, even to use the
`json-schema-to-typescript` library have floundered, as the level of
documentation and references it provides were undesirable. This project
was born as a HackWeek project in April 2024 to address some of these
issues, and has since been refined and improved.
