# Zapier Platform

[![CI](https://github.com/zapier/zapier-platform/actions/workflows/ci.yaml/badge.svg)](https://github.com/zapier/zapier-platform/actions/workflows/ci.yaml)

This is the main monorepo for all public code that powers the Zapier Platform Experience.

## Contents

It consists of a few main packages:

- `zapier-platform-cli`: The CLI that devs can use to perform common tasks with their apps (such as `push`, `promote`, etc)
- `zapier-platform-core`: The package which all apps depend on; it provides functionality at runtime.
- `zapier-platform-schema`: The source of truth for what's allowed in the structure a Zapier app; not typically installed directly
- `zapier-platform-legacy-scripting-runner`: If your app started as a Legacy Web Builder app, this provides a shim that keeps your app running seamlessly
- `example-apps/*`: A varied set of example apps to get you started

## Docs

* Public-facing docs:
  - [Latest CLI developer guide](https://github.com/zapier/zapier-platform/blob/master/packages/cli/README.md)
  - [Latest CLI command reference](https://github.com/zapier/zapier-platform/blob/master/packages/cli/docs/cli.md)
  - [Latest schema docs](https://github.com/zapier/zapier-platform/blob/master/packages/schema/docs/build/schema.md)
  - The :point_up: docs are also hosted at https://platform.zapier.com
* Internal-facing docs:
  - Learn about how this repo is structured in [ARCHITECTURE.md](ARCHITECTURE.md).
  - Looking to contribute to this repo? See [CONTRIBUTING.md](CONTRIBUTING.md).
