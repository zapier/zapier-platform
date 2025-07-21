## 17.3.1

_Released 2025-07-17_

### cli

- :bug: Fix regression bugs with `zapier build --skip-npm-install`, where:
  - it can miss local packages files when building in a Lerna monorepo ([#1068](https://github.com/zapier/zapier-platform/pull/1068))
  - it can fail with "Configuration property ... is not defined" when [config](https://www.npmjs.com/package/config) package is used ([#1071](https://github.com/zapier/zapier-platform/pull/1071))
- :nail_care: Improve some error messages in `zapier build` ([#1070](https://github.com/zapier/zapier-platform/pull/1070))

### core

- :nail_care: Improve the error message when the app module fails to import ([#1070](https://github.com/zapier/zapier-platform/pull/1070))

### schema

None!

## 17.3.0

_Released 2025-07-01_

This release introduces two major improvements: `zapier build` and input field grouping.

The `zapier build` command has been revamped to:
- Better support npm/yarn/pnpm workspaces
- Run faster when the `--skip-npm-install` flag is enabled
- Test the build.zip file to verify all load-time dependencies are included (not applicable on Windows)

Input Field Grouping:
- Grouping support, intended for visual purpose in products, has been added to the input fields.

### cli

- :nail_care: `zapier build` supports npm/yarn/pnpm workspaces and runs faster ([#1052](https://github.com/zapier/zapier-platform/pull/1052))
- :bug: Fix a bug where `zapier build` can select the wrong entry point of a dependency ([#1052](https://github.com/zapier/zapier-platform/pull/1052) - [c004298](https://github.com/zapier/zapier-platform/pull/1052/commits/c004298a1b61b7de777f3c8222949c7d38d8826f))
- :scroll: Update docs for new days before deprecation and sending emails ([#1056](https://github.com/zapier/zapier-platform/pull/1056))

### core

- :bug: Fix a bug where Fetch logger crashes when response doesn't have content-type ([#1062](https://github.com/zapier/zapier-platform/pull/1062))
- :bug: Fix a bug where `text/xml` response content should be logged ([#1058](https://github.com/zapier/zapier-platform/pull/1058))
- :nail_care: Typing update: allow overriding `id` requirement in polling triggers ([#1059](https://github.com/zapier/zapier-platform/pull/1059))
- :nail_care: Typing update: allow test bundles to be recursively partial ([#1057](https://github.com/zapier/zapier-platform/pull/1057))
- :hammer: Bump fernet from 0.4.0 to 0.3.3 (latest) ([#1055](https://github.com/zapier/zapier-platform/pull/1055))

### schema

- :tada: Input fields now support visual grouping through the "group" property of the `/PlainInputFieldSchema` and the new `/InputFieldGroupsSchema` ([#1061](https://github.com/zapier/zapier-platform/pull/1061))

## 17.2.0

_Released 2025-06-11_


### cli

None!

### core

- :tada: Add before middleware to fetch stashed bundles for improved large payload handling ([#1050](https://github.com/zapier/zapier-platform/pull/1050))

### schema

None!

## 17.1.0

_Released 2025-06-10_

### cli

- :tada: `zapier convert` now accepts an app definition via the `--json` flag ([#1048](https://github.com/zapier/zapier-platform/pull/1048))
- :nail_care: `zapier deprecate` now prompts for deprecation reason ([#1045](https://github.com/zapier/zapier-platform/pull/1045))

### core

None!

### schema

None!

## 17.0.4

_Released 2025-06-03_

### cli

- :bug: Fix "Cannot find module..." error after running `zapier build` on a CJS integration using hybrid packages([#1046](https://github.com/zapier/zapier-platform/pull/1046))

### core

None!

### schema

None!

## 17.0.3

_Released 2025-05-30_

### cli

- :bug: Fix "Cannot find base config file" tsconfig warning on `zapier build` ([#1033](https://github.com/zapier/zapier-platform/pull/1033))

### core

- :bug: Fix various bugs with `{{curlies}}` replacement ([#1032](https://github.com/zapier/zapier-platform/pull/1032))
- :bug: Remove request body fields with undefined `{{curlies}}` when the content-type is `application/x-www-form-urlencoded` ([#1044](https://github.com/zapier/zapier-platform/pull/1044))
- :bug: `{{curlies}}` in `requestTemplate` aren't properly replaced ([#1034](https://github.com/zapier/zapier-platform/pull/1034))
- :bug: Fix unexpected line breaks in logged response content ([#1042](https://github.com/zapier/zapier-platform/pull/1042))

### schema

None!

### misc

- :scroll: Update example apps: [oauth2](https://github.com/zapier/zapier-platform/tree/8fcadb7d8eaa10d4eb99b84ec8df70a0bb9b8e16/example-apps/oauth2), [typescript](https://github.com/zapier/zapier-platform/tree/8fcadb7d8eaa10d4eb99b84ec8df70a0bb9b8e16/example-apps/typescript), [typescript-esm](https://github.com/zapier/zapier-platform/tree/8fcadb7d8eaa10d4eb99b84ec8df70a0bb9b8e16/example-apps/typescript-esm) ([#1036](https://github.com/zapier/zapier-platform/pull/1036))

## 17.0.2

_Released 2025-05-19_

### cli

- :bug: Fix crashing issues on Windows ([#1024](https://github.com/zapier/zapier-platform/pull/1024))
- :nail_care: Default to ESM for `zapier init` if template supports it ([#1026](https://github.com/zapier/zapier-platform/pull/1026))

### core

- :bug: ESM apps can't import `define` helpers from `zapier-platform-core` ([#1018](https://github.com/zapier/zapier-platform/pull/1018))

### schema

None!

## 17.0.1

_Released 2025-05-14_

### cli

- :bug: `zapier init` Typescript template OAuth2 implementation doesn't work out of the box ([#1022](https://github.com/zapier/zapier-platform/pull/1022))
- :bug: `version-store.js` is updated to show the Node and NPM versions for v17 ([#1020](https://github.com/zapier/zapier-platform/pull/1020))

### core

- :bug: `zapier build` (and therefore also `zapier push`) hangs on the `Building app definition.json` step when it's run on an integration with a Core dependency of v17, and run via CLI with a version less than v17 ([#1020](https://github.com/zapier/zapier-platform/pull/1020))

### schema

None!

## 17.0.0

_Released 2025-05-12_

Version `17.0.0` is a breaking change release that contains several important upgrades and changes. Here is a brief breakdown of the main breaking changes (**:exclamation: denotes a breaking change**):

### ES Module Support

You can now build integrations using modern ES Module syntax. This means you can use `import ... from ...` instead of `require(...)`, and use newer npm packages that support only ESM.

To start using ESM for your integration project:
- Set `"type": "module"` in your `package.json`
- Replace `main` with `exports` in your `package.json`

For a complete example, check out [minimal-esm](https://github.com/zapier/zapier-platform/tree/82b11aef29a4e7cb576431dba24cba0066c5057b/example-apps/minimal-esm) or [typescript-esm](https://github.com/zapier/zapier-platform/tree/82b11aef29a4e7cb576431dba24cba0066c5057b/example-apps/typescript-esm) (both can be initialized using [`zapier init`](https://github.com/zapier/zapier-platform/blob/82b11aef29a4e7cb576431dba24cba0066c5057b/packages/cli/docs/cli.md#init) with the `-m esm` flag).

Additionally, this update means it's no longer required for every integration's entry point to be `index.js` at the root directory. Instead, the entry point can be defined in `package.json`.
  - For example, see the Typescript ESM example integration [at this link](https://github.com/zapier/zapier-platform/tree/main/example-apps/typescript-esm) - it no longer contains an `index.js` file at the root directory, rather the entry point is defined via `"exports": "./dist/index.js"` in the integration's [package.json](https://github.com/zapier/zapier-platform/blob/main/example-apps/typescript-esm/package.json#L20)

### Typing Improvements

We've improved the typing system, making the TypeScript dev experience more enjoyable. The new typing system includes:

- Bundle `inputData` types is now inferred from input fields.
- New helper functions to help with typing:
  - `defineApp`, `defineTrigger`, `defineCreate`, `defineSearch`, `defineInputFields`
  - These are now recommended over the equivalent `satisfies Xyz` statements
  - `satisfies` is still used for `perform` functions, with `InferInputData`, and for other features without `define` helpers. For example, `export default { ... } satisfies Authentication` is still expected.

Check out the [typescript-esm](https://github.com/zapier/zapier-platform/tree/82b11aef29a4e7cb576431dba24cba0066c5057b/example-apps/typescript-esm) example project for a full example.

### :exclamation: No More `{{curly brackets}}` Outside of Shorthand Requests

Calling `z.request()` with `{{bundle.*}}` or `{{process.env.*}}` will now result in an error. For example:

```js
const perform = async (z, bundle) => {
  const response = await z.request({
    url: 'https://{{bundle.authData.subdomain}}.example.com',
  });
  return response.data;
};
```

This will result in an error in v17. Instead, you must use [template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) i.e. `${var}`:

```js
const perform = async (z, bundle) => {
  const response = await z.request({
    url: `https://${bundle.authData.subdomain}.example.com`,
  });
  return response.data;
};
```

However, `{{curly backets}}` are still (and have to be) allowed in other places, including `operation.lock.key`. They are also allowed (actually required) in usage of shorthand requests:

```js
{
  operation: {
    perform: {
      url: 'https://{{bundle.authData.subdomain}}.example.com',
      method: 'GET',
    }
  }
}
```

### :exclamation: Schema Changes

We have split authentication fields, input fields, and output fields into their own respective schemas, to allow for stricter schema checks and to prepare for future platform updates. Along with this, we have removed irrelevant or incompatible field types and properties from certain schemas.

Note that a descriptive error will be thrown on `zapier validate` if your integration attempts to use an unsupported type or property to prompt you to change it; no need to manually check these. The updated schema are as follows:

  - `AuthenticationSchema.fields`:
    - The following **types** are no longer supported: `code`, `file`, `integer`, `text`
    - The following **properties** are no longer supported: `altersDynamicFields`, `dynamic`, `meta`, `primary`, `search`, `steadyState`
  - `BasicActionOperationSchema.inputFields`:
    - All **types** remain the same.
    - The following **properties** are no longer supported: `primary`, `steadyState`
  - `BasicActionOperationSchema.outputFields`:
    - The following **types** are no longer supported: `text`, `copy`, `code`
    - The following **properties** are no longer supported: `altersDynamicFields`, `choices`, `computed`, `dynamic`, `helpText`, `inputFormat`, `meta`, `placeholder`, `search`

---------

Apart from these major changes, here are the detailed release notes for this release (**note that ❗ denotes a breaking change**):

### cli

- :tada: ESM support added to `zapier init` command via the `--module` flag - supports Minimal and Typescript templates ([#976](https://github.com/zapier/zapier-platform/pull/976))
- :hammer: `zapier build` now uses `esbuild` instead of `browserify` to detect dependencies, for a faster experience building, and to better support ESM ([#946](https://github.com/zapier/zapier-platform/pull/946))
- :hammer: Update `gulp-prettier` dependency from 4.0.0 to 5.0.0

### core

- :exclamation: Stop replacing `{{curlies}}` unless it's a shorthand request ([#1001](https://github.com/zapier/zapier-platform/pull/1001))
- :tada: ESM Support: Two versions of `zapierwrapper.js`, one CJS and one ESM, loaded dynamically depending on the app type ([#965](https://github.com/zapier/zapier-platform/pull/965))
- :bug: Not every `{{curlies}}` in the request object need to be recursively replaced ([#1001](https://github.com/zapier/zapier-platform/pull/1001))
- :bug: HTTP 500 along with status codes >500 are caught in RPC client ([#974](https://github.com/zapier/zapier-platform/pull/974))
- :hammer: Remove Bluebird library, replace with native promises ([#980](https://github.com/zapier/zapier-platform/pull/980))
- :hammer: Refactor middleware and lambda handler logic to use async/await instead of Promise chaining ([#980](https://github.com/zapier/zapier-platform/pull/980))
- :hammer: Trim newline and whitespaces from request headers ([#1000](https://github.com/zapier/zapier-platform/pull/1000))

### schema

- :exclamation: Remove deprecated shouldLock property in the schema ([#988](https://github.com/zapier/zapier-platform/pull/988))
- :hammer: FieldSchema has been split into separate schemas and renamed for clarity ([#957](https://github.com/zapier/zapier-platform/pull/957), [#998](https://github.com/zapier/zapier-platform/pull/998)). Changes include:
  - Input Fields (`PlainInputFieldSchema` and `InputFieldsSchema`)
  - Output Fields (`PlainOutputFieldSchema` and `OutputFieldsSchema`)
  - Authentication Fields (`AuthFieldSchema` and `AuthFieldsSchema`)
- :hammer: A dedicated `BasicSearchOperationSchema` has been added ([#998](https://github.com/zapier/zapier-platform/pull/998))

### misc

- :hammer: Dependency updates - full list in the PR ([#1010](https://github.com/zapier/zapier-platform/pull/1010))



## Changelog Archive for Older Releases

<a id="1651"></a>
<a id="1650"></a>
<a id="1640"></a>
<a id="1631"></a>
<a id="1630"></a>
<a id="1620"></a>
<a id="1611"></a>
<a id="1610"></a>
<a id="1600"></a>
<a id="15190"></a>
<a id="15181"></a>
<a id="15180"></a>
<a id="15170"></a>
<a id="15161"></a>
<a id="15160"></a>
<a id="15150"></a>
<a id="15142"></a>
<a id="15141"></a>
<a id="15140"></a>
<a id="15130"></a>
<a id="15120"></a>
<a id="15111"></a>
<a id="15110"></a>
<a id="15100"></a>
<a id="1591"></a>
<a id="1590"></a>
<a id="1580"></a>
<a id="1573"></a>
<a id="1572"></a>
<a id="1571"></a>
<a id="1570"></a>
<a id="1562"></a>
<a id="1561"></a>
<a id="1560"></a>
<a id="1553"></a>
<a id="1552"></a>
<a id="1551"></a>
<a id="1550"></a>
<a id="1542"></a>
<a id="1541"></a>
<a id="1540"></a>
<a id="1530"></a>
<a id="1510"></a>
<a id="1501"></a>
<a id="1500"></a>
<a id="1411"></a>
<a id="1401"></a>
<a id="1400"></a>
<a id="1400"></a>
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

Changelogs for older versions are archived in the [changelog](https://github.com/zapier/zapier-platform/tree/main/changelog) directory.

- [v14 - v16](https://github.com/zapier/zapier-platform/tree/main/changelog/v14-v16.md)
- [v10 - v13](https://github.com/zapier/zapier-platform/tree/main/changelog/v10-v13.md)
- [v0 - v9](https://github.com/zapier/zapier-platform/tree/main/changelog/v0-v9.md)
