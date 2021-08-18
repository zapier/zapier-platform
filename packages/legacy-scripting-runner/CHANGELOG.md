## 3.7.18 (unreleased)

- :bug: Fix `Cannot read property 'errors' of undefined` on auth refresh ([#410](https://github.com/zapier/zapier-platform/pull/410))

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
