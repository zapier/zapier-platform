## 0.9.10

* **BREAKING CHANGE** - the first `z.hydrate()` and `appTester()` argument has changed - you can no longer provide shorthand string paths. Instead, you must provide the direct reference and it must be found somewhere in your final exported `App`'s tree. For example:
  * `z.hydrate('someFunction')` must be `z.hydrate(App.hydrators.someFunction)`
  * `appTester('contact.list')` must be `appTester(App.resources.contact.list.operation.perform)`

## 0.9.9

Initial release to public. Read docs here https://github.com/zapier/zapier-platform-cli.
