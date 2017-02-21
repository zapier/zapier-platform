## 0.10.1

* Added `search` property for `inputFields`, to allow linking a search connector.

## 0.10.0

* **BREAKING CHANGE** Removed `getResourceOperation` in creates/searches in favor of `performGet`.

* Added support for `performList` in webhook triggers
* Fixed: Now correctly copy outputFields and samples to a trigger/search/create operation that links to a resource

## 0.9.10

* **BREAKING CHANGE** the first `z.dehydrate()` and `appTester()` argument has changed - you can no longer provide shorthand string paths. Instead, you must provide the direct reference and it must be found somewhere in your final exported `App`'s tree. For example:
  * `z.dehydrate('someFunction')` must be `z.dehydrate(App.hydrators.someFunction)`
  * `appTester('contact.list')` must be `appTester(App.resources.contact.list.operation.perform)`

## 0.9.9

Initial public release. Read docs: https://github.com/zapier/zapier-platform-cli.
