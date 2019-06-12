# Zapier Platform

[![Build Status](https://travis-ci.com/zapier/zapier-platform.svg?branch=master)](https://travis-ci.com/zapier/zapier-platform)

This is the main monorepo for all public code that powers the Zapier Platform Experience.

## Contents

It consists of a few main packages:

- `zapier-platform-cli`: The CLI that devs can use to perform common tasks with their apps (such as `push`, `promote`, etc)
- `zapier-platform-core`: The package which all apps depend on; it provides functionality at runtime.
- `zapier-platform-schema`: The source of truth for what's allowed in the structure a Zapier app; not typically installed directly
- `zapier-platform-legacy-scripting-runner`: If your app started as a Legacy Web Builder app, this provides a shim that keeps your app running seamlessly
- `example-apps/*`: A varied set of example apps to get you started

## Getting Started

```bash
# Install Yarn if you haven't
brew install yarn

# Clone this repo
git clone git@github.com:zapier/zapier-platform.git
cd zapier-platform

# Install dependencies
yarn

# Run tests for all packages
yarn test

# Run tests for an individual package
cd packages/cli
yarn test
```
