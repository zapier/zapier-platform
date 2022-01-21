# `zapier-platform-core` Architecture

## Purpose

- This package, released as `zapier-platform-core` publicly on [npm](https://www.npmjs.com/package/zapier-platform-core), ships code that partners (literally) depend on.
- Once declared as a dependency and installed, developers can import it to help with testing & TypeScript types.
- It's not actually `require`d directly in app code, but it runs an app's exposed functions at runtime.
- Its main responsibilities are:
  - organizing data passed from the Zapier monolith into the developer code (see [A bridge between...](#a-bridge-between-monolith-and-developer) below)
  - maintaining the `z` object, on which developers rely (see [Z Object](#z-object) below)
- The `core`, `schema`, and `cli` packages are always released together under matching version numbers.

## Technical Organization

> `core/...`, when used in a path to a file, is shorthand for `zapier-platform/packages/core/...`

### A Bridge Between Monolith and Developer

- The monolith has a method called `call_into_js` which builds an `event` dict and sends it directly to [AWS Lambda](https://aws.amazon.com/lambda/)
- The event is the first argument in the function returned from `createLambdaHandler` (in `core/src/tools/create-lambda-handler.js`).
- That function creates a Node.js `Domain`, which captures all errors. Inside said `domain`, it runs the dev's code with the `event` (which holds, among other things, the `bundle`). Note that the `Domain` class has been deprecated, but is still available for use until it's actually removed.
- There's some app-level middleware that runs (see `src/create-app.js`), then the function itself is run. Output (or errors) are returned from lambda to the monolith.

### Command Handling

- Compiled apps (aka "fully resolved") can have commands run on them. Most commonly, `execute` and `validate`.
- That's set up in `core/src/tools/create-lambda-handler`.
- This is the interface by which tools can perform app-specific tasks.

### Z Object

- At runtime, a developer's `perform` function is invoked with the following signature: `perform(z, bundle)`.
- The `z` object is a collection of functions used commonly by developers and is defined in `core/src/tools/create-lambda-handler.js`
- Its functions are either Zapier-specific (such as `z.cursor` and `z.dehydrate`) or wrappers around common JS functionality (such as `z.JSON.parse` and `z.console.log`) with better error handling or extra logging
- Each of those functions has its own file in `core/src/tools`
- The most important method is probably `z.request` (from `core/src/tools/create-app-request-client.js`), which devs use to make external requests. This is different from normal http requests in a number of ways:
  - there are `beforeRequest` and `afterResponse` functions that run before and after the request. They can be declared by the developer or inserted automatically based on the authentication type.
  - all requests are logged to our internal logging service, even if a developer uses their own request library (see `core/src/tools/create-http-patch.js`)

### Tests

- Most files in `core/src` have a matching file in `core/test`
- there are test apps in `core/test/*app` directories
-
