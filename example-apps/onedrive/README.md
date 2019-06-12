# Example App - OneDrive

This is an example CLI App for the Zapier Developer Platform. It uses the OneDrive API as the target, showing what a
full-featured app looks like. It follows the best practices for building an app on Zapier.

What it demonstrates:

  * OAuth2
  * File Handling
  * Hydration
  * `beforeRequest` handler (and how to skip it for a specific call)
  * Resources
  * Breaking an app up into maintable pieces

Throughout the code we've added `CODE TIP` and `UX TIP` comments. These are good spots to find out some of the best
practices and gotchas you may run into.

## Getting Started

For a quicker primer on the OneDrive API see [here](https://dev.onedrive.com/getting-started.htm).

Also note, this app is not one you can download and start using immediately. Since it relies on the OneDrive API,
there is some out-of-band setup that you must complete if you want to be able to use the app on zapier.com. We walk you
through it all, but be prepared!

### 1. Install

To pull down the code and install the needed dependencies, run:

```bash
zapier init --template=onedrive ./
npm install
```

### 2. Seeing Your App on zapier.com

The first step is to do `zapier register 'My Example OneDrive App'`. This logs you in and tells Zapier about your new app.

Now try a `zapier push`. At this point, you can go to zapier.com/app/editor and see your app in the Editor.
You won't be able to use the app yet (there are a couple steps required before auth works), but this gives you
a feel for some of the basic commands of the CLI tool.

### 3. Register a Microsoft App

The OneDrive API follows a typical OAuth2 flow that requires your app to have a `CLIENT_ID` and `CLIENT_SECRET`. For
security reasons, we cannot include those for you, so you need to head over to `https://apps.dev.microsoft.com/`
and register to obtain your own. When registering your app in MS, the minimal information you need to setup is:

1. App Name - Can be anything, like 'My Example Zapier App'
1. Application Secret - Generate a new password, copying that password somewhere for later
1. Platform - Choose web. For Redirect URL, run `zapier describe --format=json | grep 'Redirect URI'` in your terminal and paste in the URI provided by Zapier
1. Click Save

You now need to tell Zapier what `CLIENT_ID` and `CLIENT_SECRET` to use when doing the OAuth2 flow. OneDrive uses
the Applicaiton ID of the app you just registered as the `CLIENT_ID`, and the Application Secret as the `CLIENT_SECRET`.
You can set those in Zapier like so:

```bash
zapier env 1.0.0 CLIENT_ID <app_id>
zapier env 1.0.0 CLIENT_SECRET <app_secret>
```

You should now be able to go back to zapier.com and connect your OneDrive account!

### 4. Exploring

At this point you have a fully working Zapier app you can build Zaps with. Feel free to make tweaks to your app
locally, do a `zapier push`, and see the changes take effect in production right away.

## Testing

The tests are provided as an example of how to write good tests, along with stubs to give an idea of what scenarios to
cover. If you want to actually run the test suite, you need to do a couple things.

First is to manually walk through the OAuth2 flow and capture an access token and refresh token. You can then do:

```bash
export ACCESS_TOKEN='<access_token>'
export REFRESH_TOKEN='<refresh_token>'
```

The tests will pick those up and run with those credentials.

The second thing you need to do is update `TEST_RESOURCES` in `test/test-utils.js` with IDs and folder names in your
OneDrive account. Once that is updated, you should be able to do:

`zapier test`
