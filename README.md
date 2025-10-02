# Zapier Platform

[![CI](https://github.com/zapier/zapier-platform/actions/workflows/ci.yaml/badge.svg)](https://github.com/zapier/zapier-platform/actions/workflows/ci.yaml)

This is the main monorepo for all public code that powers the Zapier Platform Experience.

## Contents

It consists of a few main packages:

- [`zapier-platform-cli`](packages/cli): The CLI that devs can use to perform common tasks with their apps (such as `push`, `promote`, etc)
- [`zapier-platform-core`](packages/core): The package which all apps depend on; it provides functionality at runtime
- [`zapier-platform-schema`](packages/schema): The source of truth for what's allowed in the structure a Zapier app; not typically installed directly
- [`zapier-platform-legacy-scripting-runner`](packages/legacy-scripting-runner): If your app started as a Legacy Web Builder app, this provides a shim that keeps your app running seamlessly
- [`example-apps/*`](example-apps): A varied set of example apps to help you get started
- [`schema-to-ts`](schema-to-ts): Custom tooling to generate TypeScript declarations for `zapier-platform-core` using `zapier-platform-schema`'s output schemas

## Docs

* Public-facing docs:
  - [Platform Docs](https://docs.zapier.com/platform)
  - [CLI Command Reference](packages/cli/docs/cli.md)
  - [Schema Reference](packages/schema/docs/build/schema.md)
  - [Platform News](https://docs.zapier.com/platform/news) ([RSS feed](https://docs.zapier.com/platform/news.xml)) - latest updates, release notes, changelogs, and tips
  - [Old Changelog Archive](changelog) - old changelogs before v17
* Internal-facing docs:
  - Testing out new features that haven't been released to npm yet? See [docs-dev/install-dev.md](docs-dev/install-dev.md)
  - Learn about how this repo is structured in [ARCHITECTURE.md](ARCHITECTURE.md)
  - Looking to contribute to this repo? See [CONTRIBUTING.md](CONTRIBUTING.md)
  - Quick reference for development tasks? See [docs-dev/](docs-dev/)
