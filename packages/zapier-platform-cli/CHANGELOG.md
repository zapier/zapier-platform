## 8.2.0

### cli
* :tada: (feature) Convert visual apps to CLI.  ([#427](https://github.com/zapier/zapier-platform-cli/pull/427))
* (feature) Add per app version helpers ([#406](https://github.com/zapier/zapier-platform-cli/pull/406))
* (chore) bump travis node version ([#435](https://github.com/zapier/zapier-platform-cli/pull/435))
* (chore) remove babel ([#430](https://github.com/zapier/zapier-platform-cli/pull/430))
* (chore) Add eslint-plugin-mocha ([#429](https://github.com/zapier/zapier-platform-cli/pull/429))

### schema
* (fix) Reduce minLength for BasicDisplaySchema to 1 ([#69](https://github.com/zapier/zapier-platform-schema/pull/69))

### core
* (fix) Be more defensive when creating a buffer ([#155](https://github.com/zapier/zapier-platform-core/pull/155))
* (fix) fix regression where env is ignored ([#154](https://github.com/zapier/zapier-platform-core/pull/154))
* (fix) Prevent raw curies from being sent in a request. Allow removing empty… ([#153](https://github.com/zapier/zapier-platform-core/pull/153))
* (fix) Censor sensitive numbers ([#152](https://github.com/zapier/zapier-platform-core/pull/152))

## 8.1.0

### cli
* (fix) Add a better error message when uploading with a zip ([#408](https://github.com/zapier/zapier-platform-cli/pull/408))
* (chore) port logout command to async func ([#419](https://github.com/zapier/zapier-platform-cli/pull/419))
* (docs) Add code examples and scenarios to the dynamic dropdowns section of the Readme ([#415](https://github.com/zapier/zapier-platform-cli/pull/415))
* (docs) Add example for input fields with 'children' parameter ([#413](https://github.com/zapier/zapier-platform-cli/pull/413))
* (docs) Update signup link ([#412](https://github.com/zapier/zapier-platform-cli/pull/412))
* (docs) Update readme details for version number ([#411](https://github.com/zapier/zapier-platform-cli/pull/411))
* (docs) Misc improvements ([#423](https://github.com/zapier/zapier-platform-cli/pull/423))

### schema
* (improvement) Add appflags property ([#68](https://github.com/zapier/zapier-platform-schema/pull/68))
* (chore) Bump Lodash Version ([#67](https://github.com/zapier/zapier-platform-schema/pull/67))

### core
* (improvement) Allow Godzilla to require modules in code mode ([#145](https://github.com/zapier/zapier-platform-core/pull/145))
* (improvement) Add the ability to skip http patching ([#150](https://github.com/zapier/zapier-platform-core/pull/150))
* (fix) Censor auth headers in edge cases ([#151](https://github.com/zapier/zapier-platform-core/pull/151))
* (fix) Add meta to the bundle bank for resolving curlies. ([#149](https://github.com/zapier/zapier-platform-core/pull/149))
* (fix) Pass correct storekey ([#148](https://github.com/zapier/zapier-platform-core/pull/148))
* (fix) Add optional parameter to createAppTester to customize storeKey ([#147](https://github.com/zapier/zapier-platform-core/pull/147))
* (fix) Fix individual types for removeMissingValuesFrom object ([#146](https://github.com/zapier/zapier-platform-core/pull/146))
* (fix) Make removeMissing correctly optional ([#143](https://github.com/zapier/zapier-platform-core/pull/143))

## 8.0.1

A quick bugfix to resolve a regression

### cli
None!

### schema
* (fix) actually return validator class ([#64](https://github.com/zapier/zapier-platform-schema/pull/64))

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
  omitEmptyParams: true
})

// after:
z.request({
  url: 'https://site.com',
  removeMissingValuesFrom: { params: true }
})
```

#### Curlies Don't Clobber

If you were using `{{curlies}}` to render non-primatives (that is, arrays or objects) at runtime, they were getting coerced into strings. Now they correctly stay as their original data type, which is only an issue if you were working around it before.

#### `bundle.meta` has a new coat of paint

We updated the key names in `bundle.meta` to make them more clear. In most cases, they were simply renamed, but some unhelpful ones were removed. There's a [conversion table](https://github.com/zapier/zapier-platform-cli/wiki/bundle.meta-changes) that should make this an easy thing to change.

---

Below are all of the changes:

### cli
* (improvement) respect 2fa settings ([#396](https://github.com/zapier/zapier-platform-cli/pull/396))
* (doc) Add a Docker and Docker Compose section for native environments. ([#397](https://github.com/zapier/zapier-platform-cli/pull/397))
* (doc) update collaborator to admin ([#403](https://github.com/zapier/zapier-platform-cli/pull/403))
* (doc) update docs to use new meta ([#393](https://github.com/zapier/zapier-platform-cli/pull/393))
* (chore) refactor `zapier login` to async ([#395](https://github.com/zapier/zapier-platform-cli/pull/395))
* (chore) make validate command async ([#401](https://github.com/zapier/zapier-platform-cli/pull/401))

### schema
* :exclamation: (improvement, **breaking**) Change omitEmptyParams to removeMissingValuesFrom ([#63](https://github.com/zapier/zapier-platform-schema/pull/63))
* :tada: (improvement) attempt to hoist better errors ([#62](https://github.com/zapier/zapier-platform-schema/pull/62))
* (doc) Document that helpText supports markdown ([#61](https://github.com/zapier/zapier-platform-schema/pull/61))

### core
* :exclamation: (improvement, **breaking**) Rename `omitEmptyParams` to `removeMissingValuesFrom`. In **typescript**, this is erroneously marked as required. In the next release, it will be optional. ([#140](https://github.com/zapier/zapier-platform-core/pull/140))
* :exclamation: (improvement, **breaking**) Resolve curlies to their original data type ([#139](https://github.com/zapier/zapier-platform-core/pull/139))
* :exclamation: (improvement, **breaking**) Rename `bundle.meta` keys (server change, see [CLI #393](https://github.com/zapier/zapier-platform-cli/pull/393) for more info)
* (improvement) preserve objects passed to inputData in the bundle bank ([#141](https://github.com/zapier/zapier-platform-core/pull/141))
* (improvement) Resolve subscription related bundle fields ([#138](https://github.com/zapier/zapier-platform-core/pull/138))
* (improvement) Prune unmatched tokens from request ([#137](https://github.com/zapier/zapier-platform-core/pull/137))
* (chore) Resolving potential security vulnerability in lodash dependency ([#136](https://github.com/zapier/zapier-platform-core/pull/136))

## 7.6.1

### cli

* (fix) `zapier push` doesn't stop on validation errors ([#388](https://github.com/zapier/zapier-platform-cli/pull/388))
* (doc) Fix a typo in OAuth1 doc ([#391](https://github.com/zapier/zapier-platform-cli/pull/391), [#392](https://github.com/zapier/zapier-platform-cli/pull/392))
* (doc) Update the AWS Lambda supported Node.js links ([#390](https://github.com/zapier/zapier-platform-cli/pull/390))
* (doc) Update `outputFields` doc to reflect current reality ([#386](https://github.com/zapier/zapier-platform-cli/pull/386))

### core

* (fix) Can't use unencrypted `http://` protocol when SSL checks are disabled ([#135](https://github.com/zapier/zapier-platform-core/pull/135))

## 7.6.0

### cli

* (improvement) `zapier convert` command has been reworked and greatly improved. Now it generates code that is more likely to work out of the box! ([#380](https://github.com/zapier/zapier-platform-cli/pull/380))
* (improvement) Refactor to use async/await in build command ([#382](https://github.com/zapier/zapier-platform-cli/pull/382))

### core

* (fix) Don't add `searchOrCreates` if either is hidden ([#134](https://github.com/zapier/zapier-platform-core/pull/134))

## 7.5.0

### cli

* (doc) Various doc improvements ([#374](https://github.com/zapier/zapier-platform-cli/pull/374))

### schema

* :tada: (new) Add OAuth1 support. Read [doc](https://zapier.github.io/zapier-platform-cli/#oauth1) for detail. [doc] ([#59](https://github.com/zapier/zapier-platform-schema/pull/59))
* (doc) Be more clear about whether hook methods are required ([#58](https://github.com/zapier/zapier-platform-schema/pull/58))

### core

* :tada: (new) Add OAuth1 support. Read [doc](https://zapier.github.io/zapier-platform-cli/#oauth1) for detail. ([#126](https://github.com/zapier/zapier-platform-core/pull/126))
* (fix) Make sure to censor URL-encoded values ([#129](https://github.com/zapier/zapier-platform-core/pull/129))
* (fix) Cursor reading didn't work in tests ([#125](https://github.com/zapier/zapier-platform-core/pull/125))
* (improvement) [Shorthand HTTP requests](https://zapier.github.io/zapier-platform-cli/#shorthand-http-requests) now parse `x-www-form-urlencoded` response bodies as well. Your app **could** break if your application server returns a JSON response body but with a `Content-Type: application/x-www-form-urlencoded` header. Switch to `z.request` if that's the case. ([#126](https://github.com/zapier/zapier-platform-core/pull/126))

## 7.4.0

### cli

* (fix) deasync binary is missing in Windows build ([#370](https://github.com/zapier/zapier-platform-cli/pull/370))
* (doc) Document digest auth ([#368](https://github.com/zapier/zapier-platform-cli/pull/368))

### core

* :tada: (new) Add support for digest auth. Read [doc](https://zapier.github.io/zapier-platform-cli/#digest) for detail. ([#123](https://github.com/zapier/zapier-platform-core/pull/123))
* (fix) `z.stashFile` doesn't pick up filename in `Content-Disposition` ([#124](https://github.com/zapier/zapier-platform-core/pull/124))

## 7.3.0

### cli

* (improvement) Add Dynamic Dropdown example app ([#363](https://github.com/zapier/zapier-platform-cli/pull/363))
* (improvement) Add smoke tests ([#361](https://github.com/zapier/zapier-platform-cli/pull/361), [#362](https://github.com/zapier/zapier-platform-cli/pull/362))
* (doc) Document `z.dehydrateFile` ([#360](https://github.com/zapier/zapier-platform-cli/pull/360))
* (doc) Document `outputFields` ([#365](https://github.com/zapier/zapier-platform-cli/pull/365))
* (doc) Update docs to reflect support for `async/await` ([#359](https://github.com/zapier/zapier-platform-cli/pull/359))

### schema

* :tada: (new) Add `omitEmptyParams` to `RequestSchema` ([#57](https://github.com/zapier/zapier-platform-schema/pull/57))
* (improvement) Add smoke tests ([#55](https://github.com/zapier/zapier-platform-schema/pull/55))

### core

* :tada: (new) Introduce `z.dehydrateFile` - a new recommended method to dehydrate a file. Read [doc](https://zapier.github.io/zapier-platform-cli/#file-dehydration) for detail. ([#112](https://github.com/zapier/zapier-platform-core/pull/112), [#120](https://github.com/zapier/zapier-platform-core/pull/120))
* :tada: (new) Add `omitEmptyParams` option to clean up empty request params automatically. Read [doc](https://zapier.github.io/zapier-platform-schema/build/schema.html#requestschema) for detail. ([#121](https://github.com/zapier/zapier-platform-core/pull/121))
* (fix) Fix null error handling ([#117](https://github.com/zapier/zapier-platform-core/pull/117))
* (improvement) Add smoke tests ([#116](https://github.com/zapier/zapier-platform-core/pull/116))

## 7.2.2

### core

* (fix) Sign dehydrated payloads for better security ([#111](https://github.com/zapier/zapier-platform-core/pull/111))

## 7.2.1

### core

* (fix) Allow to disable SSL certificate check ([#110](https://github.com/zapier/zapier-platform-core/pull/110))

## 7.2.0

### cli

* (fix) Include required binary in the build ([#350](https://github.com/zapier/zapier-platform-cli/pull/350))

### schema

* (fix) Add `copy` field type to `FieldSchema` ([#52](https://github.com/zapier/zapier-platform-schema/pull/52))
* (docs) Clarify `BasicDisplaySchema` directions description ([#51](https://github.com/zapier/zapier-platform-schema/pull/51))

### core

* (improvement) Better `AppTester` typescript bindings ([#103](https://github.com/zapier/zapier-platform-core/pull/103))

## 7.1.0

### cli

* (fix) Migrating by email shouldn't ask for promote ([#341](https://github.com/zapier/zapier-platform-cli/pull/341))
* (fix) Fix "epxeriencing" -> "experiencing" typo ([#338](https://github.com/zapier/zapier-platform-cli/pull/338))
* (fix) Fix failing Travis badge ([#343](https://github.com/zapier/zapier-platform-cli/pull/343))
* (improvement) Truncate `source_zip` in logs ([#348](https://github.com/zapier/zapier-platform-cli/pull/348))
* (improvement) Migrate to cli-table3 ([#327](https://github.com/zapier/zapier-platform-cli/pull/327))
* (docs) Session auth should be using `authData` instead of `inputData` ([#346](https://github.com/zapier/zapier-platform-cli/pull/346))

## 7.0.0

### cli

* (improvement) Bump Node.js version to 8 ([#328](https://github.com/zapier/zapier-platform-cli/pull/328))
* (improvement) Ask for promote when fully migrating a public app ([#326](https://github.com/zapier/zapier-platform-cli/pull/326))
* (improvement) Add typescript example app ([#329](https://github.com/zapier/zapier-platform-cli/pull/329))
* (improvement) Reduce package size ([#330](https://github.com/zapier/zapier-platform-cli/pull/330))

### schema

* (improvement) Bump Node.js version to 8 ([#48](https://github.com/zapier/zapier-platform-schema/pull/48))
* (improvement) Reduce package size ([#49](https://github.com/zapier/zapier-platform-schema/pull/49))

### core

* :exclamation: (improvement, **breaking**) Bump Node.js version to **8.10.0**. Apps with dependency `zapier-platform-core >= 7.0.0` run only on Node.js **8.10.0** in AWS Lambda. If you need to continue running on Node.js 6.10.3, use `zapier-platform-core <= 6.1.0`" ([#94](https://github.com/zapier/zapier-platform-core/pull/94))
* (fix) Add cursor to typings ([#95](https://github.com/zapier/zapier-platform-core/pull/95))
* (improvement) Reduce package size ([#97](https://github.com/zapier/zapier-platform-core/pull/97))

## 6.1.0

### cli

* (fix) Fix typo in `zapier register` text ([#324](https://github.com/zapier/zapier-platform-cli/pull/324))
* (fix) Fix `npm audit` security warnings ([#320](https://github.com/zapier/zapier-platform-cli/pull/320))
* (fix) `zapier convert` doesn't escape sample field labels ([#313](https://github.com/zapier/zapier-platform-cli/pull/313))
* (docs) Remove Digest auth references ([#323](https://github.com/zapier/zapier-platform-cli/pull/323))
* (docs) Add cursor docs ([#309](https://github.com/zapier/zapier-platform-cli/pull/309))

### schema

* (fix) Fix `npm audit` security warnings ([#46](https://github.com/zapier/zapier-platform-schema/pull/46))

### core

* :tada: (new) `z.cursor` store ([#76](https://github.com/zapier/zapier-platform-core/pull/76))
* (fix) Fix missed logs ([#91](https://github.com/zapier/zapier-platform-core/pull/91))
* (fix) Middleware isn't compiled ([#90](https://github.com/zapier/zapier-platform-core/pull/90))
* (fix) Fix `npm audit` security warnings ([#87](https://github.com/zapier/zapier-platform-core/pull/87))
* (improvement) Add typings ([#82](https://github.com/zapier/zapier-platform-core/pull/82))

## 6.0.0

### cli

* :exclamation: (improvement, **breaking**) JSON format only outputs valid JSON. This is only breaking if you were working around the formatting to process the JSON before ([#260](https://github.com/zapier/zapier-platform-cli/pull/260))
* (improvement) Better spinner ([#260](https://github.com/zapier/zapier-platform-cli/pull/260))

### schema

* :exclamation: (improvement, **breaking**) Fail validation if the top-level key doesn't match trigger/search/creates' `.key`. This fixes a bug where a trigger could be duplicated in the UI ([#41](https://github.com/zapier/zapier-platform-schema/pull/41))
* (docs) Add doc annotation for hook type ([#44](https://github.com/zapier/zapier-platform-schema/pull/44))
* (docs) Make long examples more readable ([#42](https://github.com/zapier/zapier-platform-schema/pull/42))

### core

* :exclamation: (improvement, **breaking**) Throw an error for key collisions between resources and standalone objects. This was previously a warning, so it shouldn't catch anyone by surprise ([#73](https://github.com/zapier/zapier-platform-core/pull/73))
* :exclamation: (improvement, **breaking**) Remove `bundle.environment`. This has always been deprecated, but now it shouldn't show up in the bundle anymore. Given that it hasn't held data, this shouldn't cause a lot of friction ([#72](https://github.com/zapier/zapier-platform-core/pull/72))

## 5.2.0

### cli

* :tada: (new) Add option to `zapier logs` to show bundle logs ([PR](https://github.com/zapier/zapier-platform-cli/pull/291))
* (fix) Fix `zapier build` from crashing on missing packages ([PR](https://github.com/zapier/zapier-platform-cli/pull/301))
* (fix) Fix `zapier convert` from crashing on certain OAuth config ([PR](https://github.com/zapier/zapier-platform-cli/pull/299))
* (fix) Fix `zapier convert` from crashing on a number in auth mapping ([PR](https://github.com/zapier/zapier-platform-cli/pull/305))
* (improvement) `zapier build` prints any errors from `npm install` ([PR](https://github.com/zapier/zapier-platform-cli/pull/288))
* (docs) Add note about nested dynamic functions ([PR](https://github.com/zapier/zapier-platform-cli/pull/296))
* (docs) Add docs about `bundle.cleanedRequest` and `bundle.rawRequest` ([PR](https://github.com/zapier/zapier-platform-cli/pull/298))

### schema

* (fix) Correctly invalidate field grandchildren ([PR](https://github.com/zapier/zapier-platform-schema/pull/40))
* (docs) More examples on functional constraints ([PR](https://github.com/zapier/zapier-platform-schema/pull/39))

### core

* (fix) Raise exception for bad requests when stashing a file ([PR](https://github.com/zapier/zapier-platform-core/pull/75))
* (fix) Better log censoring ([PR](https://github.com/zapier/zapier-platform-core/pull/77))

## 5.1.0

### cli

* :tada: (new) Add "did you mean" on unrecognized commands ([PR](https://github.com/zapier/zapier-platform-cli/pull/278))
* (fix) Fix hang issue when printing data on skinny terminal ([PR](https://github.com/zapier/zapier-platform-cli/pull/283))
* (fix) Server returns error when running `zapier logs --debug` ([PR](https://github.com/zapier/zapier-platform-cli/pull/254))
* (fix) Exclude unwanted files when doing `zapier build --disable-dependency-detection` ([PR](https://github.com/zapier/zapier-platform-cli/pull/258))
* (fix) Don't overwrite `.zapierapprc` completely ([PR](https://github.com/zapier/zapier-platform-cli/pull/275))
* (fix) Fix "CUSTOM_FIELDS_URL is not defined" error for `zapier convert` ([PR](https://github.com/zapier/zapier-platform-cli/pull/277))
* (improvement) Less nagging about updating packages ([PR](https://github.com/zapier/zapier-platform-cli/pull/282))
* (improvement) Add "github" and "search-or-create" example apps ([PR](https://github.com/zapier/zapier-platform-cli/pull/259), [PR2](https://github.com/zapier/zapier-platform-cli/pull/287))
* (improvement) `zapier promote` error messages now look better ([PR](https://github.com/zapier/zapier-platform-cli/pull/280))
* (improvement) Remove unnecessary `.nvmrc` logic ([PR](https://github.com/zapier/zapier-platform-cli/pull/256))
* (improvement) `zapier convert` supports static dropdown ([PR](https://github.com/zapier/zapier-platform-cli/pull/267))
* (improvement) `zapier convert` supports auth mapping better ([PR](https://github.com/zapier/zapier-platform-cli/pull/257))
* (improvement) Fix auth issue with full scripting methods for `zapier convert` ([PR](https://github.com/zapier/zapier-platform-cli/pull/271))
* (improvement) `zapier convert` converts samples, too ([PR](https://github.com/zapier/zapier-platform-cli/pull/266))
* (improvement) `zapier convert` respects auth field keys in test code ([PR](https://github.com/zapier/zapier-platform-cli/pull/274))
* (improvement) `zapier convert` generates `.env` instead of `.environment` ([PR](https://github.com/zapier/zapier-platform-cli/pull/276))
* (improvement) `zapier convert` includes input fields to test code ([PR](https://github.com/zapier/zapier-platform-cli/pull/246))
* (improvement) Fix session auth environment variable name for `zapier convert` ([PR](https://github.com/zapier/zapier-platform-cli/pull/281))
* (docs) FAQ about when to use placeholders or curlies ([PR](https://github.com/zapier/zapier-platform-cli/pull/252))

### schema

* (fix) Only require samples for non-hidden operations ([PR](https://github.com/zapier/zapier-platform-schema/pull/33))
* (fix) Correctly validate `children` as an array of fields ([PR](https://github.com/zapier/zapier-platform-schema/pull/34))
* (fix) Doc rendering issue ([PR](https://github.com/zapier/zapier-platform-schema/pull/35))
* (docs) Add doc annotation ([PR](https://github.com/zapier/zapier-platform-schema/pull/38))

### core

* (improvement) Bump Node version to 6.10.3 ([PR](https://github.com/zapier/zapier-platform-core/pull/69))
* (improvement) Deprecate `.environment` in favor of `.env` ([PR](https://github.com/zapier/zapier-platform-core/pull/70))
* (improvement) Support test framework other than Mocha ([PR](https://github.com/zapier/zapier-platform-core/pull/65))
* (improvement) `z.console.log` also calls `console.log` ([PR](https://github.com/zapier/zapier-platform-core/pull/66))
* (improvement) Check for object in create ([PR](https://github.com/zapier/zapier-platform-core/pull/67))

## 5.0.0

### cli

* :tada: (new) The CLI can now run, test, and build on any version of Node.js! ([PR](https://github.com/zapier/zapier-platform-cli/pull/234))
* :tada: (new) Read deploy key from env if available ([PR](https://github.com/zapier/zapier-platform-cli/pull/239))
* (improvement) More specific error messages for invalid installs ([PR](https://github.com/zapier/zapier-platform-cli/pull/238))
* (fix) `zapier env` no longer throws an error on Node versions >=8.0 ([PR](https://github.com/zapier/zapier-platform-cli/pull/242))
* (improvement) `zapier convert` creates a .gitignore for new apps ([PR](https://github.com/zapier/zapier-platform-cli/pull/237))
* (improvement) `zapier convert` properly escapes labels and descriptions ([PR](https://github.com/zapier/zapier-platform-cli/pull/233), [commit](https://github.com/zapier/zapier-platform-cli/commit/6d8014e9c04abb5f939affd19888c447ae1abca1))
* (improvement) `zapier convert` only sends a token when it exists, not before ([PR](https://github.com/zapier/zapier-platform-cli/pull/236))
* (improvement) `zapier convert` generates .environment and gives hint about editting it ([PR](https://github.com/zapier/zapier-platform-cli/pull/240))
* (improvement) Don't require an `id` field in tests generated by `zapier convert` ([PR](https://github.com/zapier/zapier-platform-cli/pull/243))
* (improvement) `zapier convert` adds track info to package.json ([PR](https://github.com/zapier/zapier-platform-cli/pull/245))
* (docs) FAQ section in the README ([PR](https://github.com/zapier/zapier-platform-cli/pull/231))

### schema

* :exclamation: (improvement, **breaking**) `sample` is now a required field in `BasicOperationSchema` and friends. See [this doc](https://zapier.com/developer/documentation/v2/trigger-sample-results/) for more info ([PR](https://github.com/zapier/zapier-platform-schema/pull/32))
* :exclamation: (improvement, **breaking**) `order` has been removed from `BasicDisplaySchema` ([PR](https://github.com/zapier/zapier-platform-schema/pull/27))

### core

* (improvement) Log when actions generated by a resource collide with manually defined ones ([PR](https://github.com/zapier/zapier-platform-core/pull/63))
* (improvement) Properly log gzipped responses ([PR](https://github.com/zapier/zapier-platform-core/pull/62))


## 4.3.2

* (Fix) [Permission denied with `index.js`.](https://github.com/zapier/zapier-platform-cli/pull/224)
* (Fix) [`zapier convert` didn't escape line breaks in app description.](https://github.com/zapier/zapier-platform-cli/pull/226)
* (Doc) [Add FAQs section.](https://github.com/zapier/zapier-platform-cli/pull/225)
* [Ensure users are authenticated before building or pushing.](https://github.com/zapier/zapier-platform-cli/pull/227)

## 4.3.1

* (Fix) [Broken patching on http.request.](https://github.com/zapier/zapier-platform-core/pull/61)

## 4.3.0

* (New) `zapier convert` now supports [custom auth mapping](https://github.com/zapier/zapier-platform-cli/pull/200), [searchOrCreates](https://github.com/zapier/zapier-platform-cli/pull/207) and ["Send to Action Endpoint URL in JSON body" checkbox](https://github.com/zapier/zapier-platform-cli/pull/204).
* (New) [`zapier scaffold` now also creates a test.](https://github.com/zapier/zapier-platform-cli/pull/212)
* (New) [Allow ordering static dropdowns.](https://github.com/zapier/zapier-platform-schema/pull/30)
* (Fix) [Properly replace variables in URLs in `zapier convert` generated code.](https://github.com/zapier/zapier-platform-cli/pull/208)
* (Fix) [Fix TypeError in `http.request` patch.](https://github.com/zapier/zapier-platform-core/pull/59)
* (Doc) [Clarify pushing doesn't reload browser automatically.](https://github.com/zapier/zapier-platform-cli/pull/218)
* [Use working endpoints for scaffolds.](https://github.com/zapier/zapier-platform-cli/pull/215)
* [Notify for update less often.](https://github.com/zapier/zapier-platform-cli/pull/210)
* [Introduce Prettier into development process.](https://github.com/zapier/zapier-platform-cli/pull/209)
* [Ensure all template code use z.JSON.parse.](https://github.com/zapier/zapier-platform-cli/pull/216)

## 4.2.3

* The first build made by Travis CI!

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
