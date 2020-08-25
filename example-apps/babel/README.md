# "Babel" Example App For Zapier Platform

[![Build Status](https://travis-ci.org/zapier/zapier-platform-example-app-babel.svg?branch=master)](https://travis-ci.org/zapier/zapier-platform-example-app-babel)

A barebones app that has a resource defined. This is mainly a proof-of-concept for using features not yet available in node v12.x.

Run this:

```bash
npm run zapier-dev # compiles live
zapier test
```

`zapier build` works as a non-watch command that calls the `npm run _zapier-build` hook, and `zapier push` will make a fresh build using that hook as well.

> We recommend using the zapier-platform-cli and `zapier init . --template=babel` to create an app.
