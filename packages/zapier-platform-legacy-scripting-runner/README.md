[![Build Status](https://travis-ci.org/zapier/zapier-platform-legacy-scripting-runner.svg?branch=master)](https://travis-ci.org/zapier/zapier-platform-legacy-scripting-runner)

# zapier-platform-legacy-scripting-runner

This is Zapier's Legacy Scripting Runner, used by Web Builder apps converted to [CLI](https://zapier.github.io/zapier-platform-cli/).

This allows you to run methods from existing Scripting code in CLI, and handles the bundle conversion and method availability automatically for you.

You shouldn't have to install anything. This package will be required and installed by your app automatically, if necessary, after running `zapier convert`. You only need [CLI installed](https://zapier.github.io/zapier-platform-cli/) (i.e. `npm i -g zapier-platform-cli`).

## Steps

1. `zapier convert <YOUR_APP_ID> <FOLDER_TO_PUT_APP_INTO>`
2. `cd <FOLDER_TO_PUT_APP_INTO> && npm install`
3. `zapier test`.

Note `scripting.js` should look very familiar to you.

## Known Limitations

[`zapier convert` is still being worked on to take full advantage of this package](https://github.com/zapier/zapier-platform-cli/issues/180), but apart from that, a few things are being purposefully excluded (at least for now):

- `z.dehydrate` and `z.dehydrateFile` are unavailable (not _very_ common, and complex to implement).
- `z.cookie_jar` is unavailable (uncommon).
- `$` is _mostly unavailable_, except for `$.param()` and `$.parseXML()` (other functionality is uncommon and too big to add).
- `bundle.zap` won't be filled out in most cases (CLI doesn't receive this information except for `performSubscribe` and `performUnsubscribe` in Hooks).

## Development

Note this section is intended for Zapier engineers, not for App Developers.

1. Clone this repo and run `npm link` inside of it;
2. Convert an app;
3. Inside the app run `npm link zapier-platform-legacy-scripting-runner`.

## Testing

`npm test` runs some unit tests, `npm run ci-test` pulls the "full-test" app and runs `zapier test` in it.

## Releasing

`npm version [patch|minor|major]` should be enough.

## Test Repos

Some repos might be private. They might have more instructions in their own READMEs.

This is the "full test" for the legacy-scripting-runner:
- [Full Test](https://github.com/zapier/zapier-platform-app-converted-full-test)

A few converted sample apps (proofs of concept):
- [Google Maps](https://github.com/zapier/zapier-platform-app-converted-google-maps)
- [Instapaper](https://github.com/zapier/zapier-platform-app-converted-instapaper)
- [Remember The Milk](https://github.com/zapier/zapier-platform-app-converted-remember-the-milk)
