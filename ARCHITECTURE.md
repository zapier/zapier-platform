# `zapier-platform` Architecture

## Purpose

- The `zapier/zapier-platform` repository is structured as a [monorepo](https://en.wikipedia.org/wiki/Monorepo), where separate but related code lives together.

## Technical Organization

- The root folder mostly holds tooling scripts, tooling configuration, examples, and documentation for the platform as a whole.
- The individual packages are found in the `packages` directory. Each has its own `ARCHITECTURE.md` file outlining the code for that specific package.
- The `boilerplate` directory holds a "bare minimum" app that we include with each `zapier-platform-core` version (AKA Platform Version). We use this in combination with the Visual Builder to ship apps that that skip the build step.
