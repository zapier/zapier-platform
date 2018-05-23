# Typescript Example App For Zapier Platform

[![Build Status](https://travis-ci.org/zapier/zapier-platform-example-app-typescript.svg?branch=master)](https://travis-ci.org/zapier/zapier-platform-example-app-typescript)

A barebones app that has a resource defined. This is mainly a proof-of-concept for using features not yet available in node.

Run this:

```bash
npm run zapier-dev # compiles & watches your app
zapier test
```

There's also a non-watch command:

```bash
npm run zapier-build
```

To push, instead of `zapier push`, we do:

```bash
npm run zapier-push # compiles first
```

> We recommend using the zapier-platform-cli and `zapier init . --template=typescript` to create an app.
