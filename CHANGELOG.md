## 12.2.1

_released `2023-01-18`_

### cli

- :scroll: Improve docs about input field types ([#585](https://github.com/zapier/zapier-platform/pull/585))
- :scroll: Improve docs about OAuth2 fields ([#589](https://github.com/zapier/zapier-platform/pull/589))
- :scroll: More strongly recommend use of `z.dehydrateFile` for files ([#590](https://github.com/zapier/zapier-platform/pull/590))
- :scroll: Update logging info ([#591](https://github.com/zapier/zapier-platform/pull/591))
- :scroll: Fix `zapier init` command ([#594](https://github.com/zapier/zapier-platform/pull/594))
- :scroll: Fix typo ([#593](https://github.com/zapier/zapier-platform/pull/593))
- :scroll: Fix logo ([#604](https://github.com/zapier/zapier-platform/pull/604))
- :hammer: Dependency updates
  - Bump typescript from 3.8.3 to 4.9.4 to fix a test ([#599](https://github.com/zapier/zapier-platform/pull/599))
  - Bump decode-uri-component from 0.2.0 to 0.2.2 ([#596](https://github.com/zapier/zapier-platform/pull/596))
  - Bump json5 from 1.0.1 to 1.0.2 ([#601](https://github.com/zapier/zapier-platform/pull/601))

### core

- None!

### schema

- :test_tube: Relax schema on `searchUniqueInputToOutput` for upsert to support dynamic fields. **EXPERIMENTAL: Currently an internal feature. Don't use it yet.** ([#602](https://github.com/zapier/zapier-platform/pull/602))

### misc

- :hammer: Dependency updates
  - Bump qs from 6.5.2 to 6.5.3 ([#598](https://github.com/zapier/zapier-platform/pull/598))

## 12.2.0

_release `2022-10-27`_

### cli

- :nail_care: Now you don't have to install zapier-platform-core to run [most of the commands](https://github.com/zapier/zapier-platform/pull/579#pullrequestreview-1145066736) ([#579](https://github.com/zapier/zapier-platform/pull/579))

### core

- :hammer: Dependency updates
  - Bump secret-scrubber from 1.0.3 to 1.0.7 ([#583](https://github.com/zapier/zapier-platform/pull/583))

### schema

- :test_tube: "Upsert" feature: Now a [search-or-create](https://github.com/zapier/zapier-platform/blob/zapier-platform-schema@12.2.0/packages/schema/docs/build/schema.md#searchorcreateschema) can include an `update` action that Zapier should call to update an existing object. **EXPERIMENTAL: This is currently an internal feature and subject to change. Don't use it yet.** ([#584](https://github.com/zapier/zapier-platform/pull/584))
- :scroll: Clarify how fields accept `file` types ([#582](https://github.com/zapier/zapier-platform/pull/582))

## 12.1.0

_released `2022-09-29`_

We rolled out a change to "migrate-by-email" on 2022-09-28. Now `zapier migrate --user` in CLI and "migrate-by-email" on UI only migrate Zaps that are **private to the user**. This change affects UI and all the CLI versions, not just 12.1.0. The old behavior was to migrate all the user's team members, which was inconsistent with the docs and often caused confusion. So we consider this change a bug fix instead of a breaking change. If you want the old behavior, use `zapier migrate --account`.

### cli

- :nail_care: Add `--account` flag to `migrate` command ([#574](https://github.com/zapier/zapier-platform/pull/574))
- :nail_care: Add `--yes` flag to `promote` command to suppress interactive prompts by assuming "yes" to all prompts ([#576](https://github.com/zapier/zapier-platform/pull/576))
- :nail_care: Print validation warnings at `build` time ([#573](https://github.com/zapier/zapier-platform/pull/573))
- :scroll: Update Zapier logo in docs ([#567](https://github.com/zapier/zapier-platform/pull/567))
- :scroll: Provide additional information about the connection label in docs ([#564](https://github.com/zapier/zapier-platform/pull/564))
- :hammer: Dependency updates
  - Bump shell-quote from 1.7.2 to 1.7.3 ([#560](https://github.com/zapier/zapier-platform/pull/560))

### core

- :bug: Fix another hanging issue by aborting logger connection early ([#562](https://github.com/zapier/zapier-platform/pull/562))

### schema

- None!

## 12.0.3

_released `2022-05-02`_

### cli

<!-- this is included in this release, but isn't quite ready on the server side. We'll "release" this in a semver.minor sometime soon -->
<!-- - :nails: add support for limited collaborators to the `team:get`, `team:add`, and `team:remove` commands. More info about this new role will be coming soon ([#538](https://github.com/zapier/zapier-platform/pull/538), [#541](https://github.com/zapier/zapier-platform/pull/541), [#539](https://github.com/zapier/zapier-platform/pull/539), [#540](https://github.com/zapier/zapier-platform/pull/540)) -->

- None!

### core

- :bug: greatly improve secret-scrubbing speed in logger ([#542](https://github.com/zapier/zapier-platform/pull/542))
- :bug: ensure string content is parsed pre-logging in case it contains secrets ([#525](https://github.com/zapier/zapier-platform/pull/525))
- :bug: censor novel secrets in querystring ([#526](https://github.com/zapier/zapier-platform/pull/526))

### schema

- None!

## 12.0.2

_released `2022-03-30`_

### cli

- None

### core

- :bug: Fix regression where consecutive successful curly replacements wouldn't happen correctly ([#522](https://github.com/zapier/zapier-platform/pull/522))

### schema

- None!

## 12.0.1

_released `2022-03-24`_

### cli

- None

### core

- :bug: Fix regression where the global `skipThrowForStatus` incorrectly applied to shorthand requests. It's only intended to modify the behavior of requests made with `z.request()`. The docs and changelog have been updated accordingly ([#520](https://github.com/zapier/zapier-platform/pull/520))

### schema

- None!

## 12.0.0

_released `2022-03-23`_

We're breaking slightly from our pattern of a single yearly major release. The `12.0.0` release contains some backwards-incompatible changes to how middleware and auth refreshes work. For the most part, you'll be able to upgrade to this version safely, but as always, it's worth re-running unit tests (especially those related to authentication).

In the coming months, we'll follow up with a `13.0.0` release that will bump the Node.js runtime and dependencies (ending support for Node.js 12 as it reaches End of Life). We're hoping that by separating these releases, the upgrade process will be easier for developers (only worrying about the public API or the runtime, but not both).

### cli

- None!

### core

- :exclamation: calling `response.throwForStatus()` now **always** throws an error if the response status code is `>= 400`. Previously it was a no-op when `response.skipThrowForStatus` was `true`. Now, that flag only controls whether Zapier's built-in middleware calls `throwForStatus()`. This only affects you if you set `skipThrowForStatus` and always call `.throwForStatus()`, expecting it not to error. ([#511](https://github.com/zapier/zapier-platform/pull/511))
- :exclamation: re-add the built-in auto-refresh middleware for `oauth2` and `session` auths. This runs _before_ your declared `afterResponse`, so you no longer have to account for stale credentials in your middleware (unless you want to). See [the README](https://github.com/zapier/zapier-platform/blob/master/packages/cli/README.md#using-http-middleware) for more info. ([#512](https://github.com/zapier/zapier-platform/pull/512), [#517](https://github.com/zapier/zapier-platform/pull/517))

### schema

- :nail_care: add app-wide skipThrowForStatus flag. This is helpful for backwards compatibility when migrating from `9.x` to `12.x`, but probably won't be relevant for most developers. Note that this flag **only affects requests made with `z.request()`** ([#511](https://github.com/zapier/zapier-platform/pull/511))

## 11.3.3

_released `2022-03-21`_

### cli

- :scroll: Update [README.md](README.md) and add [CONTRIBUTING.md](CONTRIBUTING.md) ([#506](https://github.com/zapier/zapier-platform/pull/506))

### core

- :bug: Fix another hanging issue where an action could be invoked multiple times ([#513](https://github.com/zapier/zapier-platform/pull/513))

### schema

- None!

## 11.3.2

_released `2022-03-01`_

### cli

- None!

### core

- :nail_care: `z.request()` now accepts `skipEncodingChars` option to skip percent-encoding specific characters ([#497](https://github.com/zapier/zapier-platform/pull/497))

### schema

- :nail_care: Add `skipEncodingChars` to `RequestSchema` ([#497](https://github.com/zapier/zapier-platform/pull/497))

### misc

- :hammer: Improve build script ([#496](https://github.com/zapier/zapier-platform/pull/496))

## 11.3.1

_released `2022-02-23`_

### cli

- :hammer: Bump node-fetch to 2.6.7 ([#493](https://github.com/zapier/zapier-platform/pull/493))

### core

- :bug: Fix hanging issue where an action could be invoked multiple times ([#490](https://github.com/zapier/zapier-platform/pull/490))
- :hammer: Bump node-fetch to 2.6.7 ([#493](https://github.com/zapier/zapier-platform/pull/493))

### schema

- :hammer: Bump node-fetch to 2.6.7 ([#493](https://github.com/zapier/zapier-platform/pull/493))

## 11.3.0

_released `2022-02-14`_

### cli

- :tada: New command: `jobs`. Now you can use `zapier jobs` to check `promote` and `migrate` progress! ([#484](https://github.com/zapier/zapier-platform/pull/484))
- :tada: Add support for pnpm package manager in `test` command ([#476](https://github.com/zapier/zapier-platform/pull/476))
- :bug: Fix byte missing issue with `files` example ([#465](https://github.com/zapier/zapier-platform/pull/465))
- :nail_care: Update `promote` and `migrate` to use new endpoint ([#480](https://github.com/zapier/zapier-platform/pull/480))
- :scroll: Clarify on OAuth2 refresh details ([#482](https://github.com/zapier/zapier-platform/pull/482))
- :hammer: Dependency updates
  - Bump shelljs from 0.8.4 to 0.8.5 ([#473](https://github.com/zapier/zapier-platform/pull/473))
  - Bump marked from 2.0.3 to 4.0.10 ([#471](https://github.com/zapier/zapier-platform/pull/471))
  - Bump cached-path-relative from 1.0.2 to 1.1.0 ([#477](https://github.com/zapier/zapier-platform/pull/477))

### core

- :bug: Fix `value.replace is not a function` error when resolving missing curlies ([#468](https://github.com/zapier/zapier-platform/pull/468))
- :bug: Handle case where `legacy.scriptingSource` is an empty string ([#475](https://github.com/zapier/zapier-platform/pull/475))
- :nail_care: Improve `z.console.log` and HTTP logging performance ([#469](https://github.com/zapier/zapier-platform/pull/469))

### schema

- None!

### misc

- :hammer: Bump trim-off-newlines from 1.0.1 to 1.0.3 ([#474](https://github.com/zapier/zapier-platform/pull/474))

## 11.2.0

_released `2021-12-03`_

### cli

- :scroll: Fix typos in docs ([#431](https://github.com/zapier/zapier-platform/pull/431))

### core

- :bug: Fix backpressure issue when piping request bodies ([#461](https://github.com/zapier/zapier-platform/pull/461))
- Rewrite `z.stashFile()` with various improvements and bugfixes ([#454](https://github.com/zapier/zapier-platform/pull/454))
  - :nail_care: `knownLength` is no longer required for any kinds of streams, including `z.request({ url, raw: true })` and `fs.createReadStream()`
  - :nail_care: Detect file types more smartly
  - :nail_care: Generate filenames more smartly
  - :nail_care: Improve performance by making concurrent requests
  - :bug: Fix `MalformedPOSTRequest` error when the reponse is gzipped and has a smaller `Content-Length`
  - :hammer: Better test coverage
  - See [#454](https://github.com/zapier/zapier-platform/pull/454) for more details
- :nail_care: Allow apps to pass along throttled errors ([#408](https://github.com/zapier/zapier-platform/pull/408))

### schema

- :tada: Add support for hook-to-poll triggers ([#432](https://github.com/zapier/zapier-platform/pull/432))
- :nail_care: Allow spaces and square brackets in [`RefResourceSchema`](https://github.com/zapier/zapier-platform/blob/zapier-platform-schema@11.2.0/packages/schema/docs/build/schema.md) ([#455](https://github.com/zapier/zapier-platform/pull/455))
- :nail_care: Add `code` type for `inputField`s ([#439](https://github.com/zapier/zapier-platform/pull/439))

### misc

- :hammer: Bump node-fetch to 2.6.6 ([#459](https://github.com/zapier/zapier-platform/pull/459))
- :hammer: Move CI from Travis to GitHub Actions ([#454](https://github.com/zapier/zapier-platform/pull/454))

## 11.1.1

_released `2021-09-24`_

### cli

- none!

### core

- :bug: Improve performance of large requests ([#428](https://github.com/zapier/zapier-platform/pull/428)),
- :bug: Handle nullish values in auth data ([#427](https://github.com/zapier/zapier-platform/pull/427)),

### schema

- none!

## 11.1.0

_released `2021-08-05`_

### cli

- :bug: `convert` command should always generate async functions ([#397](https://github.com/zapier/zapier-platform/pull/397))
- :bug: `init` command - fix typos in `session-auth` template ([#388](https://github.com/zapier/zapier-platform/pull/388))
- :scroll: Add info about header format in `bundle.rawRequest` ([#401](https://github.com/zapier/zapier-platform/pull/401))
- :scroll: An `afterResponse` middleware should return a response ([#383](https://github.com/zapier/zapier-platform/pull/383))

### core

- :tada: Allow using `await` in inline function source ([#396](https://github.com/zapier/zapier-platform/pull/396))
- :bug: Make sure all requests are logged ([#387](https://github.com/zapier/zapier-platform/pull/387))
- :nail_care: Update app tester to support hook with `canPaginate` for `performList` ([#402](https://github.com/zapier/zapier-platform/pull/402))
- :nail_care: Add `bundle.meta.isBulkRead` TypeScript type ([#400](https://github.com/zapier/zapier-platform/pull/400))
- :nail_care: Allow app tester to run ad-hoc functions ([#385](https://github.com/zapier/zapier-platform/pull/385))
- :hammer: Incorporate secret-scrubber package ([#393](https://github.com/zapier/zapier-platform/pull/393))

### schema

- :nail_care: Add `canPaginate` to `BasicHookOperationSchema` ([#399](https://github.com/zapier/zapier-platform/pull/399))

### misc

- Dependency updates:
  - :hammer: Bump set-getter from 0.1.0 to 0.1.1 ([#389](https://github.com/zapier/zapier-platform/pull/389))
  - :hammer: Bump glob-parent from 5.1.0 to 5.1.2 ([#386](https://github.com/zapier/zapier-platform/pull/386))
  - :hammer: Bump tar from 4.4.13 to 4.4.15 ([#406](https://github.com/zapier/zapier-platform/pull/406))

## 11.0.1

_released `2021-05-28`_

### cli

- :bug: Handle missing versions better in env command ([#374](https://github.com/zapier/zapier-platform/pull/374))
- :scroll: Fix incorrect snippet ([#378](https://github.com/zapier/zapier-platform/pull/378))
- :scroll: Update historical releases section to include v10 ([#377](https://github.com/zapier/zapier-platform/pull/377))

### core

- None!

### schema

- :bug: skip checking keys on fields without the `key` property (fixes [zapier-platform#375](https://github.com/zapier/zapier-platform/pull/375) via [#376](https://github.com/zapier/zapier-platform/pull/376))

## 11.0.0

_released `2021-05-12`_

Another spring, another `SEMVER-MAJOR` release of the Zapier CLI tools. Now that Node.js 10 has reached its scheduled end of life, version 12 is the minimum supported version for each of these packages locally.

Additionally, any integrations that depend on `zapier-platform-core@11.0.0` will run on Node.js 14. Node versions are typically fairly compatible, but it's worth double-checking your unit tests during this upgrade (as always).

Read on for a detailed set of release notes, paying special attention to any :exclamation: BREAKING CHANGEs.

### cli

- :exclamation: Remove the `-g | --grep` and `-t | --timeout` flags from `zapier test` ([#348](https://github.com/zapier/zapier-platform/pull/348)). You can now pass flags directly to your `test` script by adding `--` before them. To migrate existing scripts:
  - Add `--` before any existing `grep` and `timeout` flags
  - `zapier test -g 'cool' --timeout 5000` :arrow_right: `zapier test -- -g 'cool' --timeout 5000`

### core

- :exclamation: Run apps using Node.js v14.x ([#350](https://github.com/zapier/zapier-platform/pull/350))
- :bug: Checks should properly handle possibly null values ([#371](https://github.com/zapier/zapier-platform/pull/371))
- :bug: StashFile no longer throws 'source.on' error when a request that uses await is passed in ([#361](https://github.com/zapier/zapier-platform/pull/361))
- :bug: Handle stashing files in resource create methods ([#349](https://github.com/zapier/zapier-platform/pull/349))
- :hammer: Typescript target es2019 for node 12 ([#358](https://github.com/zapier/zapier-platform/pull/358))
- :hammer: Typescript type of `inputData` for hydration function should be of type T as well ([#357](https://github.com/zapier/zapier-platform/pull/357))
- :scroll: Fix typo in authentication.js ([#356](https://github.com/zapier/zapier-platform/pull/356))

### schema

- :exclamation: add validation to ensure globally unique input fields ([#347](https://github.com/zapier/zapier-platform/pull/347)).
  - Your integration's input fields wouldn't have worked correctly if they didn't comply with this check, but now we're more explicit about it
  - No action should be needed for migration

### misc

- Many under-the-hood dependency updates:
  - :hammer: update deps ([#351](https://github.com/zapier/zapier-platform/pull/351), [#372](https://github.com/zapier/zapier-platform/pull/372))
  - :hammer: Bump hosted-git-info from 2.8.5 to 2.8.9 ([#370](https://github.com/zapier/zapier-platform/pull/370))
  - :hammer: bump handlebars from 4.7.6 to 4.7.7 ([#369](https://github.com/zapier/zapier-platform/pull/369))
  - :hammer: Bump elliptic from 6.5.3 to 6.5.4 (PDE-2085) ([#343](https://github.com/zapier/zapier-platform/pull/343))
  - :hammer: Update repo urls ([#339](https://github.com/zapier/zapier-platform/pull/339))

## 10.2.0

_released `2021-02-23`_

### cli

- :scroll: add architecture files ([#324](https://github.com/zapier/zapier-platform/pull/324))
- :scroll: fix typos in README ([#328](https://github.com/zapier/zapier-platform/pull/328))
- :scroll: Make file stashing snippets copy-paste-able ([#326](https://github.com/zapier/zapier-platform/pull/326))
- :scroll: Fix broken README schema package link ([#325](https://github.com/zapier/zapier-platform/pull/325))
- :bug: ensure test files can be run out of the box with jest ([#327](https://github.com/zapier/zapier-platform/pull/327))

### core

None!

### schema

- :nail_care: Add ability to specify "code" param to OAuth2 schema ([#333](https://github.com/zapier/zapier-platform/pull/333))

## 10.1.3

_released `2021-02-09`_

### cli

- :bug: Fix phrasing in `link` command ([#316](https://github.com/zapier/zapier-platform/pull/316))
- :nail_care: Add warning if user counts are still being calculated ([#308](https://github.com/zapier/zapier-platform/pull/308))
- :scroll: Mention `subscribeData` is available in `perform` ([#300](https://github.com/zapier/zapier-platform/pull/300))
- :scroll: Add debugging info ([#318](https://github.com/zapier/zapier-platform/pull/318))
- :scroll: Update readiness of UI → CLI conversion tool ([#307](https://github.com/zapier/zapier-platform/pull/307), [#311](https://github.com/zapier/zapier-platform/pull/311))
- :scroll: Add details about when dynamic fields are loaded ([#303](https://github.com/zapier/zapier-platform/pull/303))
- :scroll: Change 90-day limit for callbacks to 30-day ([#293](https://github.com/zapier/zapier-platform/pull/293))
- :scroll: Fix typos in examples ([#296](https://github.com/zapier/zapier-platform/pull/296), [#297](https://github.com/zapier/zapier-platform/pull/297))

### core

- :bug: `ResponseError` no longer fails when request is `raw` ([#320](https://github.com/zapier/zapier-platform/pull/320))
- :bug: Redirecting from `https` to `http` breaks when disabling SSL certificate checks ([#313](https://github.com/zapier/zapier-platform/pull/313))
- :hammer: Log `trigger_subscription_id` field ([#317](https://github.com/zapier/zapier-platform/pull/317))

### schema

- :scroll: Add reasons to anti-examples, update README, rearrange schema layout ([#287](https://github.com/zapier/zapier-platform/pull/287))

## 10.1.2

_released `2020-10-30`_

This release mostly has internal features, but also ships a lot of documentation updates and a few bumped dependencies.

### cli

- :nail_care: Improve logging for diagnostic info ([#282](https://github.com/zapier/zapier-platform/pull/282))
- :scroll: Document the `$HOIST$` directive ([#273](https://github.com/zapier/zapier-platform/pull/273))
- :scroll: Update outdated command references ([#274](https://github.com/zapier/zapier-platform/pull/274))
- :scroll: Add docs for `callback_url` ([#278](https://github.com/zapier/zapier-platform/pull/278))
- :hammer: Add new example app, `callbacks` ([#281](https://github.com/zapier/zapier-platform/pull/281))
- :scroll: Replace Slack link with one for Community ([#286](https://github.com/zapier/zapier-platform/pull/286))

### core

- :bug: Add `callback_url` during testing ([#280](https://github.com/zapier/zapier-platform/pull/280))
- :nail_care: Relax type info for `response.json` to better match the actual TS definition ([#261](https://github.com/zapier/zapier-platform/pull/261))

### schema

None!

## 10.1.1

_released `2020-09-02`_

### cli

- :bug: `_zapier-build` should be optional ([#265](https://github.com/zapier/zapier-platform/pull/265))

### core

- :bug: Don't censor safe URLs in logs ([#266](https://github.com/zapier/zapier-platform/pull/266))

### schema

None!

## 10.1.0

_released `2020-08-30`_

### cli

- :nail_care: `build` command now accepts a custom build hook named `_zapier-build`. See [Using Transpilers](https://github.com/zapier/zapier-platform/blob/35072e38ee14f5dfaa2e4c6791e270f0257a2a2d/packages/cli/README.md#using-transpilers) for details. ([#262](https://github.com/zapier/zapier-platform/pull/262))

### core

- :scroll: Remove legacy reference to `bundle.meta.zap` ([#255](https://github.com/zapier/zapier-platform/pull/255))
- :hammer: Increase max payload size for hydration ([#257](https://github.com/zapier/zapier-platform/pull/257))

### schema

- None!

## 10.0.1

_released `2020-07-20`_

### cli

- :bug: `convert` command now doesn't crash over an auth field name with special chars ([#241](https://github.com/zapier/zapier-platform/pull/241))
- :bug: Fix missing `deasync` Node.js 10 binding ([#244](https://github.com/zapier/zapier-platform/pull/244))
- :bug: Fix broken `oauth1-trello` project template ([#246](https://github.com/zapier/zapier-platform/pull/246))
- :nail_care: Update `oauth2` and `session-auth` project templates to reflect v10's recommended way to handle auth refresh ([#246](https://github.com/zapier/zapier-platform/pull/246))
- :scroll: Fix missing `init` command in CLI reference ([#243](https://github.com/zapier/zapier-platform/pull/243))
- :hammer: Bump Lodash from 4.17.15 to 4.17.19 ([#248](https://github.com/zapier/zapier-platform/pull/248))

### core

- :bug: Allow resource list methods to use cursors ([#247](https://github.com/zapier/zapier-platform/pull/247))
- :nail_care: Improve types for `z.dehydrateFile` and `z.stashFile` ([#240](https://github.com/zapier/zapier-platform/pull/240))
- :scroll: Clarify v10 breaking change on auth refresh ([#246](https://github.com/zapier/zapier-platform/pull/246))
- :hammer: Bump Lodash from 4.17.15 to 4.17.19 ([#248](https://github.com/zapier/zapier-platform/pull/248))

### schema

- :hammer: Bump Lodash from 4.17.15 to 4.17.19 ([#248](https://github.com/zapier/zapier-platform/pull/248))

## 10.0.0

_released `2020-05-20`_

Another major release! We have some great improvements in this version but also have breaking changes. Please review the following to see if you need to change anything to upgrade `zapier-platform-core` to v10.

(a) Zapier integrations that depend on the new Core v10 **will run using Node.js 12**. To upgrade, first you need install Node 12 if you haven't. You can install Node 12 using `nvm`. Second, update your `package.json` to depend on `zapier-platform-core@10.0.0`. Third, run `npm install`. Finally, you may want to run unit tests on Node 12 before you push your code to production for further testing.

(b) **`z.request` now always calls `response.throwForStatus`** via a middleware by default. You no longer need to call `response.throwForStatus` after `z.request`, the built-in middleware will do that for you. See [Error Response Handling](https://github.com/zapier/zapier-platform/blob/master/packages/cli/README.md#error-response-handling) for details.

(c) **`response.throwForStatus` now only throws an error if the status code is between 400 and 600 (inclusive)**. Before v10, it threw for status >= 300. So if your code rely on that old behavior, you should change your code to check `response.status` explicitly instead of using `response.throwForStatus`.

(d) **Session and OAuth2 refresh now happens AFTER your `afterResponse`**. Before v10, the refresh happens before your `afterResponse`. This is a breaking change if your `afterResponse` captures 401 response status. See [v10 Breaking Change: Auth Refresh](https://github.com/zapier/zapier-platform/blob/master/packages/cli/README.md#v10-breaking-change-auth-refresh) for details.

(e) We now **parse JSON and form-encoded response body by default**. So no more `z.JSON.parse(response.content)`! The parsed object is available as `response.data` (`response.json` will be still available for JSON body but less preferable). Before v10, we only parsed JSON for [manual requests](https://github.com/zapier/zapier-platform/blob/master/packages/cli/README.md#manual-http-requests); parsed JSON and form-encoded body for [shorthand requests](https://github.com/zapier/zapier-platform/blob/master/packages/cli/README.md#shorthand-http-requests). This change could be breaking if you have an `afterResponse` that modifies `response.content`, with the expectation for shorthand requests to pick up on that. In which case, you'll have to replace `response.content = JSON.stringify(parsedOrTransformed)` with `response.data = parsedOrTransformed`.

(f) We rewrote the CLI `zapier init` command. Now the project templates are more up-to-date, with better coding practices. However, **we've removed the following templates**: `babel`, `create`, `github`, `middleware`, `oauth1-tumblr`, `oauth1-twitter`, `onedrive`, `resource`, `rest-hooks`, `trigger`. For trigger/create/search, use `zapier scaffold` command instead. For `babel`, look at `typescript` template and replace the build step with the similar code from https://babeljs.io/setup#installation. For `oauth1`, we now only keep `oauth1-trello` for simplicity. If you ever need to look at the old templates, they're always available in the [example-apps](https://github.com/zapier/zapier-platform/tree/60eaabd04571df30a3c33e4ab5ec4fe0312ad701/example-apps) directory in the repo.

(g) `zapier init` no longer uses the `minimal` template by default. If you don't specify `--template`, **`zapier init` will prompt you interactively**. So if you're using `zapier init` (without any arguments) in CI and expect it to use `minimal` by default, you should replace the command with `zapier init -t minimal`.

See below for a detailed changelog (**:exclamation: denotes a breaking change**):

### cli

- :exclamation: We've improved and removed some templates from `init` command, see (e) above for a list of templates that were removed ([#206](https://github.com/zapier/zapier-platform/pull/206))
- :nail_care: `build` command no longer needs login ([#216](https://github.com/zapier/zapier-platform/pull/216))
- :nail_care: `promote` command becomes more receptive about the changelog format ([#209](https://github.com/zapier/zapier-platform/pull/209))
- :nail_care: Regenerate [example apps](https://github.com/zapier/zapier-platform/tree/60eaabd04571df30a3c33e4ab5ec4fe0312ad701/example-apps) using the new `init` command ([#229](https://github.com/zapier/zapier-platform/pull/229))
- :scroll: Update and clean up docs ([#222](https://github.com/zapier/zapier-platform/pull/222))
- :scroll: Add some clarity around what we're sending for analytics ([#215](https://github.com/zapier/zapier-platform/pull/215))
- :hammer: Mass dependency update and linting ([#218](https://github.com/zapier/zapier-platform/pull/218), [#220](https://github.com/zapier/zapier-platform/pull/220))

### core

- :exclamation: Integrations now run on Node.js 12!
- :exclamation: `z.request` now always calls `response.throwForStatus` via a middleware by default ([#210](https://github.com/zapier/zapier-platform/pull/210))
- :exclamation: Session and OAuth2 refresh now happens AFTER your `afterResponse` ([#210](https://github.com/zapier/zapier-platform/pull/210))
- :exclamation: `response.throwForStatus` now only throws for 400 ≤ status ≤ 600 ([#192](https://github.com/zapier/zapier-platform/pull/192))
- :exclamation: Introduce `response.data` with support for form-urlencoded and custom parsing ([#211](https://github.com/zapier/zapier-platform/pull/211))
- :bug: Don't log request body when it's streaming data ([#214](https://github.com/zapier/zapier-platform/pull/214))
- :bug: `z.request`'s `allowGetBody` option shouldn't send empty body ([#227](https://github.com/zapier/zapier-platform/pull/227))
- :hammer: Mass dependency update and linting ([#218](https://github.com/zapier/zapier-platform/pull/218), [#220](https://github.com/zapier/zapier-platform/pull/220))

### schema

- :hammer: Mass dependency update and linting ([#218](https://github.com/zapier/zapier-platform/pull/218), [#220](https://github.com/zapier/zapier-platform/pull/220))

## 9.7.3

_released `2022-03-21`_

### cli

- None!

### core

- :bug: Fix another hanging issue where an action could be invoked multiple times ([#514](https://github.com/zapier/zapier-platform/pull/514))

### schema

- None!

## 9.7.2

_released `2022-03-01`_

### cli

- None!

### core

- :nail_care: `z.request()` now accepts `skipEncodingChars` option to skip percent-encoding specific characters ([#499](https://github.com/zapier/zapier-platform/pull/499))

### schema

- :nail_care: Add `skipEncodingChars` to `RequestSchema` ([#499](https://github.com/zapier/zapier-platform/pull/499))

### misc

- :hammer: Improve build script ([#500](https://github.com/zapier/zapier-platform/pull/500))

## 9.7.1

_released `2022-02-23`_

### cli

- :hammer: Bump node-fetch to 2.6.7 ([#492](https://github.com/zapier/zapier-platform/pull/492))

### core

- :bug: Fix hanging issue where an action could be invoked multiple times ([#491](https://github.com/zapier/zapier-platform/pull/491))
- :hammer: Bump node-fetch to 2.6.7 ([#492](https://github.com/zapier/zapier-platform/pull/492))

### schema

- :hammer: Bump node-fetch to 2.6.7 ([#492](https://github.com/zapier/zapier-platform/pull/492))

## 9.7.0

_released `2022-02-14`_

### cli

- None!

### core

- :bug: Fix `value.replace is not a function` error when resolving missing curlies ([#467](https://github.com/zapier/zapier-platform/pull/467))
- :bug: Handle case where `legacy.scriptingSource` is an empty string ([#478](https://github.com/zapier/zapier-platform/pull/478))
- :nail_care: Improve `z.console.log` and HTTP logging performance ([#483](https://github.com/zapier/zapier-platform/pull/483))

### schema

- None!

## 9.6.0

_released `2021-12-03`_

### cli

- None!

### core

- :bug: Fix backpressure issue when piping request bodies ([#462](https://github.com/zapier/zapier-platform/pull/462))
- Rewrite `z.stashFile()` with various improvements and bugfixes ([#453](https://github.com/zapier/zapier-platform/pull/453))
  - :nail_care: `knownLength` is no longer required for any kinds of streams, including `z.request({ url, raw: true })` and `fs.createReadStream()`
  - :nail_care: Detect file types more smartly
  - :nail_care: Generate filenames more smartly
  - :nail_care: Improve performance by making concurrent requests
  - :bug: Fix `MalformedPOSTRequest` error when the reponse is gzipped and has a smaller `Content-Length`
  - :hammer: Better test coverage
  - See [#453](https://github.com/zapier/zapier-platform/pull/453) for more details

### schema

- :nail_care: Allow spaces and sqaure brackets in [`RefResourceSchema`](https://github.com/zapier/zapier-platform/blob/zapier-platform-schema@9.6.0/packages/schema/docs/build/schema.md) ([#456](https://github.com/zapier/zapier-platform/pull/456))

### misc

- :hammer: Bump node-fetch to 2.6.6 ([#458](https://github.com/zapier/zapier-platform/pull/458), [#460](https://github.com/zapier/zapier-platform/pull/460))
- :hammer: Move CI from Travis to GitHub Actions ([#453](https://github.com/zapier/zapier-platform/pull/453))

## 9.5.0

_released `2021-07-02`_

### cli

- None!

### core

- :tada: Allow using `await` in inline function source ([#390](https://github.com/zapier/zapier-platform/pull/390))
- :bug: Make sure all HTTP requests logged ([#390](https://github.com/zapier/zapier-platform/pull/390))

### schema

- None!

## 9.4.2

### cli

- None!

### core

- :bug: `ResponseError` no longer fails when request is `raw` ([#320](https://github.com/zapier/zapier-platform/pull/320))
- :bug: Redirecting from `https` to `http` breaks when disabling SSL certificate checks ([#314](https://github.com/zapier/zapier-platform/pull/314))

### schema

- None!

## 9.4.0

### cli

- :nail_care: `build` and `push` command now produces smaller zips (≈30% of the original size!) ([#202](https://github.com/zapier/zapier-platform/pull/202))

### core

- :nail_care: `z.request` now has an `allowGetBody` option that allows you to send a GET request with a body ([#195](https://github.com/zapier/zapier-platform/pull/195))
- :scroll: Update examples to demonstrate `z.errors.Error` ([#198](https://github.com/zapier/zapier-platform/pull/198))
- :scroll: Encourage use of `response.json` rather than `z.JSON.parse(response.content)` ([#200](https://github.com/zapier/zapier-platform/pull/200))
- :hammer: Include `User-Agent` header for internal calls ([#204](https://github.com/zapier/zapier-platform/pull/204))

### schema

- No changes

## 9.3.0

### cli

- No changes

### core

- :tada: We have new error classes! Use them to help improve user-facing error messages. Read [Error Handling](https://github.com/zapier/zapier-platform/blob/master/packages/cli/README.md#error-handling) in the docs for more. ([#189](https://github.com/zapier/zapier-platform/pull/189))
- :nail_care: Show variable name when curlies have a type error ([#188](https://github.com/zapier/zapier-platform/pull/188))

### schema

- :nail_care: `RequestSchema` now has a `serializeValueForCurlies` option, allowing to "reliably interpolate arrays or objects to a string" ([#190](https://github.com/zapier/zapier-platform/pull/190))

## 9.2.0

### cli

- :tada: `scaffold` command was entirely rewritten. Now it generates better code and is more resilient. ([#146](https://github.com/zapier/zapier-platform/pull/146))
- :bug: Fix `convert` command so it correctly handles a visual builder app converted from Web Builder ([#159](https://github.com/zapier/zapier-platform/pull/159))
- :bug: Allow env variables containing equals ([#179](https://github.com/zapier/zapier-platform/pull/179))
- :bug: Fix SSO link in `login` command output ([#157](https://github.com/zapier/zapier-platform/pull/157))
- :hammer: Fix test circular dependency ([#184](https://github.com/zapier/zapier-platform/pull/184))

### core

- :bug: Preserve non-empty values that include empty curlies in request objects ([#162](https://github.com/zapier/zapier-platform/pull/162))
- :bug: Improve `appTester` types and bump Node versions ([#172](https://github.com/zapier/zapier-platform/pull/172))
- :hammer: Fix smoke test circular dependency ([#175](https://github.com/zapier/zapier-platform/pull/175), [#185](https://github.com/zapier/zapier-platform/pull/185))

### schema

- :scroll: Clarify `FieldSchema.list` when used in `inputFields` vs. `outputFields` ([#143](https://github.com/zapier/zapier-platform/pull/143))

## 9.1.0

### cli

- :tada: CLI now has brand new tab completion! Learn how to activate it in the [doc](https://github.com/zapier/zapier-platform/tree/master/packages/cli#command-line-tab-completion). ([#134](https://github.com/zapier/zapier-platform/pull/134))
- :nail_care: Make CLI text style more consistent ([#132](https://github.com/zapier/zapier-platform/pull/132))
- :nail_care: `validate` command now uses a language consistent with the UI ([#132](https://github.com/zapier/zapier-platform/pull/132))
- :bug: `validate` command no longer requires login ([#119](https://github.com/zapier/zapier-platform/pull/119))
- :bug: Fix `convert` command crashing over a trailing comment ([#147](https://github.com/zapier/zapier-platform/pull/147))
- :bug: Projects generated by `convert` command now defaults to Node 10 ([#123](https://github.com/zapier/zapier-platform/pull/123))
- :hammer: `init` command now pulls examples from a tagged version ([#127](https://github.com/zapier/zapier-platform/pull/127))
- :hammer: Refactor `convert` command ([#131](https://github.com/zapier/zapier-platform/pull/131))
- :hammer: Refactor `describe` command ([#129](https://github.com/zapier/zapier-platform/pull/129))
- :hammer: Refactor `link` command ([#128](https://github.com/zapier/zapier-platform/pull/128))
- :hammer: Refactor `logs` command ([#121](https://github.com/zapier/zapier-platform/pull/121))
- :hammer: Refactor `register` command ([#122](https://github.com/zapier/zapier-platform/pull/122))
- :hammer: Finish oclif migration and clean up unused code ([#133](https://github.com/zapier/zapier-platform/pull/133))

### core

- :bug: Fix broken digest auth since 8.3.0 ([#153](https://github.com/zapier/zapier-platform/pull/153))
- :bug: Basic auth now allows empty username or password ([#130](https://github.com/zapier/zapier-platform/pull/130))
- :hammer: TypeScript definition fixes ([#124](https://github.com/zapier/zapier-platform/pull/124))

### schema

- No changes

## 9.0.0

This is a big one! There are a few areas with breaking changes. At a high level:

- Zapier integrations that depend on the new Core v9 will run using `Node.js v10`
- CLI had a lot of refactoring under the hood. A number of commands changed their args and/or name. Check out the [CLI docs](https://github.com/zapier/zapier-platform/blob/master/docs/cli.md) for the full rundown.
- All packages drop support for Node 6 (which has been EOL for a while, so hopefully this isn't news)

To successfully migrate to this version, you'll probably need to:

- install Node 10 using `nvm`. Lambda uses `10.16.13` ([source](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html)), but any will do.
- Check the CLI changelog below and adjust any scripts that call the CLI accordingly
- Update your integration's `zapier-platform-core` dependency to `9.0.0`.
- Run unit tests on Node 10 if you haven't before
- Assuming your code works on Node 10, go through the regular push, promote, migrate flow. There aren't any other breaking changes from and end-user perspective.

As always, feel free to [reach out](https://github.com/zapier/zapier-platform/tree/master/packages/cli#get-help) if you've got any questions.

See below for a detailed changelog:

### cli

- :exclamation: Remove `--include-js-map` flag from the `build` and `push` commands ([#99](https://github.com/zapier/zapier-platform/pull/99))
- :exclamation: remove watch command ([#100](https://github.com/zapier/zapier-platform/pull/100))
- :exclamation: Refactor `env` command. It's now `env:get`, `env:set` and `env:unset` ([docs](https://github.com/zapier/zapier-platform/blob/master/docs/cli.md#envget)) ([#104](https://github.com/zapier/zapier-platform/pull/104))
- :exclamation: Remove `invite` and `collaborate` commands. This functionality is now under `users` ([docs](https://github.com/zapier/zapier-platform/blob/master/docs/cli.md#usersadd)) and `team` ([docs](https://github.com/zapier/zapier-platform/blob/master/docs/cli.md#teamadd)) commands, respectively ([#106](https://github.com/zapier/zapier-platform/pull/106))
- :exclamation: Refactor `delete` into `delete:integration` and `delete:version` ([docs](https://github.com/zapier/zapier-platform/blob/master/docs/cli.md#deleteintegration)) ([#109](https://github.com/zapier/zapier-platform/pull/109))
- :exclamation: Refactor `logout` command to only clear the local session, not all of them ([#60](https://github.com/zapier/zapier-platform/pull/60))
- :exclamation: `scaffold` command errors if a file name already exists ([#88](https://github.com/zapier/zapier-platform/pull/88))
- :exclamation: `validate` depends on having a valid `deployKey` available (either in the environment or in the auth file, `~/.zapierrc`). This is a regression and will be fixed in a later version. In the meantime, see [Using CI](https://github.com/zapier/zapier-platform/blob/master/packages/cli/README.md#testing-in-your-ci) for more info.
- :tada: Add saml support during `login` ([#61](https://github.com/zapier/zapier-platform/pull/61))
- Refactor the following commands to use the new CLI setup:
  - build
  - delete
  - deprecate
  - env
  - history
  - login
  - logout
  - migrate
  - promote
  - push
  - scaffold
  - test
  - upload
  - validate
  - versions
- Deprecate `apps` command in favor of `integrations` ([#105](https://github.com/zapier/zapier-platform/pull/105))
- Run validation during build against `/check` endpoint ([#111](https://github.com/zapier/zapier-platform/pull/111))
- chore: rebuild yarn.lock ([#96](https://github.com/zapier/zapier-platform/pull/96))

### core

- :tada: Apps now run on Node.js `v10`
- (docs) update CHANGELOG.md links to point to zapier-platform repository ([#107](https://github.com/zapier/zapier-platform/pull/107))

### schema

- (fix) Make label & description optional for hidden actions ([#69](https://github.com/zapier/zapier-platform/pull/69))
- (fix) Be more permissive with mutually exclusive properties in input fields ([#91](https://github.com/zapier/zapier-platform/pull/91))

## 8.4.2

The only change of this release is we bumped Lodash to 4.17.15 ([#95](https://github.com/zapier/zapier-platform/pull/95)).
No more security warnings from `npm audit`!

## 8.4.1

### cli

- (chore) Don't send analytics when running tests ([#84](https://github.com/zapier/zapier-platform/pull/84))

### schema

- No changes

### core

- (fix) Strip URL query parameters from error messages for security ([#85](https://github.com/zapier/zapier-platform/pull/85))
- (chore) Don't send analytics when running tests ([#86](https://github.com/zapier/zapier-platform/pull/86))

## 8.4.0

### cli

- :tada: Added analytics to the CLI. These are vital for helping us improve our product. Read more about what we collect [here](https://github.com/zapier/zapier-platform/blob/master/packages/cli/README.md).

### schema

- No changes

### core

- No changes

## 8.3.0

The big change of this release is we started to maintain all the packages in a [monorepo](https://github.com/zapier/zapier-platform). It's more like an internal refactoring, so it shouldn't affect developer experience. Major work includes:

- (chore) Switch to use yarn ([#1](https://github.com/zapier/zapier-platform/pull/1))
- (chore) Restructure and rename directories ([#2](https://github.com/zapier/zapier-platform/pull/2))
- (chore) Adjust `zapier init` to pull from monorepo ([#4](https://github.com/zapier/zapier-platform/pull/4))
- (chore) Set up tests on Travis CI ([#5](https://github.com/zapier/zapier-platform/pull/5))
- (chore) Publish from Travis CI ([#33](https://github.com/zapier/zapier-platform/pull/33))
- (chore) Centralize husky code ([#34](https://github.com/zapier/zapier-platform/pull/34))
- (chore) Move tooling to root ([#46](https://github.com/zapier/zapier-platform/pull/46))

### cli

- (chore) Adopt [oclif](https://oclif.io/) CLI framework, started with `zapier init` command ([#43](https://github.com/zapier/zapier-platform/pull/43))
- (chore) Bump adm-zip ([#6](https://github.com/zapier/zapier-platform/pull/6))
- (docs) Update computed fields docs ([#7](https://github.com/zapier/zapier-platform/pull/7))

### schema

- :tada: (feature) Dynamic dropdowns (`FieldSchema.dynamic`) now support multiple labels ([#48](https://github.com/zapier/zapier-platform/pull/48), [#49](https://github.com/zapier/zapier-platform/pull/49))

### core

- (fix) Fix a callback issue ([#36](https://github.com/zapier/zapier-platform/pull/36))
- (chore) Bump adm-zip ([#6](https://github.com/zapier/zapier-platform/pull/6))

## 8.2.1

### cli

None!

### schema

- (fix) Drop help text length requirement ([#70](https://github.com/zapier/zapier-platform-schema/pull/70))

### core

None!

## 8.2.0

### cli

- :tada: (feature) Convert visual apps to CLI. ([#427](https://github.com/zapier/zapier-platform-cli/pull/427))
- (feature) Add per app version helpers ([#406](https://github.com/zapier/zapier-platform-cli/pull/406))
- (chore) bump travis node version ([#435](https://github.com/zapier/zapier-platform-cli/pull/435))
- (chore) remove babel ([#430](https://github.com/zapier/zapier-platform-cli/pull/430))
- (chore) Add eslint-plugin-mocha ([#429](https://github.com/zapier/zapier-platform-cli/pull/429))

### schema

- (fix) Reduce minLength for BasicDisplaySchema to 1 ([#69](https://github.com/zapier/zapier-platform-schema/pull/69))

### core

- (fix) Be more defensive when creating a buffer ([#155](https://github.com/zapier/zapier-platform-core/pull/155))
- (fix) fix regression where env is ignored ([#154](https://github.com/zapier/zapier-platform-core/pull/154))
- (fix) Prevent raw curies from being sent in a request. Allow removing empty… ([#153](https://github.com/zapier/zapier-platform-core/pull/153))
- (fix) Censor sensitive numbers ([#152](https://github.com/zapier/zapier-platform-core/pull/152))

## 8.1.0

### cli

- (fix) Add a better error message when uploading with a zip ([#408](https://github.com/zapier/zapier-platform-cli/pull/408))
- (chore) port logout command to async func ([#419](https://github.com/zapier/zapier-platform-cli/pull/419))
- (docs) Add code examples and scenarios to the dynamic dropdowns section of the Readme ([#415](https://github.com/zapier/zapier-platform-cli/pull/415))
- (docs) Add example for input fields with 'children' parameter ([#413](https://github.com/zapier/zapier-platform-cli/pull/413))
- (docs) Update signup link ([#412](https://github.com/zapier/zapier-platform-cli/pull/412))
- (docs) Update readme details for version number ([#411](https://github.com/zapier/zapier-platform-cli/pull/411))
- (docs) Misc improvements ([#423](https://github.com/zapier/zapier-platform-cli/pull/423))

### schema

- (improvement) Add appflags property ([#68](https://github.com/zapier/zapier-platform-schema/pull/68))
- (chore) Bump Lodash Version ([#67](https://github.com/zapier/zapier-platform-schema/pull/67))

### core

- (improvement) Allow Godzilla to require modules in code mode ([#145](https://github.com/zapier/zapier-platform-core/pull/145))
- (improvement) Add the ability to skip http patching ([#150](https://github.com/zapier/zapier-platform-core/pull/150))
- (fix) Censor auth headers in edge cases ([#151](https://github.com/zapier/zapier-platform-core/pull/151))
- (fix) Add meta to the bundle bank for resolving curlies. ([#149](https://github.com/zapier/zapier-platform-core/pull/149))
- (fix) Pass correct storekey ([#148](https://github.com/zapier/zapier-platform-core/pull/148))
- (fix) Add optional parameter to createAppTester to customize storeKey ([#147](https://github.com/zapier/zapier-platform-core/pull/147))
- (fix) Fix individual types for removeMissingValuesFrom object ([#146](https://github.com/zapier/zapier-platform-core/pull/146))
- (fix) Make removeMissing correctly optional ([#143](https://github.com/zapier/zapier-platform-core/pull/143))

## 8.0.1

A quick bugfix to resolve a regression

### cli

None!

### schema

- (fix) actually return validator class ([#64](https://github.com/zapier/zapier-platform-schema/pull/64))

### core

None!

## 8.0.0

This is a larger-than-normal release that coincides with the release of our new [Visual Builder](https://zapier.github.io/visual-builder/). It also includes a few breaking changes that you'll need to resolve in your code manually as you upgrade. Luckily, they're mostly find-and-replace.

#### `omitEmptyParams` has a new data type

We've changed the type of (the option formally known as) `omitEmptyParams` to accommodate clearing data from the query params and/or the request body

```js
// before
z.request({
  url: 'https://site.com',
  omitEmptyParams: true,
});

// after:
z.request({
  url: 'https://site.com',
  removeMissingValuesFrom: { params: true },
});
```

#### Curlies Don't Clobber

If you were using `{{curlies}}` to render non-primatives (that is, arrays or objects) at runtime, they were getting coerced into strings. Now they correctly stay as their original data type, which is only an issue if you were working around it before.

#### `bundle.meta` has a new coat of paint

We updated the key names in `bundle.meta` to make them more clear. In most cases, they were simply renamed, but some unhelpful ones were removed. There's a [conversion table](https://github.com/zapier/zapier-platform-cli/wiki/bundle.meta-changes) that should make this an easy thing to change.

---

Below are all of the changes:

### cli

- (improvement) respect 2fa settings ([#396](https://github.com/zapier/zapier-platform-cli/pull/396))
- (doc) Add a Docker and Docker Compose section for native environments. ([#397](https://github.com/zapier/zapier-platform-cli/pull/397))
- (doc) update collaborator to admin ([#403](https://github.com/zapier/zapier-platform-cli/pull/403))
- (doc) update docs to use new meta ([#393](https://github.com/zapier/zapier-platform-cli/pull/393))
- (chore) refactor `zapier login` to async ([#395](https://github.com/zapier/zapier-platform-cli/pull/395))
- (chore) make validate command async ([#401](https://github.com/zapier/zapier-platform-cli/pull/401))

### schema

- :exclamation: (improvement, **breaking**) Change omitEmptyParams to removeMissingValuesFrom ([#63](https://github.com/zapier/zapier-platform-schema/pull/63))
- :tada: (improvement) attempt to hoist better errors ([#62](https://github.com/zapier/zapier-platform-schema/pull/62))
- (doc) Document that helpText supports markdown ([#61](https://github.com/zapier/zapier-platform-schema/pull/61))

### core

- :exclamation: (improvement, **breaking**) Rename `omitEmptyParams` to `removeMissingValuesFrom`. In **typescript**, this is erroneously marked as required. In the next release, it will be optional. ([#140](https://github.com/zapier/zapier-platform-core/pull/140))
- :exclamation: (improvement, **breaking**) Resolve curlies to their original data type ([#139](https://github.com/zapier/zapier-platform-core/pull/139))
- :exclamation: (improvement, **breaking**) Rename `bundle.meta` keys (server change, see [CLI #393](https://github.com/zapier/zapier-platform-cli/pull/393) for more info)
- (improvement) preserve objects passed to inputData in the bundle bank ([#141](https://github.com/zapier/zapier-platform-core/pull/141))
- (improvement) Resolve subscription related bundle fields ([#138](https://github.com/zapier/zapier-platform-core/pull/138))
- (improvement) Prune unmatched tokens from request ([#137](https://github.com/zapier/zapier-platform-core/pull/137))
- (chore) Resolving potential security vulnerability in lodash dependency ([#136](https://github.com/zapier/zapier-platform-core/pull/136))

## 7.6.1

### cli

- (fix) `zapier push` doesn't stop on validation errors ([#388](https://github.com/zapier/zapier-platform-cli/pull/388))
- (doc) Fix a typo in OAuth1 doc ([#391](https://github.com/zapier/zapier-platform-cli/pull/391), [#392](https://github.com/zapier/zapier-platform-cli/pull/392))
- (doc) Update the AWS Lambda supported Node.js links ([#390](https://github.com/zapier/zapier-platform-cli/pull/390))
- (doc) Update `outputFields` doc to reflect current reality ([#386](https://github.com/zapier/zapier-platform-cli/pull/386))

### core

- (fix) Can't use unencrypted `https://` protocol when SSL checks are disabled ([#135](https://github.com/zapier/zapier-platform-core/pull/135))

## 7.6.0

### cli

- (improvement) `zapier convert` command has been reworked and greatly improved. Now it generates code that is more likely to work out of the box! ([#380](https://github.com/zapier/zapier-platform-cli/pull/380))
- (improvement) Refactor to use async/await in build command ([#382](https://github.com/zapier/zapier-platform-cli/pull/382))

### core

- (fix) Don't add `searchOrCreates` if either is hidden ([#134](https://github.com/zapier/zapier-platform-core/pull/134))

## 7.5.0

### cli

- (doc) Various doc improvements ([#374](https://github.com/zapier/zapier-platform-cli/pull/374))

### schema

- :tada: (new) Add OAuth1 support. Read [doc](https://zapier.github.io/zapier-platform-cli/#oauth1) for detail. [doc](<[#59](https://github.com/zapier/zapier-platform-schema/pull/59)>)
- (doc) Be more clear about whether hook methods are required ([#58](https://github.com/zapier/zapier-platform-schema/pull/58))

### core

- :tada: (new) Add OAuth1 support. Read [doc](https://zapier.github.io/zapier-platform-cli/#oauth1) for detail. ([#126](https://github.com/zapier/zapier-platform-core/pull/126))
- (fix) Make sure to censor URL-encoded values ([#129](https://github.com/zapier/zapier-platform-core/pull/129))
- (fix) Cursor reading didn't work in tests ([#125](https://github.com/zapier/zapier-platform-core/pull/125))
- (improvement) [Shorthand HTTP requests](https://zapier.github.io/zapier-platform-cli/#shorthand-http-requests) now parse `x-www-form-urlencoded` response bodies as well. Your app **could** break if your application server returns a JSON response body but with a `Content-Type: application/x-www-form-urlencoded` header. Switch to `z.request` if that's the case. ([#126](https://github.com/zapier/zapier-platform-core/pull/126))

## 7.4.0

### cli

- (fix) deasync binary is missing in Windows build ([#370](https://github.com/zapier/zapier-platform-cli/pull/370))
- (doc) Document digest auth ([#368](https://github.com/zapier/zapier-platform-cli/pull/368))

### core

- :tada: (new) Add support for digest auth. Read [doc](https://zapier.github.io/zapier-platform-cli/#digest) for detail. ([#123](https://github.com/zapier/zapier-platform-core/pull/123))
- (fix) `z.stashFile` doesn't pick up filename in `Content-Disposition` ([#124](https://github.com/zapier/zapier-platform-core/pull/124))

## 7.3.0

### cli

- (improvement) Add Dynamic Dropdown example app ([#363](https://github.com/zapier/zapier-platform-cli/pull/363))
- (improvement) Add smoke tests ([#361](https://github.com/zapier/zapier-platform-cli/pull/361), [#362](https://github.com/zapier/zapier-platform-cli/pull/362))
- (doc) Document `z.dehydrateFile` ([#360](https://github.com/zapier/zapier-platform-cli/pull/360))
- (doc) Document `outputFields` ([#365](https://github.com/zapier/zapier-platform-cli/pull/365))
- (doc) Update docs to reflect support for `async/await` ([#359](https://github.com/zapier/zapier-platform-cli/pull/359))

### schema

- :tada: (new) Add `omitEmptyParams` to `RequestSchema` ([#57](https://github.com/zapier/zapier-platform-schema/pull/57))
- (improvement) Add smoke tests ([#55](https://github.com/zapier/zapier-platform-schema/pull/55))

### core

- :tada: (new) Introduce `z.dehydrateFile` - a new recommended method to dehydrate a file. Read [doc](https://zapier.github.io/zapier-platform-cli/#file-dehydration) for detail. ([#112](https://github.com/zapier/zapier-platform-core/pull/112), [#120](https://github.com/zapier/zapier-platform-core/pull/120))
- :tada: (new) Add `omitEmptyParams` option to clean up empty request params automatically. Read [doc](https://zapier.github.io/zapier-platform-schema/build/schema.html#requestschema) for detail. ([#121](https://github.com/zapier/zapier-platform-core/pull/121))
- (fix) Fix null error handling ([#117](https://github.com/zapier/zapier-platform-core/pull/117))
- (improvement) Add smoke tests ([#116](https://github.com/zapier/zapier-platform-core/pull/116))

## 7.2.2

### core

- (fix) Sign dehydrated payloads for better security ([#111](https://github.com/zapier/zapier-platform-core/pull/111))

## 7.2.1

### core

- (fix) Allow to disable SSL certificate check ([#110](https://github.com/zapier/zapier-platform-core/pull/110))

## 7.2.0

### cli

- (fix) Include required binary in the build ([#350](https://github.com/zapier/zapier-platform-cli/pull/350))

### schema

- (fix) Add `copy` field type to `FieldSchema` ([#52](https://github.com/zapier/zapier-platform-schema/pull/52))
- (docs) Clarify `BasicDisplaySchema` directions description ([#51](https://github.com/zapier/zapier-platform-schema/pull/51))

### core

- (improvement) Better `AppTester` typescript bindings ([#103](https://github.com/zapier/zapier-platform-core/pull/103))

## 7.1.0

### cli

- (fix) Migrating by email shouldn't ask for promote ([#341](https://github.com/zapier/zapier-platform-cli/pull/341))
- (fix) Fix "epxeriencing" -> "experiencing" typo ([#338](https://github.com/zapier/zapier-platform-cli/pull/338))
- (fix) Fix failing Travis badge ([#343](https://github.com/zapier/zapier-platform-cli/pull/343))
- (improvement) Truncate `source_zip` in logs ([#348](https://github.com/zapier/zapier-platform-cli/pull/348))
- (improvement) Migrate to cli-table3 ([#327](https://github.com/zapier/zapier-platform-cli/pull/327))
- (docs) Session auth should be using `authData` instead of `inputData` ([#346](https://github.com/zapier/zapier-platform-cli/pull/346))

## 7.0.0

### cli

- (improvement) Bump Node.js version to 8 ([#328](https://github.com/zapier/zapier-platform-cli/pull/328))
- (improvement) Ask for promote when fully migrating a public app ([#326](https://github.com/zapier/zapier-platform-cli/pull/326))
- (improvement) Add typescript example app ([#329](https://github.com/zapier/zapier-platform-cli/pull/329))
- (improvement) Reduce package size ([#330](https://github.com/zapier/zapier-platform-cli/pull/330))

### schema

- (improvement) Bump Node.js version to 8 ([#48](https://github.com/zapier/zapier-platform-schema/pull/48))
- (improvement) Reduce package size ([#49](https://github.com/zapier/zapier-platform-schema/pull/49))

### core

- :exclamation: (improvement, **breaking**) Bump Node.js version to **8.10.0**. Apps with dependency `zapier-platform-core >= 7.0.0` run only on Node.js **8.10.0** in AWS Lambda. If you need to continue running on Node.js 6.10.3, use `zapier-platform-core <= 6.1.0`" ([#94](https://github.com/zapier/zapier-platform-core/pull/94))
- (fix) Add cursor to typings ([#95](https://github.com/zapier/zapier-platform-core/pull/95))
- (improvement) Reduce package size ([#97](https://github.com/zapier/zapier-platform-core/pull/97))

## 6.1.0

### cli

- (fix) Fix typo in `zapier register` text ([#324](https://github.com/zapier/zapier-platform-cli/pull/324))
- (fix) Fix `npm audit` security warnings ([#320](https://github.com/zapier/zapier-platform-cli/pull/320))
- (fix) `zapier convert` doesn't escape sample field labels ([#313](https://github.com/zapier/zapier-platform-cli/pull/313))
- (docs) Remove Digest auth references ([#323](https://github.com/zapier/zapier-platform-cli/pull/323))
- (docs) Add cursor docs ([#309](https://github.com/zapier/zapier-platform-cli/pull/309))

### schema

- (fix) Fix `npm audit` security warnings ([#46](https://github.com/zapier/zapier-platform-schema/pull/46))

### core

- :tada: (new) `z.cursor` store ([#76](https://github.com/zapier/zapier-platform-core/pull/76))
- (fix) Fix missed logs ([#91](https://github.com/zapier/zapier-platform-core/pull/91))
- (fix) Middleware isn't compiled ([#90](https://github.com/zapier/zapier-platform-core/pull/90))
- (fix) Fix `npm audit` security warnings ([#87](https://github.com/zapier/zapier-platform-core/pull/87))
- (improvement) Add typings ([#82](https://github.com/zapier/zapier-platform-core/pull/82))

## 6.0.0

### cli

- :exclamation: (improvement, **breaking**) JSON format only outputs valid JSON. This is only breaking if you were working around the formatting to process the JSON before ([#260](https://github.com/zapier/zapier-platform-cli/pull/260))
- (improvement) Better spinner ([#260](https://github.com/zapier/zapier-platform-cli/pull/260))

### schema

- :exclamation: (improvement, **breaking**) Fail validation if the top-level key doesn't match trigger/search/creates' `.key`. This fixes a bug where a trigger could be duplicated in the UI ([#41](https://github.com/zapier/zapier-platform-schema/pull/41))
- (docs) Add doc annotation for hook type ([#44](https://github.com/zapier/zapier-platform-schema/pull/44))
- (docs) Make long examples more readable ([#42](https://github.com/zapier/zapier-platform-schema/pull/42))

### core

- :exclamation: (improvement, **breaking**) Throw an error for key collisions between resources and standalone objects. This was previously a warning, so it shouldn't catch anyone by surprise ([#73](https://github.com/zapier/zapier-platform-core/pull/73))
- :exclamation: (improvement, **breaking**) Remove `bundle.environment`. This has always been deprecated, but now it shouldn't show up in the bundle anymore. Given that it hasn't held data, this shouldn't cause a lot of friction ([#72](https://github.com/zapier/zapier-platform-core/pull/72))

## 5.2.0

### cli

- :tada: (new) Add option to `zapier logs` to show bundle logs ([PR](https://github.com/zapier/zapier-platform-cli/pull/291))
- (fix) Fix `zapier build` from crashing on missing packages ([PR](https://github.com/zapier/zapier-platform-cli/pull/301))
- (fix) Fix `zapier convert` from crashing on certain OAuth config ([PR](https://github.com/zapier/zapier-platform-cli/pull/299))
- (fix) Fix `zapier convert` from crashing on a number in auth mapping ([PR](https://github.com/zapier/zapier-platform-cli/pull/305))
- (improvement) `zapier build` prints any errors from `npm install` ([PR](https://github.com/zapier/zapier-platform-cli/pull/288))
- (docs) Add note about nested dynamic functions ([PR](https://github.com/zapier/zapier-platform-cli/pull/296))
- (docs) Add docs about `bundle.cleanedRequest` and `bundle.rawRequest` ([PR](https://github.com/zapier/zapier-platform-cli/pull/298))

### schema

- (fix) Correctly invalidate field grandchildren ([PR](https://github.com/zapier/zapier-platform-schema/pull/40))
- (docs) More examples on functional constraints ([PR](https://github.com/zapier/zapier-platform-schema/pull/39))

### core

- (fix) Raise exception for bad requests when stashing a file ([PR](https://github.com/zapier/zapier-platform-core/pull/75))
- (fix) Better log censoring ([PR](https://github.com/zapier/zapier-platform-core/pull/77))

## 5.1.0

### cli

- :tada: (new) Add "did you mean" on unrecognized commands ([PR](https://github.com/zapier/zapier-platform-cli/pull/278))
- (fix) Fix hang issue when printing data on skinny terminal ([PR](https://github.com/zapier/zapier-platform-cli/pull/283))
- (fix) Server returns error when running `zapier logs --debug` ([PR](https://github.com/zapier/zapier-platform-cli/pull/254))
- (fix) Exclude unwanted files when doing `zapier build --disable-dependency-detection` ([PR](https://github.com/zapier/zapier-platform-cli/pull/258))
- (fix) Don't overwrite `.zapierapprc` completely ([PR](https://github.com/zapier/zapier-platform-cli/pull/275))
- (fix) Fix "CUSTOM_FIELDS_URL is not defined" error for `zapier convert` ([PR](https://github.com/zapier/zapier-platform-cli/pull/277))
- (improvement) Less nagging about updating packages ([PR](https://github.com/zapier/zapier-platform-cli/pull/282))
- (improvement) Add "github" and "search-or-create" example apps ([PR](https://github.com/zapier/zapier-platform-cli/pull/259), [PR2](https://github.com/zapier/zapier-platform-cli/pull/287))
- (improvement) `zapier promote` error messages now look better ([PR](https://github.com/zapier/zapier-platform-cli/pull/280))
- (improvement) Remove unnecessary `.nvmrc` logic ([PR](https://github.com/zapier/zapier-platform-cli/pull/256))
- (improvement) `zapier convert` supports static dropdown ([PR](https://github.com/zapier/zapier-platform-cli/pull/267))
- (improvement) `zapier convert` supports auth mapping better ([PR](https://github.com/zapier/zapier-platform-cli/pull/257))
- (improvement) Fix auth issue with full scripting methods for `zapier convert` ([PR](https://github.com/zapier/zapier-platform-cli/pull/271))
- (improvement) `zapier convert` converts samples, too ([PR](https://github.com/zapier/zapier-platform-cli/pull/266))
- (improvement) `zapier convert` respects auth field keys in test code ([PR](https://github.com/zapier/zapier-platform-cli/pull/274))
- (improvement) `zapier convert` generates `.env` instead of `.environment` ([PR](https://github.com/zapier/zapier-platform-cli/pull/276))
- (improvement) `zapier convert` includes input fields to test code ([PR](https://github.com/zapier/zapier-platform-cli/pull/246))
- (improvement) Fix session auth environment variable name for `zapier convert` ([PR](https://github.com/zapier/zapier-platform-cli/pull/281))
- (docs) FAQ about when to use placeholders or curlies ([PR](https://github.com/zapier/zapier-platform-cli/pull/252))

### schema

- (fix) Only require samples for non-hidden operations ([PR](https://github.com/zapier/zapier-platform-schema/pull/33))
- (fix) Correctly validate `children` as an array of fields ([PR](https://github.com/zapier/zapier-platform-schema/pull/34))
- (fix) Doc rendering issue ([PR](https://github.com/zapier/zapier-platform-schema/pull/35))
- (docs) Add doc annotation ([PR](https://github.com/zapier/zapier-platform-schema/pull/38))

### core

- (improvement) Bump Node version to 6.10.3 ([PR](https://github.com/zapier/zapier-platform-core/pull/69))
- (improvement) Deprecate `.environment` in favor of `.env` ([PR](https://github.com/zapier/zapier-platform-core/pull/70))
- (improvement) Support test framework other than Mocha ([PR](https://github.com/zapier/zapier-platform-core/pull/65))
- (improvement) `z.console.log` also calls `console.log` ([PR](https://github.com/zapier/zapier-platform-core/pull/66))
- (improvement) Check for object in create ([PR](https://github.com/zapier/zapier-platform-core/pull/67))

## 5.0.0

### cli

- :tada: (new) The CLI can now run, test, and build on any version of Node.js! ([PR](https://github.com/zapier/zapier-platform-cli/pull/234))
- :tada: (new) Read deploy key from env if available ([PR](https://github.com/zapier/zapier-platform-cli/pull/239))
- (improvement) More specific error messages for invalid installs ([PR](https://github.com/zapier/zapier-platform-cli/pull/238))
- (fix) `zapier env` no longer throws an error on Node versions >=8.0 ([PR](https://github.com/zapier/zapier-platform-cli/pull/242))
- (improvement) `zapier convert` creates a .gitignore for new apps ([PR](https://github.com/zapier/zapier-platform-cli/pull/237))
- (improvement) `zapier convert` properly escapes labels and descriptions ([PR](https://github.com/zapier/zapier-platform-cli/pull/233), [commit](https://github.com/zapier/zapier-platform-cli/commit/6d8014e9c04abb5f939affd19888c447ae1abca1))
- (improvement) `zapier convert` only sends a token when it exists, not before ([PR](https://github.com/zapier/zapier-platform-cli/pull/236))
- (improvement) `zapier convert` generates .environment and gives hint about editting it ([PR](https://github.com/zapier/zapier-platform-cli/pull/240))
- (improvement) Don't require an `id` field in tests generated by `zapier convert` ([PR](https://github.com/zapier/zapier-platform-cli/pull/243))
- (improvement) `zapier convert` adds track info to package.json ([PR](https://github.com/zapier/zapier-platform-cli/pull/245))
- (docs) FAQ section in the README ([PR](https://github.com/zapier/zapier-platform-cli/pull/231))

### schema

- :exclamation: (improvement, **breaking**) `sample` is now a required field in `BasicOperationSchema` and friends. See [this doc](https://zapier.com/developer/documentation/v2/trigger-sample-results/) for more info ([PR](https://github.com/zapier/zapier-platform-schema/pull/32))
- :exclamation: (improvement, **breaking**) `order` has been removed from `BasicDisplaySchema` ([PR](https://github.com/zapier/zapier-platform-schema/pull/27))

### core

- (improvement) Log when actions generated by a resource collide with manually defined ones ([PR](https://github.com/zapier/zapier-platform-core/pull/63))
- (improvement) Properly log gzipped responses ([PR](https://github.com/zapier/zapier-platform-core/pull/62))

## 4.3.2

- (Fix) [Permission denied with `index.js`.](https://github.com/zapier/zapier-platform-cli/pull/224)
- (Fix) [`zapier convert` didn't escape line breaks in app description.](https://github.com/zapier/zapier-platform-cli/pull/226)
- (Doc) [Add FAQs section.](https://github.com/zapier/zapier-platform-cli/pull/225)
- [Ensure users are authenticated before building or pushing.](https://github.com/zapier/zapier-platform-cli/pull/227)

## 4.3.1

- (Fix) [Broken patching on http.request.](https://github.com/zapier/zapier-platform-core/pull/61)

## 4.3.0

- (New) `zapier convert` now supports [custom auth mapping](https://github.com/zapier/zapier-platform-cli/pull/200), [searchOrCreates](https://github.com/zapier/zapier-platform-cli/pull/207) and ["Send to Action Endpoint URL in JSON body" checkbox](https://github.com/zapier/zapier-platform-cli/pull/204).
- (New) [`zapier scaffold` now also creates a test.](https://github.com/zapier/zapier-platform-cli/pull/212)
- (New) [Allow ordering static dropdowns.](https://github.com/zapier/zapier-platform-schema/pull/30)
- (Fix) [Properly replace variables in URLs in `zapier convert` generated code.](https://github.com/zapier/zapier-platform-cli/pull/208)
- (Fix) [Fix TypeError in `http.request` patch.](https://github.com/zapier/zapier-platform-core/pull/59)
- (Doc) [Clarify pushing doesn't reload browser automatically.](https://github.com/zapier/zapier-platform-cli/pull/218)
- [Use working endpoints for scaffolds.](https://github.com/zapier/zapier-platform-cli/pull/215)
- [Notify for update less often.](https://github.com/zapier/zapier-platform-cli/pull/210)
- [Introduce Prettier into development process.](https://github.com/zapier/zapier-platform-cli/pull/209)
- [Ensure all template code use z.JSON.parse.](https://github.com/zapier/zapier-platform-cli/pull/216)

## 4.2.3

- The first build made by Travis CI!

## 4.2.1

- (Fix) Repack zapier-platform-core to really fix bloated size

## 4.2.0

- (New) `zapier convert` now supports [input](https://github.com/zapier/zapier-platform-cli/pull/196) and [output custom fields](https://github.com/zapier/zapier-platform-cli/pull/199).
- (New) [Prettify `zapier convert` generated code.](https://github.com/zapier/zapier-platform-cli/pull/202)
- (Fix) [Fix bloated size of zapier-platform-core 4.1.0 package.](https://github.com/zapier/zapier-platform-core/pull/56)
- (Fix) [Fix typos in docs.](https://github.com/zapier/zapier-platform-cli/pull/197)
- (Doc) [Add 'Mocking Requests' section to docs.](https://github.com/zapier/zapier-platform-cli/pull/201)
- (Doc) [Mark step 'order' as deprecated.](https://github.com/zapier/zapier-platform-schema/pull/28)

## 4.1.0

- (New) `zapier convert` now supports [auth](https://github.com/zapier/zapier-platform-cli/pull/185) and [search](https://github.com/zapier/zapier-platform-cli/pull/186) scripting methods.
- (New) [Allow to migrate users by email.](https://github.com/zapier/zapier-platform-cli/pull/192)
- (New) [Accept changelog for app promotion.](https://github.com/zapier/zapier-platform-cli/pull/194)
- (Doc) [Add explanation about uppercased env vars.](https://github.com/zapier/zapier-platform-cli/pull/195)
- [Improve first promote message.](https://github.com/zapier/zapier-platform-cli/pull/191)

## 4.0.0

- (**BREAKING**) (Fix) [Encode form requests with + instead of %20 by default](https://github.com/zapier/zapier-platform-core/pull/52)
- (**BREAKING**) (Fix) [Don't add content-type if there's one](https://github.com/zapier/zapier-platform-core/pull/55)
- (Fix) [Replace \_.truncate, save memory.](https://github.com/zapier/zapier-platform-core/pull/54)
- (Fix) [fix: exit code 1 for only for errors](https://github.com/zapier/zapier-platform-cli/pull/154)
- (Fix) [`zapier convert`: Escape special chars in field help text](https://github.com/zapier/zapier-platform-cli/pull/182)
- (Fix) [`zapier convert`: Normalize newlines in scripting ](https://github.com/zapier/zapier-platform-cli/pull/183)
- (New) [`zapier convert`: Generate create code based on different scripting method combinations](https://github.com/zapier/zapier-platform-cli/pull/181)
- (New) [`zapier convert`: Ignore \_pre_poll and \_post_poll if \_poll exists ](https://github.com/zapier/zapier-platform-cli/pull/187)
- (New) [Customize update notification message](https://github.com/zapier/zapier-platform-cli/pull/188)
- (New) [Allow to include a regexp of paths for the build file](https://github.com/zapier/zapier-platform-cli/pull/158)
- (New) [Add example docs about computed fields.](https://github.com/zapier/zapier-platform-cli/pull/184)

## 3.3.0

- [Log http(s) requests for non-client library](https://github.com/zapier/zapier-platform-core/pull/51)
- Many improvements for `zapier convert`: [Copy noun](https://github.com/zapier/zapier-platform-cli/pull/159), [Copy display label](https://github.com/zapier/zapier-platform-cli/pull/160), [Copy description](https://github.com/zapier/zapier-platform-cli/pull/163), [Copy important and hidden props](https://github.com/zapier/zapier-platform-cli/pull/166), [Add more tests](https://github.com/zapier/zapier-platform-cli/pull/170), [Converting more auths](https://github.com/zapier/zapier-platform-cli/pull/167), [Allowing deasync in build](https://github.com/zapier/zapier-platform-cli/pull/169), [Converting scripting for triggers](https://github.com/zapier/zapier-platform-cli/pull/172), [Support for dynamic dropdowns and search-powered fields](https://github.com/zapier/zapier-platform-cli/pull/173), [Adding a command for integrations test](https://github.com/zapier/zapier-platform-cli/pull/175), [Add basic tests for triggers, creates, and searches](https://github.com/zapier/zapier-platform-cli/pull/178), [Remove empty help text](https://github.com/zapier/zapier-platform-cli/pull/179)
- [Skip style check on invalid apps](https://github.com/zapier/zapier-platform-cli/pull/168)
- [Add header to docs](https://github.com/zapier/zapier-platform-cli/pull/153)
- [Add option to `--grep` on `zapier test`](https://github.com/zapier/zapier-platform-cli/pull/177)

## 3.2.1

- [Fixes a problem with a sub-sub-dependency](https://github.com/zapier/zapier-platform-cli/issues/157).

## 3.2.0

- [Allow invitations per version](https://github.com/zapier/zapier-platform-cli/pull/150). Try `zapier help invite` for more details.
- [Added bundle.meta.zap.id for performSubscribe and performUnsubscribe](https://github.com/zapier/zapier-platform-cli/pull/149).
- [Allow modules to be objects in app definitions](https://github.com/zapier/zapier-platform-core/pull/48).
- [Use "application" discrete-type instead of "binary" as default content type.](https://github.com/zapier/zapier-platform-core/pull/49).
- [Use un-obfuscated data when logging to stdout](https://github.com/zapier/zapier-platform-core/pull/50).
- Improved/fixed sample and scaffolding code in docs.
- Fixed typos in docs.

## 3.1.0

- [Allow setting a `Content-Type` when stashing a file](https://github.com/zapier/zapier-platform-core/pull/47)
- [Increase dehydrator max payload size to 2 KB](https://github.com/zapier/zapier-platform-core/pull/46)

## 3.0.1

- Fixed node/npm dependency check for 3.x.
- Fixed URL base endpoint in docs.

## 3.0.0

- (**BREAKING**) `inputField`s will now start [throwing errors in Schema validation](https://github.com/zapier/zapier-platform-schema/pull/25) if there are mutually-exclusive fields.
- [Added subdomain field support to CLI apps](https://github.com/zapier/zapier-platform-schema/pull/26).
- [Allowed file stashing within a create/action](https://github.com/zapier/zapier-platform-core/pull/45).
- [Added style checks to `zapier build`](https://github.com/zapier/zapier-platform-cli/pull/130).
- Fixed [`zapier build` on Windows](https://github.com/zapier/zapier-platform-cli/pull/122).

## 2.2.0

- It's now possible to delete apps and app versions with [`zapier delete`](https://zapier.github.io/zapier-platform-cli/cli.html#delete)!
- You'll now get a warning when doing `zapier push` or `zapier upload` if your app's `zapier-platform-core` version is not up-to-date.
- It's now possible to skip validation when testing with [`zapier test --skip-validate`](https://zapier.github.io/zapier-platform-cli/cli.html#test)!
- Added docs around upgrading.
- Improved docs around authentication, migration, deprecation, and dehydration.
- Fixed `zapier logs --version=x.x.x` showing `zapier --version`.
- Improved error messages for [some schema validation errors](https://github.com/zapier/zapier-platform-schema/pull/24).
- Fixed Python error when a create, as part of a search or create, returned a list with one item ([errors sooner, in core now, with a nicer message](https://github.com/zapier/zapier-platform-core/pull/44)).
- [Objects received via Hook triggers no longer require an `id`, and checks were improved](https://github.com/zapier/zapier-platform-core/pull/43).
- Minor misc fixes.

## 2.1.0

- [Connection Label is now available](https://zapier.github.io/zapier-platform-schema/build/schema.html#authenticationschema) (`connectionLabel: '{{bundle.inputData.email}}'` inside `authentication`)
- [Locking is now available for `create`](https://zapier.github.io/zapier-platform-schema/build/schema.html#createschema) (`shouldLock: true` inside `.operation`)
- Fix typos in docs

## 2.0.1

- Fix broken appTester on Windows OS.
- Require the exact version of zapier-platform-core in package.json.
- Document middleware's z object lacks z.request.
- Fix typo in session auth docs.

## 2.0.0

- (**BREAKING**) CLI 2.x apps run only on NodeJS `v6.10.2` in AWS Lambda. If you need to run on NodeJS `v4.3.2`, use the CLI 1.x release.
- (**BREAKING**) Delete property `searchOrCreate` from the properties of ResourceSchema.
- Style checks run by default during `zapier validate`.
- Validation is run during `zapier test`.
- The CLI now uses update-notifier to let you know when there's a new version available.
- Rename `global` to `public` for consistency across Zapier platform.

## 1.0.11

- `zapier --validate` now includes the `--include-style` flag to validate against [style checks](https://zapier.com/developer/documentation/v2/style-checks-reference/).
- There are extra checks around return types from triggers, searches, and creates.
- Some doc typos were squashed.

## 1.0.10

- Added new Files example app with `zapier init . --template=files`.
- Properly exit on node version mismatch while running `zapier test`.
- Upgraded `node-fetch` in `core` (fixes some edge-case issues for `multipart/form-data` requests).
- `zapier test` is now quiet by default. `zapier test --debug` will output details.
- `zapier logs --type=http --detailed` is more clearly exposed.
- Fixes `searchOrCreate` schema validation error for resources with `search` and `create`.

## 1.0.9

- Functions in `app.afterResponse` will now get called.
- Add check in middleware, to make sure creates return only 1 object.
- Fixes issue for deep object checking.
- Minor docs fixes.

## 1.0.8

- `z.stashFile` is no longer allowed outside of `hydrators`.
- Adding analytics to the web-based documentation.
- Minor docs fixes.

## 1.0.7

- Improved `link` command UX on error/non-existing apps.

## 1.0.6

- Fixed `convert` command for `outputFields`.
- Improvements on `validate-templates` and `zapier test` (now supports `--timeout=5000`).
- Minor docs fixes.

## 1.0.5

- Use `ZAPIER_BASE_ENDPOINT` for `push` and `convert`.
- Don't show command help on error.
- Minor docs fixes.

## 1.0.4

- Fix issues in Windows.
- Minor docs fixes.

## 1.0.3

- Fixes fatal error when `build` directory didn't exist.
- Minor docs fixes.

## 1.0.2

- Support streamed non-ascii files in `z.stashFile`.
- Minor docs fixes.

## 1.0.1

- Minor docs fixes.

## 1.0.0

- Removing beta "label".
- Minor docs fixes.

## 0.10.2

- Added `dict` property for `inputFields`, to allow asking for a dictionary (key/value pair) input.
- Added new REST Hooks example app with `zapier init . --template=rest-hooks`.
- Fixed: Now correctly ask for line items when `children` is set.

## 0.10.1

- Added `search` property for `inputFields`, to allow linking a search connector.

## 0.10.0

- **BREAKING CHANGE** Removed `getResourceOperation` in creates/searches in favor of `performGet`.

- Added support for `performList` in webhook triggers
- Fixed: Now correctly copy outputFields and samples to a trigger/search/create operation that links to a resource

## 0.9.12

- Added `performList` to hook operations.

## 0.9.10

- Documentation expanded:
  - Updated `z.dehydrate()` / `appTester()` / examples to reflect the new arguments.
    - `z.dehydrate('someFunction')` must be `z.dehydrate(App.hydrators.someFunction)`
    - `appTester('contact.list')` must be `appTester(App.resources.contact.list.operation.perform)`
  - Documented fields, custom/dynamic fields, and dynamic dropdowns plus examples.
  - `zapier env ... -remove` flag documented.
- `zapier describe` now describes much more about the app - included auth info, redirect_uri, resources and all resource paths.
- fixed `zapier scaffold` bug with undefined `INPUT_FIELDS`

## 0.9.9

Initial release to public. Read docs here https://github.com/zapier/zapier-platform-cli.
