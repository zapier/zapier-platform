## 15.16.1

_released `2024-10-04`_

### cli

None!

### core

- :hammer: Return a descriptive error when a filename cannot be uploaded ([#874](https://github.com/zapier/zapier-platform/pull/874))

### schema 

None!

### misc

- :scroll: Add canary command to docs ([#870](https://github.com/zapier/zapier-platform/pull/870))
- :scroll: Add instructions for installing the Zapier Platform development version to docs ([#873](https://github.com/zapier/zapier-platform/pull/870))

## 15.16.0 

_released `2024-09-24`_

### cli

- :nail_care: Introduce zapier canary command ([#861](https://github.com/zapier/zapier-platform/pull/861))

### core

None!

### schema 

None!

### misc

- :hammer: Bump vite from 5.3.3 to 5.4.7 in /schema-to-ts ([#868](https://github.com/zapier/zapier-platform/pull/868))
- :hammer: Bump rollup from 4.18.1 to 4.22.4 in /schema-to-ts ([#867](https://github.com/zapier/zapier-platform/pull/867))

## 15.15.0

_released `2024-09-18`_

This release introduces "[Buffered Create Actions](https://github.com/zapier/zapier-platform/blob/8353f32cba12da2a845419f0024b0029090437d9/packages/cli/README.md#buffered-create-actions)", currently only available for **internal** use. A Buffered Create allows you to create objects in bulk with a single or fewer API request(s). This is useful when you want to reduce the number of requests made to your server. When enabled, Zapier holds the data until the buffer reaches a size limit or a certain time has passed, then sends the buffered data using the `performBuffer` function you define.

### cli

None!

### core

- :test_tube: Add checks to support Buffered Create Actions ([#832](https://github.com/zapier/zapier-platform/pull/832))

### schema

- :test_tube: Add `performBuffer` and `buffer` to `operation` schema to support Buffered Create Actions ([#832](https://github.com/zapier/zapier-platform/pull/832))

## 15.14.2

_released `2024-09-17`_

### cli

None!

### core

- :bug: Ensure censoring of OAuth1 tokens in HTTP logs ([#864](https://github.com/zapier/zapier-platform/pull/864))

### schema

None!

### misc

None!

## 15.14.1

_released `2024-09-12`_

### cli

None!

### core

- :nail_care: Add `signal` to z.request options ([#857](https://github.com/zapier/zapier-platform/pull/857))

### schema

None!

### misc

- :scroll: Add documentation around `inputFormat` field type ([#858](https://github.com/zapier/zapier-platform/pull/858))

## 15.14.0

_released `2024-08-28`_

### cli

None!

### core

- :nail_care: Add scopes as an option for zcache usage ([#849](https://github.com/zapier/zapier-platform/pull/849))

### schema

None!

### misc

- :hammer: Add `customOptions` field to z.request options ([#846](https://github.com/zapier/zapier-platform/pull/846))

## 15.13.0 

_released `2024-08-21`_

### cli

None!

### core

None!

### schema 
- :nail_care: Add configurable poll delay for HookToPoll ([#844](https://github.com/zapier/zapier-platform/pull/844))

### misc
- :hammer: Bump elliptic from 6.5.4 to 6.5.7 ([#842](https://github.com/zapier/zapier-platform/pull/842))
- :hammer: Bump axios from 1.6.1 to 1.7.4 ([#843](https://github.com/zapier/zapier-platform/pull/843))

## 15.12.0

_released `2024-08-16`_

### cli 
- :nail_care: Introduce `zapier pull` command ([#838](https://github.com/zapier/zapier-platform/pull/838))
- :nail_care: Handle subheadings when interpreting the changelog ([#827](https://github.com/zapier/zapier-platform/pull/827))

### core 
- :bug: Properly type HTTP Options, replacing generic `object` types ([#840](https://github.com/zapier/zapier-platform/pull/840))
- :bug: Allow Async Middleware Functions Types ([#826](https://github.com/zapier/zapier-platform/pull/826))

### schema
- :bug: Correct casing on `bulk reads` action type ([#831](https://github.com/zapier/zapier-platform/pull/831))
- :bug: Display the `bulk_reads` functional constraint ([#829](https://github.com/zapier/zapier-platform/pull/829))

### schema-to-ts
- :bug: Simplify and correct Array types in Schema to TS conversion ([#835](https://github.com/zapier/zapier-platform/pull/835))

### misc 

- :scroll: Improve documentation accuracy regarding `primary: true` limitations ([#836](https://github.com/zapier/zapier-platform/pull/836))
- :scroll: Document limitations regarding `primary` in `outputFields` ([#834](https://github.com/zapier/zapier-platform/pull/834))
- :scroll: Document `bundle.meta.withSearch` ([#823](https://github.com/zapier/zapier-platform/pull/823))

## 15.11.1

_released `2024-07-19`_

### core
- :bug: Add base64 encoding before autostashing large payloads ([#824](https://github.com/zapier/zapier-platform/pull/824))

### cli

None!

### schema

None! 

## 15.11.0

_released `2024-07-16`_

### core
- :bug: Fixed issue preventing standalone 'creates' in `extension` from colliding with resource keys in `base` ([#819](https://github.com/zapier/zapier-platform/pull/819))
- :nail_care: Bundle new TypeScript type declarations provided by the `schema-to-ts` tool ([#818](https://github.com/zapier/zapier-platform/pull/818))

### cli
None!

### schema
None!

### schema-to-ts
- :nail_care: Introduced the Schema-to-TS compiler tool ([#818](https://github.com/zapier/zapier-platform/pull/818))
- :scroll: Updated documentation to reference the schema-to-ts tool ([#821](https://github.com/zapier/zapier-platform/pull/821))


## 15.10.0

_released `2024-07-02`_

### cli

None!

### core

- :nail_care: Update extendAppRaw to override arrays as well as objects ([#813](https://github.com/zapier/zapier-platform/pull/813))
- :nail_care: Increase hydration payload limit ([#816](https://github.com/zapier/zapier-platform/pull/816))
- :nail_care: Add allowlist for specific content types to log HTTP response/response for in patched HTTP client ([#810](https://github.com/zapier/zapier-platform/pull/810))

### schema

None!

## 15.9.1

_released `2024-06-27`_

### cli

None!

### core

- :bug: Fix afterApp large response cacher bug ([#814](https://github.com/zapier/zapier-platform/pull/814))

### schema

None!

## 15.9.0

_released `2024-06-26`_

### cli

None!

### core

- :nail_care: Allow relative paths via z.require() ([#809](https://github.com/zapier/zapier-platform/pull/809))
- :nail_care: Handle large response payloads ([#808](https://github.com/zapier/zapier-platform/pull/808))

### schema

None!

## 15.8.0

_released `2024-06-13`_

### cli

- :scroll: Add docs for domain and subdomain validation as Authentication subheading ([#797](https://github.com/zapier/zapier-platform/pull/797))
- :scroll: Document performResume default implementation ([#806](https://github.com/zapier/zapier-platform/pull/806))

### core

- :nail_care: Throw error for HTTP redirect made to disallowed domains ([#803](https://github.com/zapier/zapier-platform/pull/803))

### schema

- :test_tube: Add support for `retry` and `filter` at the root-level of the throttle configuration ([#796](https://github.com/zapier/zapier-platform/pull/796))
- :bug: Update createsSchema to disallow additional properties ([#798](https://github.com/zapier/zapier-platform/pull/798))

### misc

- :hammer: Bump jquery from 2.1.4 to 3.5.0 in the legacy-scripting-runner ([#790](https://github.com/zapier/zapier-platform/pull/790))
- :hammer: Bump marked from 0.3.19 to 4.2.12 ([#793](https://github.com/zapier/zapier-platform/pull/793))
- :hammer: Bump braces from 3.0.2 to 3.0.3 ([#805](https://github.com/zapier/zapier-platform/pull/805))

## 15.7.3

_released `2024-05-27`_

### cli

- :bug: Address `CVE-2024-27980` changes in Node.js by always passing `shell: true` as an option for `spawn()` in Windows OS environments (thanks to @jaydamani for the report!) ([#788](https://github.com/zapier/zapier-platform/pull/788)).

## 15.7.2

_released `2024-05-08`_

### cli

- :scroll: Correct docs about `zapier migrate --user` ([#779](https://github.com/zapier/zapier-platform/pull/779))

### core

- :bug: Censor set-cookie response header in logs ([#780](https://github.com/zapier/zapier-platform/pull/780))

### misc

- :wrench: Dependency updates
  - Bump semver from 5.7.1 to 7.5.2 ([#776](https://github.com/zapier/zapier-platform/pull/776))
  - Bump ejs from 3.1.7 to 3.1.10 ([#777](https://github.com/zapier/zapier-platform/pull/777))
  - Bump debug from 4.1.1 to 4.3.4 ([#778](https://github.com/zapier/zapier-platform/pull/778))

## 15.7.1

_released `2024-05-01`_

### cli

- :scroll: Add instruction to close resolved issues after promotion in the docs ([#770](https://github.com/zapier/zapier-platform/pull/770))
- :scroll: Remove the note on `redirect_uri` change after publish in the docs ([#774](https://github.com/zapier/zapier-platform/pull/774))

### core

- :bug: Fix `null` response content breaking the search for sensitive values ([#772](https://github.com/zapier/zapier-platform/pull/772))

### schema

None!

### misc

- :bug: Fix the legacy-scripting-runner's ErrorException invalid JSON data ([#773](https://github.com/zapier/zapier-platform/pull/773))
- :hammer: Bump tar from 6.1.0 to 6.2.1 ([#771](https://github.com/zapier/zapier-platform/pull/771))

## 15.7.0

_released `2024-04-09`_

### cli

- :scroll: Added missing 'to' in CLI docs ([#767](https://github.com/zapier/zapier-platform/pull/767))

### core

- :nail_care: Raised max file size for upload streaming to 1GB ([#768](https://github.com/zapier/zapier-platform/pull/768))

### schema

None!

## 15.6.2

_released `2024-04-03`_

### cli

None!

### core

- :bug: Censor entire response content when refreshing or getting new auth token ([#765](https://github.com/zapier/zapier-platform/pull/765))

### schema

None!

## 15.6.1

_released `2024-03-28`_

### cli

- :scroll: Update document on the `primary` property in `outputFields` ([#763](https://github.com/zapier/zapier-platform/pull/763))
- :scroll: Update document on the throttle configuration to include `retry` in the `overrides` attributes ([#761](https://github.com/zapier/zapier-platform/pull/761))

### core

None!

### schema

- :test_tube: Add support for `retry` in the `overrides` object of the throttle configuration ([#761](https://github.com/zapier/zapier-platform/pull/761))

### misc

- :wrench: Fix failing tests in dependabot's PRs ([#762](https://github.com/zapier/zapier-platform/pull/762))

## 15.6.0

_released `2024-03-26`_

### cli

- :scroll: Document `allowGetBody` option in `z.request()` ([#752](https://github.com/zapier/zapier-platform/pull/752))
- :scroll: Update document on the throttle configuration to include `key` and `overrides` attributes, and `action` scope ([#760](https://github.com/zapier/zapier-platform/pull/760))

### core

- :wrench: Change trigger output check logic for the newly-added `primary` property in `outputFields` ([#754](https://github.com/zapier/zapier-platform/pull/754))

### schema

- :tada: Allow to set `primary` in `outputFields` to define the unique key for [deduplication](https://github.com/zapier/zapier-platform/blob/main/packages/cli/README.md#how-does-deduplication-work) ([#754](https://github.com/zapier/zapier-platform/pull/754))
- :test_tube: Add support for `overrides` in the throttle configuration ([#755](https://github.com/zapier/zapier-platform/pull/755))
- :test_tube: Add support for `key` in the throttle configuration and `action` scope ([#757](https://github.com/zapier/zapier-platform/pull/757))

## 15.5.3

_released `2024-02-08`_

### cli

- :bug: Fixed bug in `zapier validate` where `zapier-platform-core` was failing to import on version `15.5.2` ([#746](https://github.com/zapier/zapier-platform/pull/746))

## 15.5.2

_released `2024-02-06`_

### cli

- :bug: Fixed bug in `zapier convert` that crashes due to syntax error in user's code and should not replace `source` in sample ([#730](https://github.com/zapier/zapier-platform/pull/730))
- :bug: Improved handling of broken symlinks while copying files to temp directory during the build process ([#737](https://github.com/zapier/zapier-platform/pull/737))
- :bug: Fixed bug in `zapier build` where it failed to run in npm workspaces ([#738](https://github.com/zapier/zapier-platform/pull/738), [#742](https://github.com/zapier/zapier-platform/pull/742))
- :bug: Fixed converting triggers breaking when trigger key starts with a number ([#741](https://github.com/zapier/zapier-platform/pull/741))
- :wrench: Upgraded @oclif/plugin-help dependency, addressing security issue with sub-dependency ([#739](https://github.com/zapier/zapier-platform/pull/739))
- :wrench: Updated the "custom-auth" sample to avoid a warning when running zapier validate ([#724](https://github.com/zapier/zapier-platform/pull/724))

### core

- :bug: Updated TypeScript method types in RawHttpResponse ([#735](https://github.com/zapier/zapier-platform/pull/735))
- :bug: Use node-fetch TypeScript types in BaseHttpResponse ([#736](https://github.com/zapier/zapier-platform/pull/736))

### misc

- :scroll: Updated rest hook tutorial to include content for expiring webhooks ([#731](https://github.com/zapier/zapier-platform/pull/731))
- :scroll: Documenting 5 min cache behavior of hydration and how to workaround ([#740](https://github.com/zapier/zapier-platform/pull/740))

## 15.5.1

_released `2023-11-21`_

### cli

- :scroll: Update `zapier logs` documentation to mention default user target ([#721](https://github.com/zapier/zapier-platform/pull/721))

### core

- :nail_care: Allow server to decide when to truncate log fields ([#725](https://github.com/zapier/zapier-platform/pull/725))

### schema

None!

### misc

- :hammer: Bump axios from 1.2.3 to 1.6.1 ([#726](https://github.com/zapier/zapier-platform/pull/726))

## 15.5.0

_released `2023-11-08`_

### cli

None!

### core

None!

### schema

- :nail_care: Add `steadyState` property on the FieldSchema for steady state deduplication on trigger polls ([#721](https://github.com/zapier/zapier-platform/pull/721))

### misc

- :hammer: Bump browserify-sign from 4.0.4 to 4.2.2 ([#719](https://github.com/zapier/zapier-platform/pull/719))

## 15.4.2

_released `2023-11-01`_

### cli

- :scroll: Update `z.cursor` documentation for handling end of the result set ([#703](https://github.com/zapier/zapier-platform/pull/703))

### core

- :hammer: Bump secret-scrubber-js to v1.0.8 ([#717](https://github.com/zapier/zapier-platform/pull/717))

### schema

- :scroll: Correct the 'value' and 'sample' description in the 'FieldChoicesWithLabel' schema ([#716](https://github.com/zapier/zapier-platform/pull/716))

### misc

- :hammer: Bump @babel/traverse from 7.14.0 to 7.23.2 ([#715](https://github.com/zapier/zapier-platform/pull/715))

- :scroll: Fix broken link in README-source.md ([#714](https://github.com/zapier/zapier-platform/pull/714))

- :scroll: Fix broken link in readme.md ([#713](https://github.com/zapier/zapier-platform/pull/713))

## 15.4.1

_released `2023-10-06`_

### cli

None!

### core

None!

### schema

- :bug: Fixed throttle configuration not being allowed on triggers ([#711](https://github.com/zapier/zapier-platform/pull/711))

### misc

None!

## 15.4.0

_released `2023-10-06`_

### cli

None!

### core

- :bug: Added handling the use of non-string cursors in `z.cursor.set()` ([#705](https://github.com/zapier/zapier-platform/pull/705))

### schema

- :tada: Added support for throttle configuration ([#709](https://github.com/zapier/zapier-platform/pull/709))

### misc

- :bug: Fixed building of boilerplate having lingering old files from previous builds ([#708](https://github.com/zapier/zapier-platform/pull/708))
- :hammer: Bumped get-func-name version from 2.0.0 to 2.0.2 ([#707](https://github.com/zapier/zapier-platform/pull/707))

## 15.3.0

_released `2023-09-19`_

### cli

None!

### core

None!

### schema

- :nail_care: (Experimental) Extend Custom Auth to support OTP ([#702](https://github.com/zapier/zapier-platform/pull/702))

### misc

- :scroll: Bring over paging cursor doc changes added in visual-builder repo ([#701](https://github.com/zapier/zapier-platform/pull/701))
- :bug: Updating example Github app unit tests ([#700](https://github.com/zapier/zapier-platform/pull/700))
- :scroll: Update version mismatch ([#699](https://github.com/zapier/zapier-platform/pull/699))
- :bug: Fix legacy scripting runner test ([#697](https://github.com/zapier/zapier-platform/pull/697))

## 15.1.0

_released `2023-09-07`_

### cli

- :bug: Removed the logic converting an empty array to undefined in changelog metadata ([#690](https://github.com/zapier/zapier-platform/pull/690))
- :nail_care: Integration title length must be at least 2 characters ([#693](https://github.com/zapier/zapier-platform/pull/693))

### core

None!

### schema

None!

### legacy-scripting-runner

- :bug: Fixed a flaky test for legacy scripting runner ([#697](https://github.com/zapier/zapier-platform/pull/697))

### misc

- :scroll: Added links to relevant support documentation ([#692](https://github.com/zapier/zapier-platform/pull/692))
- :scroll: Fixed markdown formatting for backtick usage ([#691](https://github.com/zapier/zapier-platform/pull/691))
- :scroll: Added detail on encoding defaults in the API documentation ([#689](https://github.com/zapier/zapier-platform/pull/689))
- :scroll: Added detail on OAuth state parameter in the API documentation ([#683](https://github.com/zapier/zapier-platform/pull/683))
- :scroll: Minor updates to CLI documentation and rebuild ([#688](https://github.com/zapier/zapier-platform/pull/688))
- :scroll: Moved up template explanation in README ([#682](https://github.com/zapier/zapier-platform/pull/682))
- :scroll: Added detail on the 'computed' flag in the API documentation ([#686](https://github.com/zapier/zapier-platform/pull/686))
- :scroll: Added detail on callback URL parameter in the API documentation ([#687](https://github.com/zapier/zapier-platform/pull/687))
- :scroll: Updated GitHub CLI tutorial app documentation ([#679](https://github.com/zapier/zapier-platform/pull/679))
- :hammer: Bumped word-wrap version from 1.2.3 to 1.2.4 ([#680](https://github.com/zapier/zapier-platform/pull/680))
- :hammer: Bumped cli, core, schema from 15.0.0 to 15.0.1 ([#678](https://github.com/zapier/zapier-platform/pull/678))

## 15.0.1

_released `2023-07-10`_

### cli

- :bug: `zapier convert` now uses jest test template scaffold instead of mocha ([#674](https://github.com/zapier/zapier-platform/pull/674))

### core

None!

### schema

None!

### misc

- :scroll: Documentation update related to example apps ([#675](https://github.com/zapier/zapier-platform/pull/675), [#672](https://github.com/zapier/zapier-platform/pull/672), [#671](https://github.com/zapier/zapier-platform/pull/671))
- :scroll: Documentation update related to outdated hyperlinks ([#673](https://github.com/zapier/zapier-platform/pull/673))
- :scroll: Documentation update to match public platform docs ([#670](https://github.com/zapier/zapier-platform/pull/670))

## 15.0.0

_released `2023-06-30`_

Version `15.0.0` is a breaking change release that contains several important upgrades and deprecations. Here is a brief breakdown of the changes (**:exclamation: denotes a breaking change**):

- **:exclamation: Changelog is required for promotions.**
  Prior to v15.0.0, providing a changelog was optional for promoting an app; this is now required. You can also append changelog metadata to help categorize whether the changes are related to bug fixes or a new feature.

- **:exclamation: Remove `important` field from the schema.**
  The `important` field was deprecated in `v14.0.1` ([#644](https://github.com/zapier/zapier-platform/pull/644)) and now we are removing it in this release.

- **:exclamation: Apps can now use Node.js v18.x and Node.js v14.x is no longer supported.**
  (a) Any integrations that depend on `zapier-platform-core@15.0.0` will now run on Node.js 18.
  (b) We are dropping support for Node.js 14, which has been designated end-of-life since 2023-04-30 ([see the Node.js release schedule](https://github.com/nodejs/release#release-schedule)).

### cli

- :bug: `zapier convert` now uses jest test template scaffold instead of mocha ([#674](https://github.com/zapier/zapier-platform/pull/674))
- :bug: `zapier login --sso` points to the correct link for fetching Deploy Keys ([#666](https://github.com/zapier/zapier-platform/pull/666))
- :bug: `zapier convert` should convert `source` fields ([#660](https://github.com/zapier/zapier-platform/pull/660))
- :exclamation: Changelog is required for promotions ([#653](https://github.com/zapier/zapier-platform/pull/653))

### core

- :exclamation: Apps can now use Node.js v18.x and Node.js v14.x is no longer supported ([#665](https://github.com/zapier/zapier-platform/pull/665))

### schema

- :exclamation: Remove `important` field from the schema ([#662](https://github.com/zapier/zapier-platform/pull/662))

### misc

- :scroll: Documentation update related to redirect caveat in public apps ([#661](https://github.com/zapier/zapier-platform/pull/661))
- :scroll: Documentation update related to supplement the "Output Fields" section ([#654](https://github.com/zapier/zapier-platform/pull/654))

- :hammer: Dependency updates ([#668](https://github.com/zapier/zapier-platform/pull/668), [#665](https://github.com/zapier/zapier-platform/pull/665))

  CLI

  - Bump `@oclif/command@1.8.21` to `@oclif/command@1.8.27`
  - Bump `@oclif/config@1.18.6` to `@oclif/command@1.18.10`
  - Bump `fs-extra@10.0.0` to `@oclif/command@11.1.1`
  - Bump `jscodeshift@0.14.0` to `jscodeshift@0.15.0`
  - Bump `marked-terminal@5.1.1` to `marked-terminal@5.2.0`
  - Bump `prettier@2.8.3` to `prettier@2.8.8`
  - Bump `read@2.0.0` to `read@2.1.0`
  - Bump `semver@7.3.8` to `semvar@7.5.2`
  - Bump `yeoman-generator@5.7.0` to `yeoman-generator@5.9.0`
  - Bump `nock@13.3.0` to `nock@13.3.1`

  Core

  - Bump `node-abort-controller@3.0.1` to `node-abort-controller@3.1.1`
  - Bump `semver@7.3.5` to `semvar@7.5.2`
  - Bump `aws-sdk@2.1300.0` to `aws-sdk@2.1397.0`
  - Bump `fs-extra@10.0.0` to `fs-extra@11.1.1`
  - Bump `@types/node@18.11.18` to `@types/node@20.3.1`

  Legacy

  - Bump `moment-timezone@0.5.35` to `moment-timezone@0.5.43`
  - Bump `aws-sdk@2.1300.0` to `aws-sdk@2.1397.0`
  - Bump `nock@13.3.0` to `nock@13.3.1`

  Schema

  - Bump `jsonschema@1.2.2` to `jsonschema@1.4.1`
  - Bump `fs-extra@10.0.0` to `fs-extra@11.1.1`

## 14.1.1

_released `2023-06-07`_

### cli

- :scroll: Improve docs related to expected behaviors for configuring OAuth2 with PKCE ([#655](https://github.com/zapier/zapier-platform/pull/655))
- :scroll: Improve docs related to hydration payload limit([#656](https://github.com/zapier/zapier-platform/pull/656))
- :hammer: Dependency updates
  - Bump `typescript` in template generator from 4.2.4 to 4.9.4 ([#657](https://github.com/zapier/zapier-platform/pull/657))

### core

- None!

### schema

- None!

### misc

- None!

## 14.0.1

_released `2023-05-22`_

### cli

- :bug: Fix duplicate authentication field keys being generated by the `zapier convert` command ([#639](https://github.com/zapier/zapier-platform/pull/639))
- :bug: Fix missing `key` property in the `.zapierapprc` file after running the `zapier convert` command ([#640](https://github.com/zapier/zapier-platform/pull/640))
- :scroll: Improve docs related to expected behaviors for stale authentication ([#647](https://github.com/zapier/zapier-platform/pull/647))

### core

- None!

### schema

- :scroll: Deprecate the `important` key of the `BasicDisplaySchema`. This property will be removed and hence a breaking change ❗ in the next major version release. ([#644](https://github.com/zapier/zapier-platform/pull/644))

### misc

- :hammer: Dependency updates
  - Bump `moment` from 2.24.0 to 2.29.4 ([#635](https://github.com/zapier/zapier-platform/pull/635))
  - Bump `minimatch` from 3.0.4 to 3.0.5 ([#634](https://github.com/zapier/zapier-platform/pull/634))

## 14.0.0

_released `2023-03-21`_

Version `14.0.0` is a breaking change release that contains several important upgrades and deprecations. Here is a brief breakdown of the changes (**:exclamation: denotes a breaking change**):

1. :exclamation: [`altersDynamicFields`](https://github.com/zapier/zapier-platform/blob/zapier-platform-schema@14.0.0/packages/schema/docs/build/schema.md#fieldschema) no longer defaults to true when [`dynamic`](https://github.com/zapier/zapier-platform/blob/zapier-platform-schema@14.0.0/packages/schema/docs/build/schema.md#fieldschema) is set. You should now set the flag appropriately. If a dynamic dropdown (i.e. a field with `dynamic` set) should refresh other input fields, you must set `altersDynamicFields` to true on v14.

   ```
   inputFields: [
     {
       key: 'city',
       dynamic: 'city.id.name',
       altersDynamicFields: true  // <- set this appropriately on v14
     }
   ]
   ```

2. :exclamation: Before v14, the Zap editor didn't really use [`canPaginate`](https://github.com/zapier/zapier-platform/blob/zapier-platform-schema@14.0.0/packages/schema/docs/build/schema.md#basicpollingoperationschema). Instead, it made two requests and compared them to determine if pagination is supported. Starting from v14, `canPaginate` is required for the Zap editor to show the [Load More](https://cdn.zappy.app/2d13ed0a921268482abe8ff7d0cd6e38.png) button for pagination.

   ```
   triggers: {
     contact: {
       operation: {
         canPaginate: true  // <- set this appropriately on v14
       }
     }
   }
   ```

3. :exclamation: Now you are required to provide meta information about your app, such as your intended audience and app category (if that information isn't already provided). If you are missing this information, you will be blocked from making updates to your integration (`zapier promote`, `zapier upload`, `zapier push`). Use `zapier register` with `zapier-platform-core@14.0.0` or go to `https://developer.zapier.com/app/{app_id}/version/{version}/settings` to fill it out.

4. On v14, OAuth2 implementation now supports PKCE! See [our documentation](https://github.com/zapier/zapier-platform/blob/zapier-platform-cli@14.0.0/packages/cli/README.md#oauth2-with-pkce) for details.

Read on for a detailed set of release notes. Again, :exclamation: are BREAKING CHANGEs.

### cli

- :exclamation: Implement individual field flags for `register` command ([#618](https://github.com/zapier/zapier-platform/pull/618))
- :exclamation: Block `promote`, `upload`, and `push` for missing required app info ([#612](https://github.com/zapier/zapier-platform/pull/612))
- :nail_care: Use uniform field names in check-missing-app-info util ([#630](https://github.com/zapier/zapier-platform/pull/630))
- :nail_care: Only require fields for private integrations via CLI ([#628](https://github.com/zapier/zapier-platform/pull/628))
- :nail_care: Implement `--yes` flag for `register` command ([#627](https://github.com/zapier/zapier-platform/pull/627))
- :scroll: Improve documentation on throttling ([#631](https://github.com/zapier/zapier-platform/pull/631))
- :scroll: Add documentation for PKCE OAuth2 ([#629](https://github.com/zapier/zapier-platform/pull/629))
- :scroll: Add information about how to return line items ([#620](https://github.com/zapier/zapier-platform/pull/620))
- :scroll: Fix 'integraiton' typo in CLI docs ([#613](https://github.com/zapier/zapier-platform/pull/613))

### core

- :hammer: bump http-cache-semantics from 4.1.0 to 4.1.1 ([#617](https://github.com/zapier/zapier-platform/pull/617))

### schema

- :tada: Add `enablePkce` to `oauth2Config` ([#623](https://github.com/zapier/zapier-platform/pull/623))
- :hammer: `searchAndCreates` and `searchOrCreates` can coexist to avoid search key collision ([#624](https://github.com/zapier/zapier-platform/pull/624))
- :scroll: Add clarity on role of `performList` for testing REST Hooks ([#619](https://github.com/zapier/zapier-platform/pull/619))

### misc

- :scroll: Small followup improvement on GitHub issue templates ([#625](https://github.com/zapier/zapier-platform/pull/625))
- :scroll: Replace issue templates with GitHub forms, update CODEOWNERS ([#622](https://github.com/zapier/zapier-platform/pull/622))

## Old Releases
  
<a id="1300"></a>
<a id="1221"></a>
<a id="1220"></a>
<a id="1210"></a>
<a id="1203"></a>
<a id="1202"></a>
<a id="1201"></a>
<a id="1200"></a>
<a id="1133"></a>
<a id="1132"></a>
<a id="1131"></a>
<a id="1130"></a>
<a id="1120"></a>
<a id="1111"></a>
<a id="1110"></a>
<a id="1101"></a>
<a id="1100"></a>
<a id="1020"></a>
<a id="1013"></a>
<a id="1012"></a>
<a id="1011"></a>
<a id="1010"></a>
<a id="1001"></a>
<a id="1000"></a>
<a id="973"></a>
<a id="972"></a>
<a id="971"></a>
<a id="970"></a>
<a id="960"></a>
<a id="950"></a>
<a id="942"></a>
<a id="940"></a>
<a id="930"></a>
<a id="920"></a>
<a id="910"></a>
<a id="900"></a>
<a id="842"></a>
<a id="841"></a>
<a id="840"></a>
<a id="830"></a>
<a id="821"></a>
<a id="820"></a>
<a id="810"></a>
<a id="801"></a>
<a id="800"></a>
<a id="761"></a>
<a id="760"></a>
<a id="750"></a>
<a id="740"></a>
<a id="730"></a>
<a id="722"></a>
<a id="721"></a>
<a id="720"></a>
<a id="710"></a>
<a id="700"></a>
<a id="610"></a>
<a id="600"></a>
<a id="520"></a>
<a id="510"></a>
<a id="500"></a>
<a id="432"></a>
<a id="431"></a>
<a id="430"></a>
<a id="423"></a>
<a id="421"></a>
<a id="420"></a>
<a id="410"></a>
<a id="400"></a>
<a id="330"></a>
<a id="321"></a>
<a id="320"></a>
<a id="310"></a>
<a id="301"></a>
<a id="300"></a>
<a id="220"></a>
<a id="210"></a>
<a id="201"></a>
<a id="200"></a>
<a id="1011"></a>
<a id="1010"></a>
<a id="109"></a>
<a id="108"></a>
<a id="107"></a>
<a id="106"></a>
<a id="105"></a>
<a id="104"></a>
<a id="103"></a>
<a id="102"></a>
<a id="101"></a>
<a id="100"></a>
<a id="0102"></a>
<a id="0101"></a>
<a id="0100"></a>
<a id="0912"></a>
<a id="0910"></a>
<a id="099"></a>

The changelogs for older versions can be found in the [changelog](https://github.com/zapier/zapier-platform/tree/main/changelog) directory.
