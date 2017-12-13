## 4.2.1

* (Fix) Repack zapier-platform-core to really fix bloated size

## 4.2.0

* (New) `zapier convert` now supports [input](https://github.com/zapier/zapier-platform-cli/pull/196) and [output custom fields](https://github.com/zapier/zapier-platform-cli/pull/199).
* (New) [Prettify `zapier convert` generated code.](https://github.com/zapier/zapier-platform-cli/pull/202)
* (Fix) [Fix bloated size of zapier-platform-core 4.1.0 package.](https://github.com/zapier/zapier-platform-core/pull/56)
* (Fix) [Fix typos in docs.](https://github.com/zapier/zapier-platform-cli/pull/197)
* (Doc) [Add 'Mocking Requests' section to docs.](https://github.com/zapier/zapier-platform-cli/pull/201)
* (Doc) [Mark step 'order' as deprecated.](https://github.com/zapier/zapier-platform-schema/pull/28)

## 4.1.0

* (New) `zapier convert` now supports [auth](https://github.com/zapier/zapier-platform-cli/pull/185) and [search](https://github.com/zapier/zapier-platform-cli/pull/186) scripting methods.
* (New) [Allow to migrate users by email.](https://github.com/zapier/zapier-platform-cli/pull/192)
* (New) [Accept changelog for app promotion.](https://github.com/zapier/zapier-platform-cli/pull/194)
* (Doc) [Add explanation about uppercased env vars.](https://github.com/zapier/zapier-platform-cli/pull/195)
* [Improve first promote message.](https://github.com/zapier/zapier-platform-cli/pull/191)

## 4.0.0

* (**BREAKING**) (Fix) [Encode form requests with + instead of %20 by default](https://github.com/zapier/zapier-platform-core/pull/52)
* (**BREAKING**) (Fix) [Don't add content-type if there's one](https://github.com/zapier/zapier-platform-core/pull/55)
* (Fix) [Replace _.truncate, save memory.](https://github.com/zapier/zapier-platform-core/pull/54)
* (Fix) [fix: exit code 1 for only for errors](https://github.com/zapier/zapier-platform-cli/pull/154)
* (Fix) [`zapier convert`: Escape special chars in field help text](https://github.com/zapier/zapier-platform-cli/pull/182)
* (Fix) [`zapier convert`: Normalize newlines in scripting ](https://github.com/zapier/zapier-platform-cli/pull/183)
* (New) [`zapier convert`: Generate create code based on different scripting method combinations](https://github.com/zapier/zapier-platform-cli/pull/181)
* (New) [`zapier convert`: Ignore _pre_poll and _post_poll if _poll exists ](https://github.com/zapier/zapier-platform-cli/pull/187)
* (New) [Customize update notification message](https://github.com/zapier/zapier-platform-cli/pull/188)
* (New) [Allow to include a regexp of paths for the build file](https://github.com/zapier/zapier-platform-cli/pull/158)
* (New) [Add example docs about computed fields.](https://github.com/zapier/zapier-platform-cli/pull/184)


## 3.3.0

* [Log http(s) requests for non-client library](https://github.com/zapier/zapier-platform-core/pull/51)
* Many improvements for `zapier convert`: [Copy noun](https://github.com/zapier/zapier-platform-cli/pull/159), [Copy display label](https://github.com/zapier/zapier-platform-cli/pull/160), [Copy description](https://github.com/zapier/zapier-platform-cli/pull/163), [Copy important and hidden props](https://github.com/zapier/zapier-platform-cli/pull/166), [Add more tests](https://github.com/zapier/zapier-platform-cli/pull/170), [Converting more auths](https://github.com/zapier/zapier-platform-cli/pull/167), [Allowing deasync in build](https://github.com/zapier/zapier-platform-cli/pull/169), [Converting scripting for triggers](https://github.com/zapier/zapier-platform-cli/pull/172), [Support for dynamic dropdowns and search-powered fields](https://github.com/zapier/zapier-platform-cli/pull/173), [Adding a command for integrations test](https://github.com/zapier/zapier-platform-cli/pull/175), [Add basic tests for triggers, creates, and searches](https://github.com/zapier/zapier-platform-cli/pull/178), [Remove empty help text](https://github.com/zapier/zapier-platform-cli/pull/179)
* [Skip style check on invalid apps](https://github.com/zapier/zapier-platform-cli/pull/168)
* [Add header to docs](https://github.com/zapier/zapier-platform-cli/pull/153)
* [Add option to `--grep` on `zapier test`](https://github.com/zapier/zapier-platform-cli/pull/177)

## 3.2.1

* [Fixes a problem with a sub-sub-dependency](https://github.com/zapier/zapier-platform-cli/issues/157).

## 3.2.0

* [Allow invitations per version](https://github.com/zapier/zapier-platform-cli/pull/150). Try `zapier help invite` for more details.
* [Added bundle.meta.zap.id for performSubscribe and performUnsubscribe](https://github.com/zapier/zapier-platform-cli/pull/149).
* [Allow modules to be objects in app definitions](https://github.com/zapier/zapier-platform-core/pull/48).
* [Use "application" discrete-type instead of "binary" as default content type.](https://github.com/zapier/zapier-platform-core/pull/49).
* [Use un-obfuscated data when logging to stdout](https://github.com/zapier/zapier-platform-core/pull/50).
* Improved/fixed sample and scaffolding code in docs.
* Fixed typos in docs.

## 3.1.0

* [Allow setting a `Content-Type` when stashing a file](https://github.com/zapier/zapier-platform-core/pull/47)
* [Increase dehydrator max payload size to 2 KB](https://github.com/zapier/zapier-platform-core/pull/46)

## 3.0.1

* Fixed node/npm dependency check for 3.x.
* Fixed URL base endpoint in docs.

## 3.0.0

* (**BREAKING**) `inputField`s will now start [throwing errors in Schema validation](https://github.com/zapier/zapier-platform-schema/pull/25) if there are mutually-exclusive fields.
* [Added subdomain field support to CLI apps](https://github.com/zapier/zapier-platform-schema/pull/26).
* [Allowed file stashing within a create/action](https://github.com/zapier/zapier-platform-core/pull/45).
* [Added style checks to `zapier build`](https://github.com/zapier/zapier-platform-cli/pull/130).
* Fixed [`zapier build` on Windows](https://github.com/zapier/zapier-platform-cli/pull/122).

## 2.2.0

* It's now possible to delete apps and app versions with [`zapier delete`](https://zapier.github.io/zapier-platform-cli/cli.html#delete)!
* You'll now get a warning when doing `zapier push` or `zapier upload` if your app's `zapier-platform-core` version is not up-to-date.
* It's now possible to skip validation when testing with [`zapier test --skip-validate`](https://zapier.github.io/zapier-platform-cli/cli.html#test)!
* Added docs around upgrading.
* Improved docs around authentication, migration, deprecation, and dehydration.
* Fixed `zapier logs --version=x.x.x` showing `zapier --version`.
* Improved error messages for [some schema validation errors](https://github.com/zapier/zapier-platform-schema/pull/24).
* Fixed Python error when a create, as part of a search or create, returned a list with one item ([errors sooner, in core now, with a nicer message](https://github.com/zapier/zapier-platform-core/pull/44)).
* [Objects received via Hook triggers no longer require an `id`, and checks were improved](https://github.com/zapier/zapier-platform-core/pull/43).
* Minor misc fixes.

## 2.1.0

* [Connection Label is now available](https://zapier.github.io/zapier-platform-schema/build/schema.html#authenticationschema) (`connectionLabel: '{{bundle.inputData.email}}'` inside `authentication`)
* [Locking is now available for `create`](https://zapier.github.io/zapier-platform-schema/build/schema.html#createschema) (`shouldLock: true` inside `.operation`)
* Fix typos in docs

## 2.0.1

* Fix broken appTester on Windows OS.
* Require the exact version of zapier-platform-core in package.json.
* Document middleware's z object lacks z.request.
* Fix typo in session auth docs.


## 2.0.0

* (**BREAKING**) CLI 2.x apps run only on NodeJS `v6.10.2` in AWS Lambda. If you need to run on NodeJS `v4.3.2`, use the CLI 1.x release.
* (**BREAKING**) Delete property `searchOrCreate` from the properties of ResourceSchema.
* Style checks run by default during `zapier validate`.
* Validation is run during `zapier test`.
* The CLI now uses update-notifier to let you know when there's a new version available.
* Rename `global` to `public` for consistency across Zapier platform.


## 1.0.11

* `zapier --validate` now includes the `--include-style` flag to validate against [style checks](https://zapier.com/developer/documentation/v2/style-checks-reference/).
* There are extra checks around return types from triggers, searches, and creates.
* Some doc typos were squashed.

## 1.0.10

* Added new Files example app with `zapier init . --template=files`.
* Properly exit on node version mismatch while running `zapier test`.
* Upgraded `node-fetch` in `core` (fixes some edge-case issues for `multipart/form-data` requests).
* `zapier test` is now quiet by default. `zapier test --debug` will output details.
* `zapier logs --type=http --detailed` is more clearly exposed.
* Fixes `searchOrCreate` schema validation error for resources with `search` and `create`.

## 1.0.9

* Functions in `app.afterResponse` will now get called.
* Add check in middleware, to make sure creates return only 1 object.
* Fixes issue for deep object checking.
* Minor docs fixes.

## 1.0.8

* `z.stashFile` is no longer allowed outside of `hydrators`.
* Adding analytics to the web-based documentation.
* Minor docs fixes.

## 1.0.7

* Improved `link` command UX on error/non-existing apps.

## 1.0.6

* Fixed `convert` command for `outputFields`.
* Improvements on `validate-templates` and `zapier test` (now supports `--timeout=5000`).
* Minor docs fixes.

## 1.0.5

* Use `ZAPIER_BASE_ENDPOINT` for `push` and `convert`.
* Don't show command help on error.
* Minor docs fixes.

## 1.0.4

* Fix issues in Windows.
* Minor docs fixes.

## 1.0.3

* Fixes fatal error when `build` directory didn't exist.
* Minor docs fixes.

## 1.0.2

* Support streamed non-ascii files in `z.stashFile`.
* Minor docs fixes.

## 1.0.1

* Minor docs fixes.

## 1.0.0

* Removing beta "label".
* Minor docs fixes.

## 0.10.2

* Added `dict` property for `inputFields`, to allow asking for a dictionary (key/value pair) input.
* Added new REST Hooks example app with `zapier init . --template=rest-hooks`.
* Fixed: Now correctly ask for line items when `children` is set.

## 0.10.1

* Added `search` property for `inputFields`, to allow linking a search connector.

## 0.10.0

* **BREAKING CHANGE** Removed `getResourceOperation` in creates/searches in favor of `performGet`.

* Added support for `performList` in webhook triggers
* Fixed: Now correctly copy outputFields and samples to a trigger/search/create operation that links to a resource

## 0.9.12

* Added `performList` to hook operations.

## 0.9.10

* Documentation expanded:
  * Updated `z.dehydrate()` / `appTester()` / examples to reflect the new arguments.
    * `z.dehydrate('someFunction')` must be `z.dehydrate(App.hydrators.someFunction)`
    * `appTester('contact.list')` must be `appTester(App.resources.contact.list.operation.perform)`
  * Documented fields, custom/dynamic fields, and dynamic dropdowns plus examples.
  * `zapier env ... -remove` flag documented.
* `zapier describe` now describes much more about the app - included auth info, redirect_uri, resources and all resource paths.
* fixed `zapier scaffold` bug with undefined `INPUT_FIELDS`

## 0.9.9

Initial release to public. Read docs here https://github.com/zapier/zapier-platform-cli.
