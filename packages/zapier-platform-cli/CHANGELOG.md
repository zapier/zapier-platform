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
