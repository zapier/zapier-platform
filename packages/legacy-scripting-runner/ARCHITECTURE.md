# `zapier-platform-legacy-scripting-runner` Architecture

## Purpose

- This package, released as `zapier-platform-legacy-scripting-runner` publicly on [npm](https://www.npmjs.com/package/zapier-platform-legacy-scripting-runner), is a compatibility shim between the legacy v2 platform and the current "v3" (aka CLI) platform.
- Most developers won't install this directly, but we'll include it when auto-converting their legacy applications.
- It implements everything found in the [legacy scripting environment](https://platform.zapier.com/legacy/scripting#available-libraries) ([github pinned link](https://github.com/zapier/visual-builder/blob/8da4359f0b67b7a343067fa84b74576917c85fdd/docs/_legacy/scripting.md) in case that done doesn't work).
- While `core`, `cli`, and `schema` are released in lockstep and always match versions, `legacy-scripting-runner` is versioned separately and released on its own.

## Technical Organization

> `runner/...`, when used in a path to a file, is shorthand for `zapier-platform/packages/legacy-scripting-runner/...`

### Important Functions

- The lion's share of code lives in `runner/index.js`.
- The primary purposes are to:
  - make available global functions that were available in the legacy environment (see the `compileLegacyScriptingSource` function)
  - handle `pre_X` and `post_X` lifecycle hooks (see `runEventCombo` function)
  - ensure inputs and outputs continue to allow what was allowed in the legacy environment (while CLI apps may have more strict requirements, such as needing to return arrays from triggers)
- There are also individual files in `runner/*` that power functions/libraries exposed above, such as `btoa`, `$` (for `jQuery`), etc.

### Tests

- The main test file is `runner/test/integration-test.js`, which takes the basic example app from `runner/test/example-app/index.js`, tweaks a single trigger/action at a time, and makes asserts about how it performs.
- There are also unit tests for individually implemented functions (such as `btoa`) in `runner/test/libraries.js`.
