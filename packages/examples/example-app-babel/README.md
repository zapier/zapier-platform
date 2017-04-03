# "Babel" Example App For Zapier Platform

A barebones app that has a resource defined. This is mainly a proof-of-concept for using features not yet available in node v4.x.

Run this:

```bash
npm run zapier-dev # compiles live
zapier test
```

There's also a non- watch command:

```bash
npm run zapier-build
```

To push, instead of `zapier push`, we do:

```bash
npm run zapier-push # compiles first
```

> We recommend using the zapier-platform-cli and `zapier init --template=babel` to create an app.
