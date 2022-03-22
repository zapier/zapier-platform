## 3.8.7

- :bug: Replace deasync with synckit to fix hanging ([#509](https://github.com/zapier/zapier-platform/pull/509))

## 3.8.6

- :bug: Fix issues with file uploading ([#496](https://github.com/zapier/zapier-platform/pull/496))
- :nail_care: Pass `legacy.skipEncodingChars` to `z.request()` ([#501](https://github.com/zapier/zapier-platform/pull/501))

## 3.8.5

- :bug: Prune nulls and undefined's from query params ([#446](https://github.com/zapier/zapier-platform/pull/446))
- :bug: Handle string array output from a scriptless create/action ([#447](https://github.com/zapier/zapier-platform/pull/447))
- :bug: Encode `request.data` in `form-urlencoded` for `pre` methods ([#448](https://github.com/zapier/zapier-platform/pull/448))

## 3.8.4

- :bug: Make sure `redirect_uri` is available during `oauth2.refresh` ([#444](https://github.com/zapier/zapier-platform/pull/444))
- :bug: Don't send auth with `z.dehydrateFile(url, {})` ([#445](https://github.com/zapier/zapier-platform/pull/445))

## 3.8.3

- :bug: Fix empty auth params when merging `request.url` and `reqeust.params` ([#441](https://github.com/zapier/zapier-platform/pull/441))

## 3.8.2

- :bug: Merge `request.url` to `request.params` before making a request ([#435](https://github.com/zapier/zapier-platform/pull/435))
- :bug: Default to auth fields if auth mapping is empty ([#438](https://github.com/zapier/zapier-platform/pull/438))

## 3.8.1

- :bug: Add support for `z.reqeust({ json: true, body: {...} })` ([#418](https://github.com/zapier/zapier-platform/pull/418))
- :bug: Empty `request.data` should send an empty request body instead of an empty object ([#423](https://github.com/zapier/zapier-platform/pull/423))
- :bug: Fix duplicate headers with session auth ([#424](https://github.com/zapier/zapier-platform/pull/424))

## 3.8.0

- :tada: Include `isBulkRead` to `bundle.meta` ([#414](https://github.com/zapier/zapier-platform/pull/414))
- :bug: Fix `Cannot read property 'errors' of undefined` on auth refresh ([#410](https://github.com/zapier/zapier-platform/pull/410))
- :bug: Fix `JSON results array could not be located` when a trigger response is "null" ([#415](https://github.com/zapier/zapier-platform/pull/415))

## 3.7.17

- :bug: Allow `pre_write` method to "cancel" multipart body by emptying `request.files` ([#394](https://github.com/zapier/zapier-platform/pull/394))

## 3.7.16

- :bug: Allow `auth` to be an object for `z.request` ([#366](https://github.com/zapier/zapier-platform/pull/366))

## 3.7.15

- :bug: Fix another edge case that can lead to duplicate API Key headers ([#365](https://github.com/zapier/zapier-platform/pull/365))

## 3.7.14

- :bug: Fix case-insesitive duplicate auth headers when using "API Key in Header" ([#364](https://github.com/zapier/zapier-platform/pull/364))

## 3.7.13

- :bug: `inputData` should take precedence over `authData` when auth fields are not saved yet ([#359](https://github.com/zapier/zapier-platform/pull/359))

## 3.7.12

- :bug: Add `bundle.trigger_data` to `pre_subscribe` and `post_subscribe` ([#342](https://github.com/zapier/zapier-platform/pull/342))
- :bug: Fix inconsistency with optional file fields ([#344](https://github.com/zapier/zapier-platform/pull/344))

## 3.7.11

- :bug: Yet-to-save auth fields should be in `bundle.auth_fields` ([#331](https://github.com/zapier/zapier-platform/pull/331))

## 3.7.10

- :bug: Fix `pre_oauthv2_token` and `pre_oauthv2_refresh` discrepancies ([#329](https://github.com/zapier/zapier-platform/pull/329))

## 3.7.9

- :bug: Throwing `ErrorException` should appear in an error log ([#309](https://github.com/zapier/zapier-platform/pull/309))

## 3.7.8

- :bug: Better choose between `ResponseError` and script error ([#305](https://github.com/zapier/zapier-platform/pull/305))

## 3.7.7

- :bug: Shouldn't double encode when `pre` method also encodes the URL ([#304](https://github.com/zapier/zapier-platform/pull/304))

## 3.7.6

- :bug: `bundle.request.data` should always be an object in `pre_oauthv2_refresh` ([#294](https://github.com/zapier/zapier-platform/pull/294))

## 3.7.5

- :bug: Make response headers case-insensitive ([#253](https://github.com/zapier/zapier-platform/pull/253))
- :bug: `bundle.request.data` should be undefined in `pre_custom_action_fields` ([#256](https://github.com/zapier/zapier-platform/pull/256))

## 3.7.4

- :bug: Fix env vars in curlies not resolving properly ([#237](https://github.com/zapier/zapier-platform/pull/237))

## 3.7.3

- :bug: Encode URL before sending a request ([#235](https://github.com/zapier/zapier-platform/pull/235))
- :hammer: Refactor tests to use Zapier-hosted httpbin ([#228](https://github.com/zapier/zapier-platform/pull/228))
- :hammer: Fix tests where inline function source isn't compiled ([#226](https://github.com/zapier/zapier-platform/pull/226))

## 3.7.2

- :bug: Prune body if `allowGetBody` and body is empty ([#224](https://github.com/zapier/zapier-platform/pull/224))

## 3.7.1

- :bug: Allow `post_read_resource` to return an array ([#219](https://github.com/zapier/zapier-platform/pull/219))
- :hammer: Upgrade dependencies ([#218](https://github.com/zapier/zapier-platform/pull/218))

## 3.7.0

- :tada: More complete bundle logs ([#213](https://github.com/zapier/zapier-platform/pull/213))
- :bug: Trim bloated bundles for `KEY_post` methods ([#213](https://github.com/zapier/zapier-platform/pull/213))

## 3.6.0

- :nail_care: Allow GET requests to have body (requires zapier-platform-core 9.4.0+) ([#195](https://github.com/zapier/zapier-platform/pull/195))
- :bug: More "reliably interpolate arrays or objects to a string" ([#203](https://github.com/zapier/zapier-platform/pull/203))
- :hammer: Upgrade `request` package ([#196](https://github.com/zapier/zapier-platform/pull/196))

## 3.5.0

- :tada: Add support for unbounded curlies ([#194](https://github.com/zapier/zapier-platform/pull/194))

## 3.4.0

- :tada: Allow to "reliably interpolate arrays or objects to a string" ([#190](https://github.com/zapier/zapier-platform/pull/190))

## 3.3.3

- :bug: Run post method first before throwing error for response status ([#183](https://github.com/zapier/zapier-platform/pull/183))

## 3.3.2

- :bug: Fix missing `console.log` ([#182](https://github.com/zapier/zapier-platform/pull/182))

## 3.3.1

- :bug: Add full jQuery support ([#181](https://github.com/zapier/zapier-platform/pull/181))

## 3.3.0

- :tada: Log converted bundles ([#177](https://github.com/zapier/zapier-platform/pull/177))
