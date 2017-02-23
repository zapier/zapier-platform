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

* **BREAKING CHANGE** the first `z.dehydrate()` and `appTester()` argument has changed - you can no longer provide shorthand string paths. Instead, you must provide the direct reference and it must be found somewhere in your final exported `App`'s tree. For example:
  * `z.dehydrate('someFunction')` must be `z.dehydrate(App.hydrators.someFunction)`
  * `appTester('contact.list')` must be `appTester(App.resources.contact.list.operation.perform)`

## 0.9.9

Initial public release. Read docs: https://github.com/zapier/zapier-platform-cli.
