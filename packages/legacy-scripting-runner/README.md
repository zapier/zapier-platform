# Zapier Platform Legacy Runner

This is Zapier's Legacy Scripting Runner, used by Web Builder apps converted to [CLI](https://docs.zapier.com/platform).

This allows you to run methods from existing Scripting code in CLI, and handles the bundle conversion and method availability automatically for you.

You shouldn't have to install anything. This package will be required and installed by your app automatically, if necessary, after running `zapier convert`. You only need [CLI installed](https://docs.zapier.com/platform) (i.e. `npm i -g zapier-platform-cli`).

## Steps

1. `zapier convert <YOUR_APP_ID> <FOLDER_TO_PUT_APP_INTO>`
2. `cd <FOLDER_TO_PUT_APP_INTO> && npm install`
3. `zapier test`.

Note `scripting.js` should look very familiar to you.

## Known Limitations

- `z.cookie_jar` is unavailable (uncommon).
- `bundle.zap` won't be filled out in most cases (CLI doesn't receive this information except for `performSubscribe` and `performUnsubscribe` in Hooks).

## Development

Note this section is intended for Zapier engineers, not for App Developers.

1. Clone this repo and run `npm link` inside of it;
2. Convert an app;
3. Inside the app run `npm link zapier-platform-legacy-scripting-runner`.

## Testing

`npm test` runs some unit tests, `npm run ci-test` pulls the "full-test" app and runs `zapier test` in it.

## Releasing

1. Run `npm version [patch|minor|major]` to update the version in `package.json` and push a version tag to GitHub.
2. Wait for [Travis](https://travis-ci.org/zapier/zapier-platform-legacy-scripting-runner) to publish the package to npm.

## Test Repos

Some repos might be private. They might have more instructions in their own READMEs.

This is the "full test" for the legacy-scripting-runner:

- [Full Test](https://github.com/zapier/zapier-platform-app-converted-full-test)

A few converted sample apps (proofs of concept):

- [Google Maps](https://github.com/zapier/zapier-platform-app-converted-google-maps)
- [Instapaper](https://github.com/zapier/zapier-platform-app-converted-instapaper)
- [Remember The Milk](https://github.com/zapier/zapier-platform-app-converted-remember-the-milk)
