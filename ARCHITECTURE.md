# `zapier-platform` Architecture

## Purpose

- The `zapier/zapier-platform` repository is structured as a [monorepo](https://en.wikipedia.org/wiki/Monorepo), where separate but related code lives together.

## Technical Organization

- The root folder mostly holds tooling scripts, tooling configuration, examples, and documentation for the platform as a whole.
  - The `schema-to-ts` folder contains a custom package that generates TypeScript declarations for `zapier-platform-core` based on the `zapier-platform-schema`'s generated `exported-schema.json` file. These generated type declarations are bundled into `zapier-platform-core` and shipped to end-users as part of that NPM package. Type declarations are configured to be generated via the `generate-types` NPM script, which runs automatically as part of a `husky` precommit hook.
- The individual packages are found in the `packages` directory. Each has its own `ARCHITECTURE.md` file outlining the code for that specific package.
- The `boilerplate` directory holds a "bare minimum" app that we include with each `zapier-platform-core` version (AKA Platform Version). We use this in combination with the Visual Builder to ship apps that that skip the build step.
