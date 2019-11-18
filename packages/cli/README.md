<!-- GENERATED! ONLY EDIT `README-source.md` -->

<h1 align="center">
  <a href="https://zapier.com"><img src="https://raw.githubusercontent.com/zapier/zapier-platform/master/packages/cli/goodies/zapier-logomark.png" alt="Zapier" width="200"></a>
  <br>
  Zapier Platform CLI
  <br>
  <br>
</h1>

<p align="center">
  <!-- this isn't live yet? or won't be until I push -->
  <!-- <a href="https://travis-ci.org/zapier/zapier-platform-cli"><img src="https://img.shields.io/travis/zapier/zapier-platform-cli/master.svg" alt="Travis"></a> -->
  <a href="https://www.npmjs.com/package/zapier-platform-cli"><img src="https://img.shields.io/npm/v/zapier-platform-cli.svg" alt="npm version"></a>
  <!--possible downloads badge too, once that's good-->
</p>

Zapier is a platform for creating integrations and workflows. This CLI is your gateway to creating custom applications on the Zapier platform.

[These docs are available here](https://zapier.github.io/zapier-platform/), the [CLI docs are available here](https://zapier.github.io/zapier-platform/cli), and you can [view all the schema definitions here](https://github.com/zapier/zapier-platform/blob/master/packages/schema/docs/build/schema.md).

## Table of Contents

<!-- toc -->

- [Getting Started](#getting-started)
  * [What is an App?](#what-is-an-app)
  * [How does Zapier Platform CLI Work?](#how-does-zapier-platform-cli-work)
  * [Zapier Platform CLI vs UI](#zapier-platform-cli-vs-ui)
  * [Requirements](#requirements)
  * [Quick Setup Guide](#quick-setup-guide)
  * [Tutorial](#tutorial)
- [Creating a Local App](#creating-a-local-app)
  * [Local Project Structure](#local-project-structure)
  * [Local App Definition](#local-app-definition)
- [Registering an App](#registering-an-app)
- [Deploying an App Version](#deploying-an-app-version)
  * [Private App Version (default)](#private-app-version-default)
  * [Sharing an App Version](#sharing-an-app-version)
  * [Promoting an App Version](#promoting-an-app-version)
- [Converting an Existing App](#converting-an-existing-app)
- [Authentication](#authentication)
  * [Basic](#basic)
  * [Digest](#digest)
  * [Custom](#custom)
  * [Session](#session)
  * [OAuth1](#oauth1)
  * [OAuth2](#oauth2)
- [Resources](#resources)
  * [Resource Definition](#resource-definition)
- [Triggers/Searches/Creates](#triggerssearchescreates)
  * [Return Types](#return-types)
- [Input Fields](#input-fields)
  * [Custom/Dynamic Fields](#customdynamic-fields)
  * [Dynamic Dropdowns](#dynamic-dropdowns)
  * [Search-Powered Fields](#search-powered-fields)
  * [Computed Fields](#computed-fields)
  * [Nested & Children (Line Item) Fields](#nested--children-line-item-fields)
- [Output Fields](#output-fields)
  * [Nested & Children (Line Item) Fields](#nested--children-line-item-fields-1)
- [Z Object](#z-object)
  * [`z.request([url], options)`](#zrequesturl-options)
  * [`z.console`](#zconsole)
  * [`z.dehydrate(func, inputData)`](#zdehydratefunc-inputdata)
  * [`z.dehydrateFile(func, inputData)`](#zdehydratefilefunc-inputdata)
  * [`z.stashFile(bufferStringStream, [knownLength], [filename], [contentType])`](#zstashfilebufferstringstream-knownlength-filename-contenttype)
  * [`z.JSON`](#zjson)
  * [`z.hash()`](#zhash)
  * [`z.errors`](#zerrors)
  * [`z.cursor`](#zcursor)
- [Bundle Object](#bundle-object)
  * [`bundle.authData`](#bundleauthdata)
  * [`bundle.inputData`](#bundleinputdata)
  * [`bundle.inputDataRaw`](#bundleinputdataraw)
  * [`bundle.meta`](#bundlemeta)
  * [`bundle.rawRequest`](#bundlerawrequest)
  * [`bundle.cleanedRequest`](#bundlecleanedrequest)
  * [`bundle.targetUrl`](#bundletargeturl)
  * [`bundle.subscribeData`](#bundlesubscribedata)
- [Environment](#environment)
  * [Defining Environment Variables](#defining-environment-variables)
  * [Accessing Environment Variables](#accessing-environment-variables)
- [Making HTTP Requests](#making-http-requests)
  * [Shorthand HTTP Requests](#shorthand-http-requests)
  * [Manual HTTP Requests](#manual-http-requests)
    + [POST and PUT Requests](#post-and-put-requests)
  * [Using HTTP middleware](#using-http-middleware)
  * [HTTP Request Options](#http-request-options)
  * [HTTP Response Object](#http-response-object)
- [Dehydration](#dehydration)
  * [File Dehydration](#file-dehydration)
- [Stashing Files](#stashing-files)
- [Logging](#logging)
  * [Console Logging](#console-logging)
  * [Viewing Console Logs](#viewing-console-logs)
  * [Viewing Bundle Logs](#viewing-bundle-logs)
  * [HTTP Logging](#http-logging)
  * [Viewing HTTP Logs](#viewing-http-logs)
- [Error Handling](#error-handling)
  * [General Errors](#general-errors)
  * [Halting Execution](#halting-execution)
  * [Stale Authentication Credentials](#stale-authentication-credentials)
- [Testing](#testing)
  * [Writing Unit Tests](#writing-unit-tests)
  * [Mocking Requests](#mocking-requests)
  * [Running Unit Tests](#running-unit-tests)
  * [Testing & Environment Variables](#testing--environment-variables)
  * [Viewing HTTP Logs in Unit Tests](#viewing-http-logs-in-unit-tests)
  * [Testing in Your CI](#testing-in-your-ci)
- [Using `npm` Modules](#using-npm-modules)
- [Building Native Packages with Docker](#building-native-packages-with-docker)
- [Using Transpilers](#using-transpilers)
- [Example Apps](#example-apps)
- [FAQs](#faqs)
  * [Why doesn't Zapier support newer versions of Node.js?](#why-doesnt-zapier-support-newer-versions-of-nodejs)
  * [How do I manually set the Node.js version to run my app with?](#how-do-i-manually-set-the-nodejs-version-to-run-my-app-with)
  * [When to use placeholders or curlies?](#when-to-use-placeholders-or-curlies)
  * [Does Zapier support XML (SOAP) APIs?](#does-zapier-support-xml-soap-apis)
  * [Is it possible to iterate over pages in a polling trigger?](#is-it-possible-to-iterate-over-pages-in-a-polling-trigger)
  * [How do search-powered fields relate to dynamic dropdowns and why are they both required together?](#how-do-search-powered-fields-relate-to-dynamic-dropdowns-and-why-are-they-both-required-together)
  * [What's the deal with pagination? When is it used and how does it work?](#whats-the-deal-with-pagination-when-is-it-used-and-how-does-it-work)
  * [How does deduplication work?](#how-does-deduplication-work)
  * [Why are my triggers complaining if I don't provide an explicit `id` field?](#why-are-my-triggers-complaining-if-i-dont-provide-an-explicit-id-field)
  * [Node 6 No Longer Supported](#node-6-no-longer-supported)
  * [What Analytics are Collected?](#what-analytics-are-collected)
  * [What's the Difference Between an "App" and an "Integration"?](#whats-the-difference-between-an-app-and-an-integration)
- [Command Line Tab Completion](#command-line-tab-completion)
  * [Zsh Completion Script](#zsh-completion-script)
  * [Bash Completion Script](#bash-completion-script)
- [The Zapier Platform Packages](#the-zapier-platform-packages)
  * [Updating](#updating)
- [Development of the CLI](#development-of-the-cli)
  * [Commands](#commands)
  * [Publishing of the CLI (after merging)](#publishing-of-the-cli-after-merging)
- [Get Help!](#get-help)

<!-- tocstop -->

## Getting Started

> If you're new to Zapier Platform CLI, we strongly recommend you to walk through the [Tutorial](https://zapier.com/developer/start) for a more thorough introduction.

### What is an App?

> Note: this document uses "app" while modern Zapier nomenclature refers instead to "integrations". In both cases, the phrase refers to your code that connects your API with Zapier.

A CLI App is an implementation of your app's API. You build a Node.js application
that exports a single object ([JSON Schema](https://github.com/zapier/zapier-platform/blob/master/packages/schema/docs/build/schema.md#appschema)) and upload it to Zapier.
Zapier introspects that definition to find out what your app is capable of and
what options to present end users in the Zap Editor.

For those not familiar with Zapier terminology, here is how concepts in the CLI
map to the end user experience:

 * [Authentication](#authentication), (usually) which lets us know what credentials to ask users
   for. This is used during the "Connect Accounts" section of the Zap Editor.
 * [Triggers](#triggerssearchescreates), which read data *from* your API. These have their own section in the Zap Editor.
 * [Creates](#triggerssearchescreates), which send data *to* your API to create new records. These are listed under "Actions" in the Zap Editor.
 * [Searches](#triggerssearchescreates), which find specific records *in* your system. These are also listed under "Actions" in the Zap Editor.
 * [Resources](#resources), which define an object type in your API (say a contact) and the operations available to perform on it. These are automatically extracted into Triggers, Searches, and Creates.

### How does Zapier Platform CLI Work?

Zapier takes the App you upload and sends it over to Amazon Web Service's Lambda.
We then make calls to execute the operations your App defines as we execute Zaps.
Your App takes the input data we provide (if any), makes the necessary HTTP calls,
and returns the relevant data, which gets fed back into Zapier.

### Zapier Platform CLI vs UI

The Zapier Platform includes two ways to build integrations: a CLI to build integrations in your local development environment and deploy them from the command line, and a UI to create integrations with a visual builder from your browser. Both use the same Zapier platform, so pick the one that fits your team's needs best, as the difference is in how you develop the integration.

Zapier Platform CLI is designed to be used by development teams who collaborate with version control and CI, and can be used to build more advanced integrations with custom coding for every part of your API calls and response parsing.

[Zapier Platform UI](https://zapier.com/app/developer/) is designed to quickly spin up new integrations, and collaborate on them with teams that include non-developers. It's the quickest way to start using the Zapier platform—and you can manage your CLI apps' core details from its online UI as well. Coming soon, you will be able to convert Zapier Platform UI integrations to CLI to start development in your browser then finish out the core features in your local development environment.

_→ Learn more in our [Zapier Platform UI vs CLI](https://platform.zapier.com/docs/vs) post._

### Requirements

All Zapier CLI apps are run using Node.js `v8.10.0`.

You can develop using any version of Node you'd like, but your eventual code must be compatible with `v8.10.0`. If you're using features not yet available in `v8.10.0`, you can transpile your code to a compatible format with [Babel](https://babeljs.io/) (or similar).

To ensure stability for our users, we strongly encourage you run tests on `v8.10.0` sometime before your code reaches users. This can be done multiple ways.

Firstly, by using a CI tool (like [Travis CI](https://travis-ci.org/) or [Circle CI](https://circleci.com/), which are free for open source projects). We provide a sample [.travis.yml](https://github.com/zapier/zapier-platform/blob/master/example-apps/minimal/.travis.yml) file in our template apps to get you started.

Alternatively, you can change your local node version with tools such as [nvm](https://github.com/nvm-sh/nvm#installation-and-update) or [n](https://github.com/tj/n#installation).
Then you can either swap to that version with `nvm use v8.10.0`, or do `nvm exec v8.10.0 zapier test` so you can run tests without having to switch versions while developing.


### Quick Setup Guide

First up is installing the CLI and setting up your auth to create a working "Zapier Example" application. It will be private to you and visible in your live [Zap Editor](https://zapier.com/app/editor).

```bash
# install the CLI globally
npm install -g zapier-platform-cli

# setup auth to Zapier's platform with a deploy key
zapier login
```

Your Zapier CLI should be installed and ready to go at this point. Next up, we'll create our first app!

```bash
# create a directory with the minimum required files
zapier init example-app

# move into the new directory
cd example-app

# install all the libraries needed for your app
npm install
```

> Note: there are plenty of templates & example apps to choose from! [View all Example Apps here.](#example-apps).

You should now have a working local app. You can run several local commands to try it out.

```bash
# run the local tests
# the same as npm test, but adds some extra things to the environment
zapier test
```

Next, you'll probably want to upload app to Zapier itself so you can start testing live.

```bash
# push your app to Zapier
zapier push
```

> Go check out our [full CLI reference documentation](https://zapier.github.io/zapier-platform/cli) to see all the other commands!


### Tutorial

For a full tutorial, head over to our [Tutorial](https://zapier.com/developer/start) for a comprehensive walkthrough for creating your first app. If this isn't your first rodeo, read on!

## Creating a Local App

> Tip: check the [Quick Setup](#quick-setup-guide) if this is your first time using the platform!

Creating an App can be done entirely locally and they are fairly simple Node.js apps using the standard Node environment and should be completely testable. However, a local app stays local until you `zapier register`.

```bash
# make your folder
mkdir zapier-example
cd zapier-example

# create the needed files from a template
zapier init . --template=trigger

# install all the libraries needed for your app
npm install
```

If you'd like to manage your **local App**, use these commands:

* `zapier init . --template=resource` - initialize/start a local app project ([see templates here](https://github.com/zapier/zapier-platform/wiki/Example-Apps))
* `zapier convert 1234 .` - initialize/start from an existing app (alpha)
* `zapier scaffold resource Contact` - auto-injects a new resource, trigger, etc.
* `zapier test` - run the same tests as `npm test`
* `zapier validate` - ensure your app is valid
* `zapier describe` - print some helpful information about your app

### Local Project Structure

In your app's folder, you should see this general recommended structure. The `index.js` is Zapier's entry point to your app. Zapier expects you to export an `App` definition there.

```plain
$ tree .
.
├── README.md
├── index.js
├── package.json
├── triggers
│   └── contact-by-tag.js
├── resources
│   └── Contact.js
├── test
│   ├── basic.js
│   ├── triggers.js
│   └── resources.js
├── build
│   └── build.zip
└── node_modules
    ├── ...
    └── ...
```

### Local App Definition

The core definition of your `App` will look something like this, and is what your `index.js` should provide as the _only_ export:

```js
const App = {
  // both version strings are required
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  // see "Authentication" section below
  authentication: {},

  // see "Dehydration" section below
  hydrators: {},

  // see "Making HTTP Requests" section below
  requestTemplate: {},
  beforeRequest: [],
  afterResponse: [],

  // See "Resources" section below
  resources: {},

  // See "Triggers/Searches/Creates" section below
  triggers: {},
  searches: {},
  creates: {}
};

module.exports = App;

```

> Tip: you can use higher order functions to create any part of your App definition!


## Registering an App

Registering your App with Zapier is a necessary first step which only enables basic administrative functions. It should happen before `zapier push` which is to used to actually expose an App Version in the Zapier interface and editor.

```bash
# register your app
zapier register "Zapier Example"

# list your apps
zapier apps
```

> Note: this doesn't put your app in the editor - see the docs on pushing an App Version to do that!

If you'd like to manage your **App**, use these commands:

* `zapier apps` - list the apps in Zapier you can administer
* `zapier register "Name"` - creates a new app in Zapier
* `zapier link` - lists and links a selected app in Zapier to your current folder
* `zapier history` - print the history of your app
* `zapier collaborate [user@example.com]` - add admins to your app who can push
* `zapier invite [user@example.com] [1.0.0]` - add users to try your app version 1.0.0 before promotion


## Deploying an App Version

An App Version is related to a specific App but is an "immutable" implementation of your app. This makes it easy to run multiple versions for multiple users concurrently. The App Version is pulled from the version within the `package.json`. To create a new App Version, update the version number in that file. By default, **every App Version is private** but you can `zapier promote` it to production for use by over 1 million Zapier users.

```bash
# push your app version to Zapier
zapier push

# list your versions
zapier versions
```

If you'd like to manage your **Version**, use these commands:

* `zapier versions` - list the versions for the current directory's app
* `zapier push` - push the current version of current directory's app & version (read from `package.json`)
* `zapier promote [1.0.0]` - mark a version as the "production" version
* `zapier migrate [1.0.0] [1.0.1] [100%]` - move users between versions, regardless of deployment status
* `zapier deprecate [1.0.0] [YYYY-MM-DD]` - mark a version as deprecated, but let users continue to use it (we'll email them)
* `zapier env 1.0.0 [KEY] [value]` - set an environment variable to some value
* `zapier delete version [1.0.0]` - delete a version entirely. This is mostly for clearing out old test apps you used personally. It will fail if there are any users. You probably want `deprecate` instead.

> Note: To see the changes that were just pushed reflected in the browser, you have to manually refresh the browser each time you push.


### Private App Version (default)

A simple `zapier push` will only create the App Version in your editor. No one else using Zapier can see it or use it.


### Sharing an App Version

This is how you would share your app with friends, co-workers or clients. This is perfect for quality assurance, testing with active users or just sharing any app you like.

```bash
# sends an email this user to let them view the app version 1.0.0 in the UI privately
zapier invite user@example.com 1.0.0

# sends an email this user to let them admin the app (make changes just like you)
zapier collaborate user@example.com
```

You can also invite anyone on the internet to your app by observing the URL at the bottom of `zapier invite`, it should look something like `https://zapier.com/platform/public-invite/1/222dcd03aed943a8676dc80e2427a40d/`. You can put this in your help docs, post it to Twitter, add it to your email campaign, etc. Note this will invite users to every app version.


### Promoting an App Version

Promotion is how you would share your app with every one of the 1 million+ Zapier users. If this is your first time promoting - you may have to wait for the Zapier team to review and approve your app.

If this isn't the first time you've promoted your app - you might have users on older versions. You can `zapier migrate` to either move users over (which can be dangerous if you have breaking changes). Or, you can `zapier deprecate` to give users some time to move over themselves.

```bash
# promote your app version to all Zapier users
zapier promote 1.0.1

# OPTIONAL - migrate your users between one app version to another
zapier migrate 1.0.0 1.0.1

# OR - mark the old version as deprecated
zapier deprecate 1.0.0 2017-01-01
```

## Converting an Existing App

If you have an existing Zapier [legacy Web Builder app](https://zapier.com/developer/builder/), you can use it as a template to kickstart your local application.

```bash
# Convert an existing Web Builder app to a CLI app in the my-app directory
# App ID 1234 is from URL https://zapier.com/developer/builder/app/1234/development
zapier convert 1234 my-app
```

Your CLI app will be created and you can continue working on it.

> Note - there is no way to convert a CLI app to a Web Builder app and we do not plan on implementing this.

Introduced in `v8.2.0`, you are able to convert new integrations built in Zapier Platform UI to CLI.

```sh
# the --version flag is what denotes this command is interacting with a Visual Builder app
# zapier convert <APP_ID> <PATH> --version=<APP_VERSION>
zapier convert 1234 my-app 1.0.1
```

## Authentication

Most applications require some sort of authentication - and Zapier provides a handful of methods for helping your users authenticate with your application. Zapier will provide some of the core behaviors, but you'll likely need to handle the rest.

> Hint: You can access the data tied to your authentication via the `bundle.authData` property in any method called in your app. Exceptions exist in OAuth and Session auth. Please see them below.

### Basic

Useful if your app requires two pieces of information to authentication: `username` and `password` which only the end user can provide. By default, Zapier will do the standard Basic authentication base64 header encoding for you (via an automatically registered middleware).

> Example App: check out https://github.com/zapier/zapier-platform/tree/master/example-apps/basic-auth for a working example app for basic auth.

> Note: if you do the common API Key pattern like `Authorization: Basic APIKEYHERE:x` you should look at the "Custom" authentication method instead.

```js
const authentication = {
  type: 'basic',
  // "test" could also be a function
  test: {
    url: 'https://example.com/api/accounts/me.json'
  },
  connectionLabel: '{{bundle.authData.username}}' // Can also be a function, check digest auth below for an example
  // you can provide additional fields, but we'll provide `username`/`password` automatically
};

const App = {
  // ...
  authentication: authentication
  // ...
};

```

### Digest

*New in v7.4.0.*

The setup and user experience of Digest Auth is identical to Basic Auth. Users will provide Zapier their username and password and Zapier will handle all the nonce and quality of protection details automatically.

> Example App: check out https://github.com/zapier/zapier-platform/tree/master/example-apps/digest-auth for a working example app for digest auth.

> Limitation: Currently, MD5-sess and SHA are not implemented. Only the MD5 algorithm is supported. In addition, server nonces are not reused. That means for every `z.request` call, Zapier will sends an additional request beforehand to get the server nonce.

```js
const authentication = {
  type: 'digest',
  // "test" could also be a function
  test: {
    url: 'https://example.com/api/accounts/me.json'
  },
  connectionLabel: '{{bundle.authData.username}}' // Can also be a function, check digest auth below for an example
  // you can provide additional fields, but we'll provide `username`/`password` automatically
};

const App = {
  // ...
  authentication: authentication
  // ...
};

```

### Custom

This is what most "API Key" driven apps should default to using. You'll likely provide some custom `beforeRequest` middleware or a `requestTemplate` to complete the authentication by adding/computing needed headers.

> Example App: check out https://github.com/zapier/zapier-platform/tree/master/example-apps/custom-auth for a working example app for custom auth.

```js
const authentication = {
  type: 'custom',
  // "test" could also be a function
  test: {
    url:
      'https://{{bundle.authData.subdomain}}.example.com/api/accounts/me.json'
  },
  fields: [
    {
      key: 'subdomain',
      type: 'string',
      required: true,
      helpText: 'Found in your browsers address bar after logging in.'
    },
    {
      key: 'api_key',
      type: 'string',
      required: true,
      helpText: 'Found on your settings page.'
    }
  ]
};

const addApiKeyToHeader = (request, z, bundle) => {
  request.headers['X-Subdomain'] = bundle.authData.subdomain;
  const basicHash = Buffer.from(`${bundle.authData.api_key}:x`).toString(
    'base64'
  );
  request.headers.Authorization = `Basic ${basicHash}`;
  return request;
};

const App = {
  // ...
  authentication: authentication,
  beforeRequest: [addApiKeyToHeader]
  // ...
};

```

### Session

Probably the most "powerful" mechanism for authentication - it gives you the ability to exchange some user provided data for some authentication data (IE: username & password for a session key).

> Example App: check out https://github.com/zapier/zapier-platform/tree/master/example-apps/session-auth for a working example app for session auth.

```js
const getSessionKey = (z, bundle) => {
  const promise = z.request({
    method: 'POST',
    url: 'https://example.com/api/accounts/login.json',
    body: {
      username: bundle.authData.username,
      password: bundle.authData.password
    }
  });

  return promise.then(response => {
    if (response.status === 401) {
      throw new Error('The username/password you supplied is invalid');
    }
    return {
      sessionKey: z.JSON.parse(response.content).sessionKey
    };
  });
};

const authentication = {
  type: 'session',
  // "test" could also be a function
  test: {
    url: 'https://example.com/api/accounts/me.json'
  },
  fields: [
    {
      key: 'username',
      type: 'string',
      required: true,
      helpText: 'Your login username.'
    },
    {
      key: 'password',
      type: 'string',
      required: true,
      helpText: 'Your login password.'
    }
    // For Session Auth we store `sessionKey` automatically in `bundle.authData`
    // for future use. If you need to save/use something that the user shouldn't
    // need to type/choose, add a "computed" field, like:
    // {key: 'something': type: 'string', required: false, computed: true}
    // And remember to return it in sessionConfig.perform
  ],
  sessionConfig: {
    perform: getSessionKey
  }
};

const includeSessionKeyHeader = (request, z, bundle) => {
  if (bundle.authData.sessionKey) {
    request.headers = request.headers || {};
    request.headers['X-Session-Key'] = bundle.authData.sessionKey;
  }
  return request;
};

const sessionRefreshIf401 = (response, z, bundle) => {
  if (bundle.authData.sessionKey) {
    if (response.status === 401) {
      throw new z.errors.RefreshAuthError(); // ask for a refresh & retry
    }
  }
  return response;
};

const App = {
  // ...
  authentication: authentication,
  beforeRequest: [includeSessionKeyHeader],
  afterResponse: [sessionRefreshIf401]
  // ...
};

```

> Note - For Session auth, `authentication.sessionConfig.perform` will have the provided fields in `bundle.inputData` instead of `bundle.authData` because `bundle.authData` will only have "previously existing" values, which will be empty the first time the Zap runs.

### OAuth1

*New in `v7.5.0`.*

Zapier's OAuth1 implementation matches [Twitter's](https://developer.twitter.com/en/docs/basics/authentication/overview) and [Trello's](https://developers.trello.com/page/authorization) implementation of the 3-legged OAuth flow.

> Example Apps: check out [oauth1-trello](https://github.com/zapier/zapier-platform/tree/master/example-apps/oauth1-trello), [oauth1-tumblr](https://github.com/zapier/zapier-platform/tree/master/example-apps/oauth1-tumblr), and [oauth1-twitter](https://github.com/zapier/zapier-platform/tree/master/example-apps/oauth1-twitter) for working example apps with OAuth1.

The flow works like this:

  1. Zapier makes a call to your API requesting a "request token" (also known as "temporary credentials")
  2. Zapier sends the user to the authorization URL, defined by your app, along with the request token
  3. Once authorized, your website sends the user to the `redirect_uri` Zapier provided. Use `zapier describe` command to find out what it is: ![](https://zappy.zapier.com/117ECB35-5CCA-4C98-B74A-35F1AD9A3337.png)
  4. Zapier makes a call on our backend to your API to exchange the request token for an "access token" (also known as "long-lived credentials")
  5. Zapier remembers the access token and makes calls on behalf of the user

You are required to define:

  * `getRequestToken`: The API call to fetch the request token
  * `authorizeUrl`: The authorization URL
  * `getAccessToken`: The API call to fetch the access token

You'll also likely need to set your `CLIENT_ID` and `CLIENT_SECRET` as environment variables. These are the consumer key and secret in OAuth1 terminology.

```bash
# setting the environment variables on Zapier.com
$ zapier env 1.0.0 CLIENT_ID 1234
$ zapier env 1.0.0 CLIENT_SECRET abcd

# and when running tests locally, don't forget to define them in .env or in the command!
$ CLIENT_ID=1234 CLIENT_SECRET=abcd zapier test
```

Your auth definition would look something like this:

```js
const _ = require('lodash');

const authentication = {
  type: 'oauth1',
  oauth1Config: {
    getRequestToken: {
      url: 'https://{{bundle.inputData.subdomain}}.example.com/request-token',
      method: 'POST',
      auth: {
        oauth_consumer_key: '{{process.env.CLIENT_ID}}',
        oauth_consumer_secret: '{{process.env.CLIENT_SECRET}}',

        // 'HMAC-SHA1' is used by default if not specified.
        // 'HMAC-SHA256', 'RSA-SHA1', 'PLAINTEXT' are also supported.
        oauth_signature_method: 'HMAC-SHA1',
        oauth_callback: '{{bundle.inputData.redirect_uri}}'
      }
    },
    authorizeUrl: {
      url: 'https://{{bundle.inputData.subdomain}}.example.com/authorize',
      params: {
        oauth_token: '{{bundle.inputData.oauth_token}}'
      }
    },
    getAccessToken: {
      url: 'https://{{bundle.inputData.subdomain}}.example.com/access-token',
      method: 'POST',
      auth: {
        oauth_consumer_key: '{{process.env.CLIENT_ID}}',
        oauth_consumer_secret: '{{process.env.CLIENT_SECRET}}',
        oauth_token: '{{bundle.inputData.oauth_token}}',
        oauth_token_secret: '{{bundle.inputData.oauth_token_secret}}',
        oauth_verifier: '{{bundle.inputData.oauth_verifier}}'
      }
    }
  },
  test: {
    url: 'https://{{bundle.authData.subdomain}}.example.com/me'
  },
  // If you need any fields upfront, put them here
  fields: [
    { key: 'subdomain', type: 'string', required: true, default: 'app' }
    // For OAuth1 we store `oauth_token` and `oauth_token_secret` automatically
    // in `bundle.authData` for future use. If you need to save/use something
    // that the user shouldn't need to type/choose, add a "computed" field, like:
    // {key: 'user_id': type: 'string', required: false, computed: true}
    // And remember to return it in oauth1Config.getAccessToken
  ]
};

// A middleware that is run before z.request() actually makes the request. Here we're
// adding necessary OAuth1 parameters to `auth` property of the request object.
const includeAccessToken = (req, z, bundle) => {
  if (
    bundle.authData &&
    bundle.authData.oauth_token &&
    bundle.authData.oauth_token_secret
  ) {
    // Just put your OAuth1 credentials in req.auth, Zapier will sign the request for
    // you.
    req.auth = req.auth || {};
    _.defaults(req.auth, {
      oauth_consumer_key: process.env.CLIENT_ID,
      oauth_consumer_secret: process.env.CLIENT_SECRET,
      oauth_token: bundle.authData.oauth_token,
      oauth_token_secret: bundle.authData.oauth_token_secret
    });
  }
  return req;
};

const App = {
  // ...
  authentication: authentication,
  beforeRequest: [includeAccessToken]
  // ...
};

module.exports = App;

```

> Note - For OAuth1, `authentication.oauth1Config.getRequestToken`, `authentication.oauth1Config.authorizeUrl`, and `authentication.oauth1Config.getAccessToken` will have the provided fields in `bundle.inputData` instead of `bundle.authData` because `bundle.authData` will only have "previously existing" values, which will be empty when the user hasn't connected their account on your service to Zapier. Also note that `authentication.oauth1Config.getAccessToken` has access to the users return values in `rawRequest` and `cleanedRequest` should you need to extract other values (for example from the query string).

### OAuth2

Zapier's OAuth2 implementation is based on the `authorization_code` flow, similar to [GitHub](https://developer.github.com/v3/oauth/) and [Facebook](https://developers.facebook.com/docs/authentication/server-side/).

> Example App: check out https://github.com/zapier/zapier-platform/tree/master/example-apps/oauth2 for a working example app for OAuth2.

It looks like this:

  1. Zapier sends the user to the authorization URL defined by your app
  2. Once authorized, your website sends the user to the `redirect_uri` Zapier provided. Use `zapier describe` command to find out what it is: ![](https://zappy.zapier.com/83E12494-0A03-4DB4-AA46-5A2AF6A9ECCC.png)
  3. Zapier makes a call on our backend to your API to exchange the `code` for an `access_token`
  4. Zapier remembers the `access_token` and makes calls on behalf of the user
  5. (Optionally) Zapier can refresh the token if it expires

You are required to define the authorization URL and the API call to fetch the access token. You'll also likely want to set your `CLIENT_ID` and `CLIENT_SECRET` as environment variables:

```bash
# setting the environment variables on Zapier.com
$ zapier env 1.0.0 CLIENT_ID 1234
$ zapier env 1.0.0 CLIENT_SECRET abcd

# and when running tests locally, don't forget to define them in .env or in the command!
$ CLIENT_ID=1234 CLIENT_SECRET=abcd zapier test
```

Your auth definition would look something like this:

```js
const authentication = {
  type: 'oauth2',
  test: {
    url:
      'https://{{bundle.authData.subdomain}}.example.com/api/accounts/me.json'
  },
  // you can provide additional fields for inclusion in authData
  oauth2Config: {
    // "authorizeUrl" could also be a function returning a string url
    authorizeUrl: {
      method: 'GET',
      url:
        'https://{{bundle.inputData.subdomain}}.example.com/api/oauth2/authorize',
      params: {
        client_id: '{{process.env.CLIENT_ID}}',
        state: '{{bundle.inputData.state}}',
        redirect_uri: '{{bundle.inputData.redirect_uri}}',
        response_type: 'code'
      }
    },
    // Zapier expects a response providing {access_token: 'abcd'}
    // "getAccessToken" could also be a function returning an object
    getAccessToken: {
      method: 'POST',
      url:
        'https://{{bundle.inputData.subdomain}}.example.com/api/v2/oauth2/token',
      body: {
        code: '{{bundle.inputData.code}}',
        client_id: '{{process.env.CLIENT_ID}}',
        client_secret: '{{process.env.CLIENT_SECRET}}',
        redirect_uri: '{{bundle.inputData.redirect_uri}}',
        grant_type: 'authorization_code'
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    },
    scope: 'read,write'
  },
  // If you need any fields upfront, put them here
  fields: [
    { key: 'subdomain', type: 'string', required: true, default: 'app' }
    // For OAuth2 we store `access_token` and `refresh_token` automatically
    // in `bundle.authData` for future use. If you need to save/use something
    // that the user shouldn't need to type/choose, add a "computed" field, like:
    // {key: 'user_id': type: 'string', required: false, computed: true}
    // And remember to return it in oauth2Config.getAccessToken/refreshAccessToken
  ]
};

const addBearerHeader = (request, z, bundle) => {
  if (bundle.authData && bundle.authData.access_token) {
    request.headers.Authorization = `Bearer ${bundle.authData.access_token}`;
  }
  return request;
};

const App = {
  // ...
  authentication: authentication,
  beforeRequest: [addBearerHeader]
  // ...
};

module.exports = App;

```

> Note - For OAuth2, `authentication.oauth2Config.authorizeUrl`, `authentication.oauth2Config.getAccessToken`, and `authentication.oauth2Config.refreshAccessToken`  will have the provided fields in `bundle.inputData` instead of `bundle.authData` because `bundle.authData` will only have "previously existing" values, which will be empty when the user hasn't connected their account on your service to Zapier. Also note that `authentication.oauth2Config.getAccessToken` has access to the users return values in `rawRequest` and `cleanedRequest` should you need to extract other values (for example from the query string).


## Resources

A `resource` is a representation (as a JavaScript object) of one of the REST resources of your API. Say you have a `/recipes`
endpoint for working with recipes; you can define a recipe resource in your app that will tell Zapier how to do create,
read, and search operations on that resource.

```js
const Recipe = {
  // `key` is the unique identifier the Zapier backend references
  key: 'recipe',
  // `noun` is the user-friendly name displayed in the Zapier UI
  noun: 'Recipe',
  // `list` and `create` are just a couple of the methods you can define
  list: {
    // ...
  },
  create: {
    // ...
  }
};

```

The quickest way to create a resource is with the `zapier scaffold` command:

```bash
zapier scaffold resource "Recipe"
```

This will generate the resource file and add the necessary statements to the `index.js` file to import it.


### Resource Definition

A resource has a few basic properties. The first is the `key`, which allows Zapier to identify the resource on our backend.
The second is the `noun`, the user-friendly name of the resource that is presented to users throughout the Zapier UI.

> Example App: check out https://github.com/zapier/zapier-platform/tree/master/example-apps/resource for a working example app using resources.

After those, there is a set of optional properties that tell Zapier what methods can be performed on the resource.
The complete list of available methods can be found in the [Resource Schema Docs](https://github.com/zapier/zapier-platform/blob/master/packages/schema/docs/build/schema.md#resourceschema).
For now, let's focus on two:

 * `list` - Tells Zapier how to fetch a set of this resource. This becomes a Trigger in the Zapier Editor.
 * `create` - Tells Zapier how to create a new instance of the resource. This becomes an Action in the Zapier Editor.

Here is a complete example of what the list method might look like

```js
const listRecipesRequest = {
  url: 'https://example.com/recipes'
};

const Recipe = {
  key: 'recipe',
  // ...
  list: {
    display: {
      label: 'New Recipe',
      description: 'Triggers when a new recipe is added.'
    },
    operation: {
      perform: listRecipesRequest
    }
  }
};

```

The method is made up of two properties, a `display` and an `operation`. The `display` property ([schema](https://github.com/zapier/zapier-platform/blob/master/packages/schema/docs/build/schema.md#basicdisplayschema)) holds the info needed to present the method as an available Trigger in the Zapier Editor. The `operation` ([schema](https://github.com/zapier/zapier-platform/blob/master/packages/schema/docs/build/schema.md#resourceschema)) provides the implementation to make the API call.

Adding a create method looks very similar.

```js
const createRecipeRequest = {
  url: 'https://example.com/recipes',
  method: 'POST',
  body: {
    name: 'Baked Falafel',
    style: 'mediterranean'
  }
};

const Recipe = {
  key: 'recipe',
  // ...
  list: {
    // ...
  },
  create: {
    display: {
      label: 'Add Recipe',
      description: 'Adds a new recipe to our cookbook.'
    },
    operation: {
      perform: createRecipeRequest
    }
  }
};

```

Every method you define on a `resource` Zapier converts to the appropriate Trigger, Create, or Search. Our examples
above would result in an app with a New Recipe Trigger and an Add Recipe Create.

Note the keys for the Trigger, Create, Search, and Search or Create are automatically generated (in case you want to use them in a dynamic dropdown), like: `{resourceName}List`, `{resourceName}Create`, `{resourceName}Search`, and `{resourceName}SearchOrCreate`; in the examples above, `{resourceName}` would be `recipe`.


## Triggers/Searches/Creates

Triggers, Searches, and Creates are the way an app defines what it is able to do. Triggers read
data into Zapier (i.e. watch for new recipes). Searches locate individual records (find recipe by title). Creates create
new records in your system (add a recipe to the catalog).

The definition for each of these follows the same structure. Here is an example of a trigger:

```js
const recipeListRequest = {
  url: 'https://example.com/recipes'
};

const App = {
  // ...
  triggers: {
    new_recipe: {
      key: 'new_recipe', // uniquely identifies the trigger
      noun: 'Recipe', // user-friendly word that is used to refer to the resource
      // `display` controls the presentation in the Zapier Editor
      display: {
        label: 'New Recipe',
        description: 'Triggers when a new recipe is added.'
      },
      // `operation` implements the API call used to fetch the data
      operation: {
        perform: recipeListRequest
      }
    },
    another_trigger: {
      // Another trigger definition...
    }
  }
};

```

You can find more details on the definition for each by looking at the [Trigger Schema](https://github.com/zapier/zapier-platform/blob/master/packages/schema/docs/build/schema.md#triggerschema),
[Search Schema](https://github.com/zapier/zapier-platform/blob/master/packages/schema/docs/build/schema.md#searchschema), and [Create Schema](https://github.com/zapier/zapier-platform/blob/master/packages/schema/docs/build/schema.md#createschema).

> Example App: check out https://github.com/zapier/zapier-platform/tree/master/example-apps/trigger for a working example app using triggers.

> Example App: check out https://github.com/zapier/zapier-platform/tree/master/example-apps/rest-hooks for a working example app using REST hook triggers.

> Example App: check out https://github.com/zapier/zapier-platform/tree/master/example-apps/search for a working example app using searches.

> Example App: check out https://github.com/zapier/zapier-platform/tree/master/example-apps/create for a working example app using creates.

### Return Types

Each of the 3 types of function expects a certain type of object. As of core `v1.0.11`, there are automated checks to let you know when you're trying to pass the wrong type back. There's more info in each relevant `post_X` section of the [v2 docs](https://zapier.com/developer/documentation/v2/scripting/#available-methods). For reference, each expects:

| Method | Return Type | Notes |
| --- | --- | --- |
| Trigger | Array | 0 or more objects that will be passed to the [deduper](https://zapier.com/developer/documentation/v2/deduplication/) |
| Search | Array | 0 or more objects. If len > 0, put the best match first |
| Action | Object | Return values are evaluated by [`isPlainObject`](https://lodash.com/docs#isPlainObject) |

## Input Fields

On each trigger, search, or create in the `operation` directive - you can provide an array of objects as fields under the `inputFields`. Input Fields are what your users would see in the main Zapier user interface. For example, you might have a "Create Contact" action with fields like "First name", "Last name", "Email", etc. These fields will be able to accept input from previous steps in a Zap, for example:

![gif of setting up an action field in Zap Editor](https://cdn.zapier.com/storage/photos/6bd938f7cad7e34c75ba1c1d3be75ac5.gif)

You can find more details about setting action fields from a user perspective in [our help documentation](https://zapier.com/help/creating-zap/#set-up-action-template).

Those fields have various options you can provide, here is a succinct example:

```js
const App = {
  // ...
  creates: {
    create_recipe: {
      // ...
      operation: {
        // an array of objects is the simplest way
        inputFields: [
          {
            key: 'title',
            required: true,
            label: 'Title of Recipe',
            helpText: 'Name your recipe!'
          },
          {
            key: 'style',
            required: true,
            choices: { mexican: 'Mexican', italian: 'Italian' }
          }
        ],
        perform: () => {}
      }
    }
  }
};

```

You can find more details on the different field schema options at [our Field Schema](https://github.com/zapier/zapier-platform/blob/master/packages/schema/docs/build/schema.md#fieldschema).

### Custom/Dynamic Fields

In some cases, it might be necessary to provide fields that are dynamically generated - especially for custom fields. This is a common pattern for CRMs, form software, databases and more. Basically - you can provide a function instead of a field and we'll evaluate that function - merging the dynamic fields with the static fields.

> You should see `bundle.inputData` partially filled in as users provide data - even in field retrieval. This allows you to build hierarchical relationships into fields (EG: only show issues from the previously selected project).

> A function that returns a list of dynamic fields cannot include additional functions in that list to call for dynamic fields.

```js
const recipeFields = (z, bundle) => {
  const response = z.request('https://example.com/api/v2/fields.json');
  // json is is [{"key":"field_1"},{"key":"field_2"}]
  return response.then(res => res.json);
};

const App = {
  // ...
  creates: {
    create_recipe: {
      // ...
      operation: {
        // an array of objects is the simplest way
        inputFields: [
          {
            key: 'title',
            required: true,
            label: 'Title of Recipe',
            helpText: 'Name your recipe!'
          },
          {
            key: 'style',
            required: true,
            choices: { mexican: 'Mexican', italian: 'Italian' }
          },
          recipeFields // provide a function inline - we'll merge the results!
        ],
        perform: () => {}
      }
    }
  }
};

```

Additionally, if there is a field that affects the generation of dynamic fields, you can set the `altersDynamicFields: true` property. This informs the Zapier UI that whenever the value of that field changes, fields need to be recomputed. An example could be a static dropdown of "dessert type" that will change whether the function that generates dynamic fields includes a field "with sprinkles." If your field affects others, this is an important property to set.

```js
module.exports = {
  key: 'dessert',
  noun: 'Dessert',
  display: {
    label: 'Order Dessert',
    description: 'Orders a dessert.'
  },
  operation: {
    inputFields: [
      {
        key: 'type',
        required: true,
        choices: { 1: 'cake', 2: 'ice cream', 3: 'cookie' },
        altersDynamicFields: true
      },
      function(z, bundle) {
        if (bundle.inputData.type === '2') {
          return [{ key: 'with_sprinkles', type: 'boolean' }];
        }
        return [];
      }
    ],
    perform: function(z, bundle) {
      /* ... */
    }
  }
};

```

> Only dropdowns support `altersDynamicFields`.

### Dynamic Dropdowns

Sometimes, API endpoints require clients to specify a parent object in order to create or access the child resources. For instance, specifying a spreadsheet id in order to retrieve its worksheets. Since people don't speak in auto-incremented ID's, it is necessary that Zapier offer a simple way to select that parent using human readable handles.

Our solution is to present users a dropdown that is populated by making a live API call to fetch a list of parent objects. We call these special dropdowns "dynamic dropdowns."

To define one you include the `dynamic` property on the `inputFields` object. The value for the property is a dot-separated _string_ concatenation.

```js
//...
issue: {
  key: 'issue',
  //...
  create: {
    //...
    operation: {
      inputFields: [
        {
          key: 'project_id',
          required: true,
          label: 'This is a dynamic dropdown',
          dynamic: 'project.id.name'
        }, // will call the trigger with a key of project
        {
          key: 'title',
          required: true,
          label: 'Title',
          helpText: 'What is the name of the issue?'
        }
      ]
    }
  }
}

```

The dot-separated string concatenation follows this pattern:

- The key of the trigger you want to use to power the dropdown. _required_
- The value to be made available in bundle.inputData. _required_
- The human friendly value to be shown on the left of the dropdown in bold. _optional_

In the above code example the dynamic property makes reference to a trigger with a key of project. Assuming the project trigger returns an array of objects and each object contains an id and name key, i.e.

```js
[
  { id: '1', name: 'First Option', dateCreated: '01/01/2000' },
  { id: '2', name: 'Second Option', dateCreated: '01/01/2000' },
  { id: '3', name: 'Third Option', dateCreated: '01/01/2000' },
  { id: '4', name: 'Fourth Option', dateCreated: '01/01/2000' }
];

```

The dynamic dropdown would look something like this.
![screenshot of dynamic dropdown in Zap Editor](https://cdn.zapier.com/storage/photos/dd31fa761e0cf9d0abc9b50438f95210.png)

In the first code example the dynamic dropdown is powered by a trigger. You can also use a resource to power a dynamic dropdown. To do this combine the resource key and the resource method using camel case.

```js
const App = {
  // ...
  resources: {
    project: {
      key: 'project',
      // ...
      list: {
        // ...
        operation: {
          perform: () => {
            return [{ id: 123, name: 'Project 1' }];
          } // called for project_id dropdown
        }
      }
    },
    issue: {
      key: 'issue',
      // ...
      create: {
        // ...
        operation: {
          inputFields: [
            {
              key: 'project_id',
              required: true,
              label: 'Project',
              dynamic: 'projectList.id.name'
            }, // calls project.list
            {
              key: 'title',
              required: true,
              label: 'Title',
              helpText: 'What is the name of the issue?'
            }
          ]
        }
      }
    }
  }
};

```

In some cases you will need to power a dynamic dropdown but do not want to make the Trigger available to the end user. Here it is best practice to create the trigger and set `hidden: true` on it's display object.

```js
const App = {
  // ...
  triggers: {
    new_project: {
      key: 'project',
      noun: 'Project',
      // `display` controls the presentation in the Zapier Editor
      display: {
        label: 'New Project',
        description: 'Triggers when a new project is added.',
        hidden: true
      },
      operation: {
        perform: projectListRequest
      }
    },
    another_trigger: {
      // Another trigger definition...
    }
  }
};

```

You can have multiple dynamic dropdowns in a single Trigger or Action. And a dynamic dropdown can depend on the value chosen in another dynamic dropdown when making it's API call. Such as a Spreadsheet and Worksheet dynamic dropdown in a trigger or action. This means you must make sure that the key of the first dynamic dropdown is the same as referenced in the trigger powering the second.

Let's say you have a Worksheet trigger with a `perform` method similar to this.

```js
perform: () => {
  return z
    .request('https://example.com/api/v2/projects.json', {
      params: {
        spreadsheet_id: bundle.inputData.spreadsheet_id
      }
    })
    .then(response => z.JSON.parse(response.content));
};

```

And your New Records trigger has a Spreadsheet and a Worksheet dynamic dropdown. The Spreadsheet dynamic dropdown must have a key of `spreadsheet_id`. When the user selects a spreadsheet via the dynamic dropdown the value chosen is made available in `bundle.inputData`. It will then be passed to the Worksheet trigger when the user clicks on the Worksheet dynamic dropdown.

```js
const App = {
  // ...
  triggers: {
    // ...
    issue: {
      key: 'new_records',
      // ...
      create: {
        // ...
        operation: {
          inputFields: [
            {
              key: 'spreadsheet_id',
              required: true,
              label: 'Spreadsheet',
              dynamic: 'spreadsheet.id.name'
            },
            {
              key: 'worksheet_id',
              required: true,
              label: 'Worksheet',
              dynamic: 'worksheet.id.name'
            }
          ]
        }
      }
    }
  }
};

```

The [Google Sheets](https://zapier.com/apps/google-sheets/integrations#triggers-and-actions) integration is an example of this pattern.

If you want your trigger to perform specific scripting for a dynamic dropdown you will need to make use of `bundle.meta.isFillingDynamicDropdown`. This can be useful if need to make use of [pagination](#whats-the-deal-with-pagination-when-is-it-used-and-how-does-it-work) in the dynamic dropdown to load more options.

```js
const App = {
  // ...
  resources: {
    project: {
      key: 'project',
      // ...
      list: {
        // ...
        operation: {
          canPaginate: true,
          perform: () => {
            if (bundle.meta.isFillingDynamicDropdown) {
              // perform pagination request here
            } else {
              return [{ id: 123, name: 'Project 1' }];
            }
          }
        }
      }
    },
    issue: {
      key: 'issue',
      // ...
      create: {
        // ...
        operation: {
          inputFields: [
            {
              key: 'project_id',
              required: true,
              label: 'Project',
              dynamic: 'projectList.id.name'
            }, // calls project.list
            {
              key: 'title',
              required: true,
              label: 'Title',
              helpText: 'What is the name of the issue?'
            }
          ]
        }
      }
    }
  }
};

```

### Search-Powered Fields

For fields that take id of another object to create a relationship between the two (EG: a project id for a ticket), you can specify the `search` property on the field to indicate that Zapier needs to prompt the user to setup a Search step to populate the value for this field. Similar to dynamic dropdowns, the value for this property is a dot-separated concatenation of a search's key and the field to use for the value.

```js
const App = {
  // ...
  resources: {
    project: {
      key: 'project',
      // ...
      search: {
        // ...
        operation: {
          perform: () => {
            return [{ id: 123, name: 'Project 1' }];
          } // called for project_id
        }
      }
    },
    issue: {
      key: 'issue',
      // ...
      create: {
        // ...
        operation: {
          inputFields: [
            {
              key: 'project_id',
              required: true,
              label: 'Project',
              dynamic: 'projectList.id.name',
              search: 'projectSearch.id'
            }, // calls project.search (requires a trigger in the "dynamic" property)
            {
              key: 'title',
              required: true,
              label: 'Title',
              helpText: 'What is the name of the issue?'
            }
          ]
        }
      }
    }
  }
};

```

**NOTE:** This has to be combined with the `dynamic` property to give the user a guided experience when setting up a Zap.

If you don't define a trigger for the `dynamic` property, the search connector won't show.

### Computed Fields

In OAuth and Session Auth, Zapier automatically stores every value from an integration’s auth API response i.e. that’s `getAccessToken` and `refreshAccessToken` for OAuth and `getSessionKey` for session auth.

You can return additional fields in these responses, on top of the expected `access_token` or `refresh_token` for OAuth and `sessionKey` for Session auth. They will be saved in `bundle.authData`. You can reference these fields in any subsequent API call as needed.

If you want Zapier to validate that these additional fields exist, you need to use Computed Fields. If you define computed fields in your integration, Zapier will check to make sure those fields exist when it runs the authentication test API call.

Computed fields work like any other field, though with `computed: true` property, and `required: false` as user can not enter computed fields themselves. Reference computed fields in API calls as `{{bundle.authData.field}}`, replacing `field` with that field's name from your test API call response.

You can see examples of computed fields in the [OAuth2](#oauth2) or [Session Auth](#session) example sections.

### Nested & Children (Line Item) Fields

When your action needs to accept an array of items, you can include an input field with the `children` attribute. The `children` attribute accepts a list of [fields](https://github.com/zapier/zapier-platform/blob/master/packages/schema/docs/build/schema.md#fieldschema) that can be input for each item in this array.

```js
const App = {
  // ...
  operation: {
    // ...
    inputFields: [
      {
        key: 'lineItems',
        children: [
          {
            key: 'lineItemId',
            type: 'integer',
            label: 'Line Item ID',
            required: true
          },
          {
            key: 'name',
            type: 'string',
            label: 'Name',
            required: true
          },
          {
            key: 'description',
            type: 'string',
            label: 'Description'
          }
        ]
      }
    ]
    // ...
  }
};

```

## Output Fields

On each trigger, search, or create in the operation directive - you can provide an array of objects as fields under the `outputFields`. Output Fields are what your users would see when they select a field provided by your trigger, search or create to map it to another.

Output Fields are optional, but can be used to:

- Define friendly labels for the returned fields. By default, we will *humanize* for example `my_key` as *My Key*.
- Make sure that custom fields that may not be found in every live sample and - since they're custom to the connected account - cannot be defined in the static sample, can still be mapped.

The [schema](https://github.com/zapier/zapier-platform/blob/master/packages/schema/docs/build/schema.md#fieldschema) for `outputFields` is shared with `inputFields` but only the `key` and `required` properties are relevant.

Custom/Dynamic Output Fields are defined in the same way as [Custom/Dynamic Input Fields](#customdynamic-fields).

### Nested & Children (Line Item) Fields

To define an Output Field for a nested field use `{{parent}}__{{key}}`. For children (line item) fields use `{{parent}}[]{{key}}`.

```js
const recipeOutputFields = (z, bundle) => {
  const response = z.request('https://example.com/api/v2/fields.json');
  // json is like [{"key":"field_1","label":"Label for Custom Field"}]
  return response.then(res => z.JSON.parse(res.content));
};

const App = {
  // ...
  triggers: {
    new_recipe: {
      // ...
      operation: {
        perform: () => {},
        sample: {
          id: 1,
          title: 'Pancake',
          author: {
            id: 1,
            name: 'Amy'
          },
          ingredients: [
            {
              name: 'Egg',
              amount: 1
            },
            {
              name: 'Milk',
              amount: 60,
              unit: 'g'
            },
            {
              name: 'Flour',
              amount: 30,
              unit: 'g'
            }
          ]
        },
        // an array of objects is the simplest way
        outputFields: [
          {
            key: 'id',
            label: 'Recipe ID',
            type: 'integer'
          },
          {
            key: 'title',
            label: 'Recipe Title',
            type: 'string'
          },
          {
            key: 'author__id',
            label: 'Author User ID',
            type: 'integer'
          },
          {
            key: 'author__name',
            label: 'Author Name',
            type: 'string'
          },
          {
            key: 'ingredients[]name',
            label: 'Ingredient Name',
            type: 'string'
          },
          {
            key: 'ingredients[]amount',
            label: 'Ingredient Amount',
            type: 'number'
          },
          {
            key: 'ingredients[]unit',
            label: 'Ingredient Unit',
            type: 'string'
          },
          recipeOutputFields // provide a function inline - we'll merge the results!
        ]
      }
    }
  }
};

```

## Z Object

We provide several methods off of the `z` object, which is provided as the first argument to all function calls in your app.

> The `z` object is passed into your functions as the first argument - IE: `perform: (z) => {}`.

### `z.request([url], options)`

`z.request([url], options)` is a promise based HTTP client with some Zapier-specific goodies. See [Making HTTP Requests](#making-http-requests).

### `z.console`

`z.console.log(message)` is a logging console, similar to Node.js `console` but logs remotely, as well as to stdout in tests. See [Log Statements](#console-logging)

### `z.dehydrate(func, inputData)`

`z.dehydrate(func, inputData)` is used to lazily evaluate a function, perfect to avoid API calls during polling or for reuse. See [Dehydration](#dehydration).

### `z.dehydrateFile(func, inputData)`

`z.dehydrateFile` is used to lazily download a file, perfect to avoid API calls during polling or for reuse. See [File Dehydration](#file-dehydration).

### `z.stashFile(bufferStringStream, [knownLength], [filename], [contentType])`

`z.stashFile(bufferStringStream, [knownLength], [filename], [contentType])` is a promise based file stasher that returns a URL file pointer. See [Stashing Files](#stashing-files).

### `z.JSON`

`z.JSON` is similar to the JSON built-in like `z.JSON.parse('...')`, but catches errors and produces nicer tracebacks.

### `z.hash()`

`z.hash()` is a crypto tool for doing things like `z.hash('sha256', 'my password')`

### `z.errors`

`z.errors` is a collection error classes that you can throw in your code, like `throw new z.errors.HaltedError('...')`.

The available errors are:

* HaltedError - Stops current operation, but will never turn off Zap. Read more on [Halting Execution](#halting-execution)
* ExpiredAuthError - Turns off Zap and emails user to manually reconnect. Read more on [Stale Authentication Credentials](#stale-authentication-credentials)
* RefreshAuthError - (OAuth2 or Session Auth) Tells Zapier to refresh credentials and retry operation. Read more on [Stale Authentication Credentials](#stale-authentication-credentials)


For more details on error handling in general, see [here](#error-handling).

### `z.cursor`

The `z.cursor` object exposes two methods:

* `z.cursor.get(): Promise<string|null>`
* `z.cursor.set(string): Promise<null>`

Any data you `set` will be available to that Zap for about an hour (or until it's overwritten). For more information, see: [paging](#paging).

## Bundle Object

This object holds the user's auth details and the data for the API requests.

> The `bundle` object is passed into your functions as the second argument - IE: `perform: (z, bundle) => {}`.

### `bundle.authData`

`bundle.authData` is user-provided authentication data, like `api_key` or `access_token`. [Read more on authentication.](#authentication)

### `bundle.inputData`

`bundle.inputData` is user-provided data for this particular run of the trigger/search/create, as defined by the inputFields. For example:

```js
{
  createdBy: 'his name is Bobby Flay'
  style: 'he cooks mediterranean'
}
```

### `bundle.inputDataRaw`

`bundle.inputDataRaw` is kind of like `inputData`, but before rendering `{{curlies}}`:

```js
{
  createdBy: 'his name is {{123__chef_name}}'
  style: 'he cooks {{456__style}}'
}
```

> "curlies" are data mapped in from previous steps. They take the form `{{NODE_ID__key_name}}`. You'll usually want to use `bundle.inputData` instead.

### `bundle.meta`

`bundle.meta` contains extra information useful for doing advanced behaviors depending on what the user is doing. It has the following options:

| key | default | description |
| --- | --- | --- |
| `isLoadingSample` | `false` | If true, this run was initiated manually via the Zap Editor |
| `isFillingDynamicDropdown` | `false` | If true, this poll is being used to populate a dynamic dropdown. You only need to return the fields you specified (such as `id` and `name`), though returning everything is fine too |
| `isPopulatingDedupe` | `false` | If true, the results of this poll will be used to initialize the deduplication list rather than trigger a zap. You should grab as many items as possible. See also: [deduplication](#dedup) |
| `limit` | `-1` | The number of items you should fetch. `-1` indicates there's no limit. Build this into your calls insofar as you are able |
| `page` | `0` | Used in [paging](#paging) to uniquely identify which page of results should be returned |
| `isTestingAuth` | `false` | (legacy property) If true, the poll was triggered by a user testing their account (via [clicking "test"](https://cdn.zapier.com/storage/photos/5c94c304ce11b02c073a973466a7b846.png) or during setup). We use this data to populate the auth label, but it's mostly used to verify we made a successful authenticated request |

> Before version `8.0.0`, the information in `bundle.meta` was different. See [the old docs](https://github.com/zapier/zapier-platform-cli/blob/a058e6d538a75d215d2e0c52b9f49a97218640c4/README.md#bundlemeta) for the previous values and [the wiki](https://github.com/zapier/zapier-platform/wiki/bundle.meta-changes) for a mapping of old values to new.

There's also `bundle.meta.zap.id`, which is only available in the `performSubscribe` and `performUnsubscribe` methods.

The user's Zap ID is available during the [subscribe and unsubscribe](https://github.com/zapier/zapier-platform/blob/master/packages/schema/docs/build/schema.md#basichookoperationschema) methods.

For example - you could do:

```js
const subscribeHook = (z, bundle) => {

  const options = {
    url: 'https://57b20fb546b57d1100a3c405.mockapi.io/api/hooks',
    method: 'POST',
    body: {
      url: bundle.targetUrl, // bundle.targetUrl has the Hook URL this app should call
      zap_id: bundle.meta.zap.id,
    },
  };

  return z.request(options).then((response) => response.json);
};

module.exports = {
  // ... see our rest hook example for additional details: https://github.com/zapier/zapier-platform/blob/master/example-apps/rest-hooks/triggers/recipe.js
  performSubscribe: subscribeHook,
  // ...
};
```

### `bundle.rawRequest`
> `bundle.rawRequest` is only available in the `perform` for web hooks and `getAccessToken` for oauth authentication methods.

`bundle.rawRequest` holds raw information about the HTTP request that triggered the `perform` method or that represents the users browser request that triggered the `getAccessToken` call:

```
{
  method: 'POST',
  querystring: 'foo=bar&baz=qux',
  headers: {
    'Content-Type': 'application/json'
  },
  content: '{"hello": "world"}'
}
```



### `bundle.cleanedRequest`
> `bundle.cleanedRequest` is only available in the `perform` for webhooks and `getAccessToken` for oauth authentication methods.

`bundle.cleanedRequest` will return a formatted and parsed version of the request. Some or all of the following will be available:

```
{
  method: 'POST',
  querystring: {
    foo: 'bar',
    baz: 'qux'
  },
  headers: {
    'Content-Type': 'application/json'
  },
  content: {
    hello: 'world'
  }
}
```

### `bundle.targetUrl`

> `bundle.targetUrl` is only available in the `performSubscribe` and `performUnsubscribe` methods for webhooks.

This the URL to which you should send hook data. It'll look something like `https://hooks.zapier.com/1234/abcd`. We provide it so you can make a POST request to your server.Your server should store this URL and use is as a destination when there's new data to report.

Read more in the [REST hook example](https://github.com/zapier/zapier-platform/blob/master/example-apps/rest-hooks/triggers/recipe.js).

### `bundle.subscribeData`

> `bundle.subscribeData` is only available in the `performUnsubscribe` method for webhooks.

This is an object that contains the data you returned from the `performSubscribe` function. It should contain whatever information you need send a `DELETE` request to your server to stop sending webhooks to Zapier.

Read more in the [REST hook example](https://github.com/zapier/zapier-platform/blob/master/example-apps/rest-hooks/triggers/recipe.js).

## Environment

Apps can define environment variables that are available when the app's code executes. They work just like environment
variables defined on the command line. They are useful when you have data like an OAuth client ID and secret that you
don't want to commit to source control. Environment variables can also be used as a quick way to toggle between a
a staging and production environment during app development.

It is important to note that **variables are defined on a per-version basis!** When you push a new version, the
existing variables from the previous version are copied, so you don't have to manually add them. However, edits
made to one version's environment will not affect the other versions.

### Defining Environment Variables

To define an environment variable, use the `env` command:

```bash
# Will set the environment variable on Zapier.com
zapier env 1.0.0 MY_SECRET_VALUE 1234
```

You will likely also want to set the value locally for testing.

```bash
export MY_SECRET_VALUE=1234
```

Alternatively, we provide some extra tooling to work with an `.env` (or `.environment`, see below note) that looks like this:

```
MY_SECRET_VALUE=1234
```

> `.env` is the new recommended name for the environment file since v5.1.0. The old name `.environment` is depreated but will continue to work for backward compatibility.

And then in your `test/basic.js` file:

```js
const zapier = require('zapier-platform-core');

should('some tests', () => {
  zapier.tools.env.inject(); // testing only!
  console.log(process.env.MY_SECRET_VALUE);
  // should print '1234'
});
```

> This is a popular way to provide `process.env.ACCESS_TOKEN || bundle.authData.access_token` for convenient testing.

> **NOTE** Variables defined via `zapier env` will _always_ be uppercased. For example, you would access the variable defined by `zapier env 1.0.0 foo_bar 1234` with `process.env.FOO_BAR`.


### Accessing Environment Variables

To view existing environment variables, use the `env` command.

```bash
# Will print a table listing the variables for this version
zapier env 1.0.0
```

Within your app, you can access the environment via the standard `process.env` - any values set via local `export` or `zapier env` will be there.

For example, you can access the `process.env` in your perform functions and in templates:

```js
const listExample = (z, bundle) => {
  const httpOptions = {
    headers: {
      'my-header': process.env.MY_SECRET_VALUE
    }
  };
  const response = z.request(
    'https://example.com/api/v2/recipes.json',
    httpOptions
  );
  return response.then(res => res.json);
};

const App = {
  // ...
  triggers: {
    example: {
      noun: '{{process.env.MY_NOUN}}',
      operation: {
        // ...
        perform: listExample
      }
    }
  }
};

```

> Note! Be sure to lazily access your environment variables - see [When to use placeholders or curlies?](#when-to-use-placeholders-or-curlies).


## Making HTTP Requests

There are two primary ways to make HTTP requests in the Zapier platform:

1. **Shorthand HTTP Requests** - these are simple object literals that make it easy to define simple requests.
2. **Manual HTTP Requests** - you use `z.request([url], options)` to make the requests and control the response. Use this when you need to change options for certain requests (for all requests, use middleware).

There are also a few helper constructs you can use to reduce boilerplate:

1. `requestTemplate` which is an shorthand HTTP request that will be merged with every request.
2. `beforeRequest` middleware which is an array of functions to mutate a request before it is sent.
3. `afterResponse` middleware which is an array of functions to mutate a response before it is completed.

> Note: you can install any HTTP client you like - but this is greatly discouraged as you lose [automatic HTTP logging](#http-logging) and middleware.

### Shorthand HTTP Requests

For simple HTTP requests that do not require special pre or post processing, you can specify the HTTP options as an object literal in your app definition.

This features:

1. Lazy `{{curly}}` replacement.
2. JSON and form body de-serialization.
3. Automatic non-2xx error raising.

```js
const triggerShorthandRequest = {
  method: 'GET',
  url: 'https://{{bundle.authData.subdomain}}.example.com/v2/api/recipes.json',
  params: {
    sort_by: 'id',
    sort_order: 'DESC'
  }
};

const App = {
  // ...
  triggers: {
    example: {
      // ...
      operation: {
        // ...
        perform: triggerShorthandRequest
      }
    }
  }
};

```

In the URL above, `{{bundle.authData.subdomain}}` is automatically replaced with the live value from the bundle. If the call returns a non 2xx return code, an error is automatically raised. The response body is automatically parsed as JSON and returned.

An error will be raised if the response is not valid JSON, so _do not use shorthand HTTP requests with non-JSON responses_.

### Manual HTTP Requests

When you need to do custom processing of the response, or need to process non-JSON responses, you can make manual HTTP requests. This approach does not perform any magic - no status code checking, no automatic JSON parsing. Use this method when you need more control. Manual requests do perform lazy `{{curly}}` replacement.

To make a manual HTTP request, use the `request` method of the `z` object:

```js
const listExample = (z, bundle) => {
  const customHttpOptions = {
    headers: {
      'my-header': 'from zapier'
    }
  };

  return z
    .request('https://example.com/api/v2/recipes.json', customHttpOptions)
    .then(response => {
      if (response.status >= 300) {
        throw new Error(`Unexpected status code ${response.status}`);
      }

      const recipes = z.JSON.parse(response.content);
      // do any custom processing of recipes here...

      return recipes;
    });
};

const App = {
  // ...
  triggers: {
    example: {
      // ...
      operation: {
        // ...
        perform: listExample
      }
    }
  }
};

```

#### POST and PUT Requests

To POST or PUT data to your API you can do this:

```js
const App = {
  // ...
  triggers: {
    example: {
      // ...
      operation: {
        // ...
        perform: (z, bundle) => {
          const recipe = {
            name: 'Baked Falafel',
            style: 'mediterranean',
            directions: 'Get some dough....'
          };

          const options = {
            method: 'POST',
            body: JSON.stringify(recipe)
          };

          return z
            .request('https://example.com/api/v2/recipes.json', options)
            .then(response => {
              if (response.status !== 201) {
                throw new Error(`Unexpected status code ${response.status}`);
              }
            });
        }
      }
    }
  }
};

```

> Note: you need to call `z.JSON.stringify()` before setting the `body`.

### Using HTTP middleware

If you need to process all HTTP requests in a certain way, you may be able to use one of utility HTTP middleware functions.

> Example App: check out https://github.com/zapier/zapier-platform/tree/master/example-apps/middleware for a working example app using HTTP middleware.

Try putting them in your app definition:

```js
const addHeader = (request, z, bundle) => {
  request.headers['my-header'] = 'from zapier';
  return request;
};

const mustBe200 = (response, z, bundle) => {
  if (response.status !== 200) {
    throw new Error(`Unexpected status code ${response.status}`);
  }
  return response;
};

const autoParseJson = (response, z, bundle) => {
  response.json = z.JSON.parse(response.content);
  return response;
};

const App = {
  // ...
  beforeRequest: [addHeader],
  afterResponse: [mustBe200, autoParseJson]
  // ...
};

```

A `beforeRequest` middleware function takes a request options object, and returns a (possibly mutated) request object. An `afterResponse` middleware function takes a response object, and returns a (possibly mutated) response object. Middleware functions are executed in the order specified in the app definition, and each subsequent middleware receives the request or response object returned by the previous middleware.

Middleware functions can be asynchronous - just return a promise from the middleware function.

The second argument for middleware is the `z` object, but it does *not* include `z.request()` as using that would easily create infinite loops.

### HTTP Request Options

Shorthand requests and manual `z.request([url], options)` calls support the following HTTP `options`:

* `url`: HTTP url, you can provide it both `z.request(url, options)` or `z.request({url: url, ...})`.
* `method`: HTTP method, default is `GET`.
* `headers`: request headers object, format `{'header-key': 'header-value'}`.
* `params`: URL query params object, format `{'query-key': 'query-value'}`.
* `body`: request body, can be a string, buffer, readable stream or plain object. When it is an object/array and the `Content-Type` header is `application/x-www-form-urlencoded` the body will be transformed to query string parameters, otherwise we'll set the header to `application/json; charset=utf-8` and JSON encode the body. Default is `null`.
* `json`: shortcut object/array/etc. you want to JSON encode into body. Default is `null`.
* `form`: shortcut object. you want to form encode into body. Default is `null`.
* `raw`: set this to stream the response instead of consuming it immediately. Default is `false`.
* `redirect`: set to `manual` to extract redirect headers, `error` to reject redirect, default is `follow`.
* `follow`: maximum redirect count, set to `0` to not follow redirects. default is `20`.
* `compress`: support gzip/deflate content encoding. Set to `false` to disable. Default is `true`.
* `agent`: Node.js `http.Agent` instance, allows custom proxy, certificate etc. Default is `null`.
* `timeout`: request / response timeout in ms. Set to `0` to disable (OS limit still applies), timeout reset on `redirect`. Default is `0` (disabled).
* `size`: maximum response body size in bytes. Set to `0` to disable. Default is `0` (disabled).

```js
z.request({
  url: 'https://example.com',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  // only provide body, json or form...
  body: {hello: 'world'}, // or '{"hello": "world"}' or 'hello=world'
  json: {hello: 'world'},
  form: {hello: 'world'},
  // access node-fetch style response.body
  raw: false,
  redirect: 'follow',
  follow: 20,
  compress: true,
  agent: null,
  timeout: 0,
  size: 0,
})
```

### HTTP Response Object

The response object returned by `z.request([url], options)` supports the following fields and methods:

* `status`: The response status code, i.e. `200`, `404`, etc.
* `content`: The response content as a String. For Buffer, try `options.raw = true`.
* `json`: The response content as an object (or `undefined`). If `options.raw = true` - is a promise.
* `body`: A stream available only if you provide `options.raw = true`.
* `headers`: Response headers object. The header keys are all lower case.
* `getHeader(key)`: Retrieve response header, case insensitive: `response.getHeader('My-Header')`
* `throwForStatus()`: Throw error if final `response.status > 300`. Will throw `z.error.RefreshAuthError` if 401.
* `request`: The original request options object (see above).

```js
z.request({
  // ..
}).then((response) => {
  // a bunch of examples lines for cherry picking
  response.status;
  response.headers['Content-Type'];
  response.getHeader('content-type');
  response.request; // original request options
  response.throwForStatus();
  // if options.raw === false (default)...
  JSON.parse(response.content);
  response.json;
  // if options.raw === true...
  response.buffer().then(buf => buf.toString());
  response.text().then(content => content);
  response.json().then(json => json);
  response.body.pipe(otherStream);
});
```


## Dehydration

Dehydration, and its counterpart Hydration, is a tool that can lazily load data that might be otherwise expensive to retrieve aggressively.

* **Dehydration** - think of this as "make a pointer", you control the creation of pointers with `z.dehydrate(func, inputData)` (or `z.dehydrateFile(func, inputData)` for files). This usually happens in a trigger step.
* **Hydration** - think of this as an automatic step that "consumes a pointer" and "returns some data", Zapier does this automatically behind the scenes. This usually happens in an action step.

> This is very common when [Stashing Files](#stashing-files) - but that isn't their only use!

The method `z.dehydrate(func, inputData)` has two required arguments:

* `func` - the function to call to fetch the extra data. Can be any raw `function`, defined in the file doing the dehydration or imported from another part of your app. You must also register the function in the app's `hydrators` property
* `inputData` - this is an object that contains things like a `path` or `id` - whatever you need to load data on the other side

> **Why do I need to register my functions?** Because of how Javascript works with its module system, we need an explicit handle on the function that can be accessed from the App definition without trying to "automagically" (and sometimes incorrectly) infer code locations.

Here is an example that pulls in extra data for a movie:

```js
const getExtraDataFunction = (z, bundle) => {
  const url = `https://example.com/movies/${bundle.inputData.id}.json`;
  return z.request(url).then(res => z.JSON.parse(res.content));
};

const movieList = (z, bundle) => {
  return z
    .request('https://example.com/movies.json')
    .then(res => z.JSON.parse(res.content))
    .then(results => {
      return results.map(result => {
        // so maybe /movies.json is thin content but
        // /movies/:id.json has more details we want...
        result.moreData = z.dehydrate(getExtraDataFunction, {
          id: result.id
        });
        return result;
      });
    });
};

const App = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  // don't forget to register hydrators here!
  // it can be imported from any module
  hydrators: {
    getExtraData: getExtraDataFunction
  },

  triggers: {
    new_movie: {
      noun: 'Movie',
      display: {
        label: 'New Movie',
        description: 'Triggers when a new Movie is added.'
      },
      operation: {
        perform: movieList
      }
    }
  }
};

module.exports = App;

```

And in future steps of the Zap - if Zapier encounters a pointer as returned by `z.dehydrate(func, inputData)` - Zapier will tie it back to your app and pull in the data lazily.

> **Why can't I just load the data immediately?** Isn't it easier? In some cases it can be - but imagine an API that returns 100 records when polling - doing 100x `GET /id.json` aggressive inline HTTP calls when 99% of the time Zapier doesn't _need_ the data yet is wasteful.


### File Dehydration

*New in v7.3.0.*

The method `z.dehydrateFile(func, inputData)` allows you to download a file lazily. It takes the identical arguments as `z.dehydrate(func, inputData)` does.

An example can be found in the [Stashing Files](#stashing-files) section.

What makes `z.dehydrateFile` different from `z.dehydrate` has to do with efficiency and when Zapier chooses to hydrate data. Knowing which pointers give us back files helps us delay downloading files until its absolutely necessary. A good example is users creating Zaps in the Zap Editor. If a pointer is made by `z.dehydrate`, the Zap Editor will hydrate the data immediately after pulling in samples. This allows users to map fields from the hydrated data into the subsequent steps of the Zap. If, however, the pointer is made by `z.dehydrateFile`, the Zap Editor will wait to hydrate the file. There's nothing in binary file data for users to map in the subsequent steps.

> `z.dehydrateFile(func, inputData)` is new in v7.3.0. We used to recommend to use `z.dehydrate(func, inputData)` for files, but it's not the case anymore. Please change it to `z.dehydrateFile(func, inputData)` for a better user expereience.

## Stashing Files

It can be expensive to download and stream files or they can require complex handshakes to authorize downloads - so we provide a helpful stash routine that will take any `String`, `Buffer` or `Stream` and return a URL file pointer suitable for returning from triggers, searches, creates, etc.

The interface `z.stashFile(bufferStringStream, [knownLength], [filename], [contentType])` takes a single required argument - the extra three arguments will be automatically populated in most cases. For example - a full example is this:

```js
const content = 'Hello world!';
z.stashFile(content, content.length, 'hello.txt', 'text/plain')
  .then(url => z.console.log(url));
// https://zapier-dev-files.s3.amazonaws.com/cli-platform/f75e2819-05e2-41d0-b70e-9f8272f9eebf
```

Most likely you'd want to stream from another URL - note the usage of `z.request({raw: true})`:

```js
const fileRequest = z.request({url: 'https://example.com/file.pdf', raw: true});
z.stashFile(fileRequest) // knownLength and filename will be sniffed from the request. contentType will be binary/octet-stream
  .then(url => z.console.log(url));
// https://zapier-dev-files.s3.amazonaws.com/cli-platform/74bc623c-d94d-4cac-81f1-f71d7d517bc7
```

> Note: you should only be using `z.stashFile()` in a hydration method or a hook trigger's `perform` if you're sending over a short-lived URL to a file. Otherwise, it can be very expensive to stash dozens of files in a polling call - for example!

See a full example with dehydration/hydration wired in correctly:

```js
const stashPDFfunction = (z, bundle) => {
  // use standard auth to request the file
  const filePromise = z.request({
    url: bundle.inputData.downloadUrl,
    raw: true
  });
  // and swap it for a stashed URL
  return z.stashFile(filePromise);
};

const pdfList = (z, bundle) => {
  return z
    .request('https://example.com/pdfs.json')
    .then(res => z.JSON.parse(res.content))
    .then(results => {
      return results.map(result => {
        // lazily convert a secret_download_url to a stashed url
        // zapier won't do this until we need it
        result.file = z.dehydrateFile(stashPDFfunction, {
          downloadUrl: result.secret_download_url
        });
        delete result.secret_download_url;
        return result;
      });
    });
};

const App = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  hydrators: {
    stashPDF: stashPDFfunction
  },

  triggers: {
    new_pdf: {
      noun: 'PDF',
      display: {
        label: 'New PDF',
        description: 'Triggers when a new PDF is added.'
      },
      operation: {
        perform: pdfList
      }
    }
  }
};

module.exports = App;

```

> Example App: check out https://github.com/zapier/zapier-platform/tree/master/example-apps/files for a working example app using files.


## Logging

There are two types of logs for a Zapier app, console logs and HTTP logs. The console logs are created by your app through the use of the `z.console.log` method ([see below for details](#console-logging)). The HTTP logs are created automatically by Zapier whenever your app makes HTTP requests (as long as you use `z.request([url], options)` or shorthand request objects).

To view the logs for your application, use the `zapier logs` command. There are three types of logs, `http` (logged automatically by Zapier on HTTP requests), `bundle` (logged automatically on every method execution), and `console` (manual logs via `z.console.log()` statements).

For advanced logging options including only displaying the logs for a certain user or app version, look at the help for the logs command:

```bash
zapier help logs
```

### Console Logging

To manually print a log statement in your code, use `z.console.log`:

```js
z.console.log('Here are the input fields', bundle.inputData);
```

The `z.console` object has all the same methods and works just like the Node.js [`Console`](https://nodejs.org/docs/latest-v6.x/api/console.html) class - the only difference is we'll log to our distributed datastore and you can view them via `zapier logs` (more below).

### Viewing Console Logs

To see your `z.console.log` logs, do:

```bash
zapier logs --type=console
```

### Viewing Bundle Logs

To see the bundle logs, do:

```bash
zapier logs --type=bundle
```

### HTTP Logging

If you are using the `z.request()` shortcut that we provide - HTTP logging is handled automatically for you. For example:

```js
z.request('https://57b20fb546b57d1100a3c405.mockapi.io/api/recipes')
  .then((res) => {
    // do whatever you like, this request is already getting logged! :-D
    return res;
  })
```

### Viewing HTTP Logs

To see the HTTP logs, do:

```bash
zapier logs --type=http
```
To see detailed http logs including headers, request and response bodies, etc, do:

```bash
zapier logs --type=http --detailed
```


## Error Handling

APIs are not always available. Users do not always input data correctly to
formulate valid requests. Thus, it is a good idea to write apps defensively and
plan for 4xx and 5xx responses from APIs. Without proper handling, errors often
have incomprehensible messages for end users, or possibly go uncaught.

Zapier provides a couple tools to help with error handling. First is the `afterResponse`
middleware ([docs](#using-http-middleware)), which provides a hook for processing
all responses from HTTP calls. The other tool is the collection of errors in
`z.errors` ([docs](#zerrors)), which control the behavior of Zaps when
various kinds of errors occur.

### General Errors

Errors due to a misconfiguration in a user's Zap should be handled in your app
by throwing a standard JavaScript `Error` with a user-friendly message.
Typically, this will be prettifying 4xx responses or APIs that return errors as
200s with a payload that describes the error.

Example: `throw new Error('Your error message.');`

A couple best practices to keep in mind:

  * Elaborate on terse messages. "not_authenticated" -> "Your API Key is invalid. Please reconnect your account."
  * If the error calls out a specific field, surface that information to the user. "Invalid Request" -> "contact name is invalid"
  * If the error provides details about why a field is invalid, add that in too! "contact name is invalid" -> "contact name is too long"

Note that if a Zap raises too many error messages it will be automatically
turned off, so only use these if the scenario is truly an error that needs to
be fixed.

### Halting Execution

Any operation can be interrupted or "halted" (not success, not error, but
stopped for some specific reason) with a `HaltedError`. You might find yourself
using this error in cases where a required pre-condition is not met. For instance,
in a create to add an email address to a list where duplicates are not allowed,
you would want to throw a `HaltedError` if the Zap attempted to add a duplicate.
This would indicate failure, but it would be treated as a soft failure.

Unlike throwing `Error`, a Zap will never by turned off when this error is thrown
(even if it is raised more often than not).

Example: `throw new z.errors.HaltedError('Your reason.');`

### Stale Authentication Credentials

For apps that require manual refresh of authorization on a regular basis, Zapier
provides a mechanism to notify users of expired credentials. With the
`ExpiredAuthError`, the current operation is interrupted, the Zap is turned off
(to prevent more calls with expired credentials), and a predefined email is sent
out informing the user to refresh the credentials.

Example: `throw new z.errors.ExpiredAuthError('Your message.');`

For apps that use OAuth2 + refresh or Session Auth, you can use the
`RefreshAuthError`. This will signal Zapier to refresh the credentials and then
repeat the failed operation.

Example: `throw new z.errors.RefreshAuthError();`


## Testing

You can write unit tests for your Zapier app that run locally, outside of the zapier editor.
You can run these tests in a CI tool like [Travis](https://travis-ci.com/).

### Writing Unit Tests

We recommend using the [Mocha](https://mochajs.org/) testing framework. After running
`zapier init` you should find an example test to start from in the `test` directory.

```js
// we use should assertions
const should = require('should');
const zapier = require('zapier-platform-core');

// createAppTester() makes it easier to test your app. It takes your
// raw app definition, and returns a function that will test you app.
const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('triggers', () => {
  describe('new recipe trigger', () => {
    it('should load recipes', done => {
      // This is what Zapier will send to your app as input.
      // It contains trigger options the user choice in their zap.
      const bundle = {
        inputData: {
          style: 'mediterranean'
        }
      };

      // Pass appTester the path to the trigger you want to call,
      // and the input bundle. appTester returns a promise for results.
      appTester(App.App.triggers.recipe.operation.perform, bundle)
        .then(results => {
          // Make assertions

          results.length.should.eql(10);

          const firstRecipe = results[0];
          firstRecipe.name.should.eql('Baked Falafel');

          done();
        })
        .catch(done);
    });
  });
});

```

### Mocking Requests

While testing, it's useful to test your code without actually hitting any external services. [Nock](https://github.com/node-nock/nock) is a node.js utility that intercepts requests before they ever leave your computer. You can specify a response code, body, headers, and more. It works out of the box with `z.request` by setting up your `nock` before calling `appTester`.

```js
require('should');

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);

const nock = require('nock');

describe('triggers', () => {
  describe('new recipe trigger', () => {
    it('should load recipes', done => {
      const bundle = {
        inputData: {
          style: 'mediterranean'
        }
      };

      // mocks the next request that matches this url and querystring
      nock('https://57b20fb546b57d1100a3c405.mockapi.io/api')
        .get('/recipes')
        .query(bundle.inputData)
        .reply(200, [
          { name: 'name 1', directions: 'directions 1', id: 1 },
          { name: 'name 2', directions: 'directions 2', id: 2 }
        ]);

      appTester(App.triggers.recipe.operation.perform, bundle)
        .then(results => {
          results.length.should.above(1);

          const firstRecipe = results[0];
          firstRecipe.name.should.eql('name 1');
          firstRecipe.directions.should.eql('directions 1');

          done();
        })
        .catch(done);
    });

    it('should load recipes without filters', done => {
      const bundle = {};

      // each test needs its own mock
      nock('https://57b20fb546b57d1100a3c405.mockapi.io/api')
        .get('/recipes')
        .reply(200, [
          { name: 'name 1', directions: 'directions 1', id: 1 },
          { name: 'name 2', directions: 'directions 2', id: 2 }
        ]);

      appTester(App.triggers.recipe.operation.perform, bundle)
        .then(results => {
          results.length.should.above(1);

          const firstRecipe = results[0];
          firstRecipe.name.should.eql('name 1');
          firstRecipe.directions.should.eql('directions 1');

          done();
        })
        .catch(done);
    });
  });
});

```

There's more info about nock and its usage in its [readme](https://github.com/node-nock/nock/blob/master/README.md).

### Running Unit Tests

To run all your tests do:

```bash
zapier test
```

> You can also go direct with `npm test` or `node_modules/mocha/bin/mocha`.

### Testing & Environment Variables

The best way to store sensitive values (like API keys, OAuth secrets, or passwords) is in an `.env` (or `.environment`, see below note) file ([learn more](https://github.com/motdotla/dotenv#faq)). Then, you can include the following before your tests run:

```js
const zapier = require('zapier-platform-core');
zapier.tools.env.inject(); // inject() can take a filename; defaults to ".env"

// now process.env has all the values in your .env file
```

> `.env` is the new recommended name for the environment file since v5.1.0. The old name `.environment` is depreated but will continue to work for backward compatibility.

> Remember: **NEVER** add your secrets file to version control!

Additionally, you can provide them dynamically at runtime:

```bash
CLIENT_ID=1234 CLIENT_SECRET=abcd zapier test
```

Or, `export` them explicitly and place them into the environment:

```bash
export CLIENT_ID=1234
export CLIENT_SECRET=abcd
zapier test
```


### Viewing HTTP Logs in Unit Tests


When running a unit test via `zapier test`, `z.console` statements and detailed HTTP logs print to `stdout`:

```bash
zapier test
```

Sometimes you don't want that much logging, for example in a CI test. To suppress the detailed HTTP logs do:

```bash
zapier test --quiet
```

To also suppress the HTTP summary logs do:

```bash
zapier test --very-quiet
```

### Testing in Your CI

Whether you use Travis, Circle, Jenkins, or anything else, we aim to make it painless to test in an automated environment.

Behind the scenes `zapier test` is doing a pretty standard `npm test` with [mocha](https://www.npmjs.com/package/mocha) as the backend.

This makes it pretty straightforward to integrate into your testing interface. If you'd like to test with [Travis CI](https://travis-ci.com/) for example - the `.travis.yml` would look something like this:

```yaml
language: node_js
node_js:
  - "v8.10.0"
before_script: npm install -g zapier-platform-cli
script: CLIENT_ID=1234 CLIENT_SECRET=abcd zapier test
```

You can substitute `zapier test` with `npm test`, or a direct call to `node_modules/mocha/bin/mocha`. Also, we generally recommend putting the environment variables into whatever configuration screen Jenkins or Travis provides!

As an alternative to reading the deploy key from root (the default location), you may set the `ZAPIER_DEPLOY_KEY` environment variable to run privileged commands without the human input needed for `zapier login`. We suggest encrypting your deploy key in whatever manner you CI provides (such as [these instructions](https://docs.travis-ci.com/user/environment-variables/#Defining-encrypted-variables-in-.travis.yml), for Travis).


## Using `npm` Modules

Use `npm` modules just like you would use them in any other node app, for example:

```bash
npm install --save jwt
```

And then `package.json` will be updated, and you can use them like anything else:

```js
const jwt = require('jwt');
```

During the `zapier build` or `zapier push` step - we'll copy all your code to `/tmp` folder and do a fresh re-install of modules.

> Note: If your package isn't being pushed correctly (IE: you get "Error: Cannot find module 'whatever'" in production), try adding the `--disable-dependency-detection` flag to `zapier push`.

> Note 2: You can also try adding a "includeInBuild" array property (with paths to include, which will be evaluated to RegExp, with a case insensitive flag) to your `.zapierapprc` file, to make it look like:

```json
{
  "id": 1,
  "key": "App1",
  "includeInBuild": [
    "test.txt",
    "testing.json"
  ]
}

```

> Warning: do not use compiled libraries unless you run your build on the AWS AMI `ami-4fffc834`, or follow the Docker instructions below.


## Building Native Packages with Docker

Unfortunately if you are developing on a macOS or Windows box you won't be able to build native libraries locally. If you try and push locally build native modules, you'll get runtime errors during usage. However, you can use Docker and Docker Compose to do this in a pinch. Make sure you have all the necessary Docker programs installed and follow along.

First, create your `Dockerfile`:

```Dockerfile
FROM amazonlinux:2017.03.1.20170812

RUN yum install zip findutils wget gcc44 gcc-c++ libgcc44 cmake -y

RUN wget https://nodejs.org/dist/v8.10.0/node-v8.10.0.tar.gz && \
    tar -zxvf node-v8.10.0.tar.gz && \
    cd node-v8.10.0 && \
    ./configure && \
    make && \
    make install && \
    cd .. && \
    rm -rf node-v8.10.0 node-v8.10.0.tar.gz

RUN npm i -g zapier-platform-cli

WORKDIR /app
```

And finally, create your `docker-compose.yml` file:

```yml
version: '3.4'

services:
  pusher:
    build: .
    volumes:
      - .:/app
      - node_modules:/app/node_modules:delegated
      - ~/.zapierrc:/root/.zapierrc
    command: 'bash -c "npm i && zapier push"'
    environment:
      ZAPIER_DEPLOY_KEY: ${ZAPIER_DEPLOY_KEY}

volumes:
  node_modules:
```

> Note: watch out for your `package-lock.json` file, if it exists for local install it might incorrectly pin a native version.

Now you should be able to run `docker-compose run pusher` and see the build and push successfully complete!


## Using Transpilers

We do not yet support transpilers out of the box, but if you would like to use `babel` or similar, we recommend creating a custom wrapper on `zapier push` like this in your `package.json`:

```json
{
  "scripts": {
    "zapier-dev": "babel src --out-dir lib --watch",
    "zapier-push": "babel src --out-dir lib && zapier push"
  }
}
```

And then you can have your fancy ES7 code in `src/*` and a root `index.js` like this:

```js
module.exports = require('./lib');
```

And work with commands like this:

```bash
# watch and recompile
npm run zapier-dev

# tests should work fine
zapier test

# every build ensures a fresh build
npm run zapier-push
```

There are a lot of details left out - check out the full example app for a working setup.

> Example App: check out https://github.com/zapier/zapier-platform/tree/master/example-apps/babel for a working example app using Babel.

## Example Apps

See [the wiki](https://github.com/zapier/zapier-platform/wiki/Example-Apps) for a full list of working examples (and installation instructions).

## FAQs

### Why doesn't Zapier support newer versions of Node.js?

We run your code on AWS Lambda, which only supports a few [versions](https://docs.aws.amazon.com/lambda/latest/dg/programming-model.html) of Node (the latest of which is `v8.10.0`. As that updates, so too will we.

### How do I manually set the Node.js version to run my app with?

Update your `zapier-platform-core` dependency in `package.json`.  Each major version ties to a specific version of Node.js. You can find the mapping [here](https://github.com/zapier/zapier-platform/blob/master/packages/cli/src/version-store.js). We only support the version(s) supported by [AWS Lambda](https://docs.aws.amazon.com/lambda/latest/dg/programming-model.html).

**IMPORTANT CAVEAT**: AWS periodically deprecates Node versions as they reach EOL. They announce this[on their blog](https://aws.amazon.com/blogs/developer/node-js-6-is-approaching-end-of-life-upgrade-your-aws-lambda-functions-to-the-node-js-10-lts/). Similar info and dates are available on [github](https://github.com/nodejs/Release). Well before this date, we'll have a version of `core` that targets the newer Node version.

If you don't upgrade before the cutoff date, there's a chance that AWS will throw an error when attempting to run your app's code. If that's the case, we'll instead run it under the oldest Node version still supported. All that is to say, **we may run your code on a newer version of Node.js than you intend** if you don't update your app's dependencies periodically.

### When to use placeholders or curlies?

You will see both [template literal placeholders](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Expression_interpolation) `${var}` and (double) "curlies" `{{var}}` used in examples.

In general, use `${var}` within functions and use `{{var}}` anywhere else.

Placeholders get evaluated as soon as the line of code is evaluated. This means that if you use `${process.env.VAR}` in a trigger configuration, `zapier push` will substitute it with your local environment's value for `VAR` when it builds your app and the value set via `zapier env` will not be used.

> If you're not familiar with [template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals), know that `const val = "a" + b + "c"` is essentially the same as <code>const val = &#96;a${b}c&#96;</code>.

### Does Zapier support XML (SOAP) APIs?

Not natively, but it can! Users have reported that the following `npm` modules are compatible with the CLI Platform:

* [pixl-xml](https://github.com/jhuckaby/pixl-xml)
* [xml2js](https://github.com/Leonidas-from-XIV/node-xml2js)
* [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser)

```js
const xml = require('pixl-xml');

const App = {
  // ...
  afterResponse: [
    (response, z, bundle) => {
      response.xml = xml.parse(response.content);
      return response;
    }
  ]
  // ...
};

```

### Is it possible to iterate over pages in a polling trigger?

Yes, though there are caveats. Your entire function only gets 30 seconds to run. HTTP requests are costly, so paging through a list may time out (which you should avoid at all costs).

```js
// some async call
const makeCall = (z, start, limit) => {
  return z.request({
    url: 'https://jsonplaceholder.typicode.com/posts',
    params: {
      _start: start,
      _limit: limit
    }
  });
};

// triggers on paging with a certain tag
const performPaging = (z, bundle) => {
  const limit = 3;
  let start = 0;

  // array of promises
  const promises = [];

  let i = 0;
  while (i < 5) {
    promises.push(makeCall(z, start, limit));
    start += limit;
    i += 1;
  }

  return Promise.all(promises).then(res => {
    // res is an array of responses
    const results = res.map(r => r.json); // array of arrays of js objects
    return Array.prototype.concat.apply([], results); // flatten array
  });
};

module.exports = {
  key: 'paging',
  noun: 'Paging',

  display: {
    label: 'Get Paging',
    description: 'Triggers on a new paging.'
  },

  operation: {
    inputFields: [],
    perform: performPaging
  }
};

```

If you need to do more requests conditionally based on the results of an HTTP call (such as the "next URL" param or similar value), using `async/await` (as shown in the example below) is a good way to go. If you go this route, only page as far as you need to. Keep an eye on the polling [guidelines](https://zapier.com/developer/documentation/v2/deduplication/), namely the part about only iterating until you hit items that have probably been seen in a previous poll.

```js
// a hypothetical API where payloads are big so we want to heavily limit how much comes back
// we want to only return items created in the last hour

const asyncExample = async (z, bundle) => {
  const limit = 3;
  let start = 0;
  const twoHourMilliseconds = 60 * 60 * 2 * 1000;
  const hoursAgo = new Date() - twoHourMilliseconds;

  let response = await z.request({
    url: 'https://jsonplaceholder.typicode.com/posts',
    params: {
      _start: start,
      _limit: limit
    }
  });

  let results = response.json;

  // keep paging until the last item was created over two hours ago
  // then we know we almost certainly haven't missed anything and can let
  //   deduper handle the rest

  while (new Date(results[results.length - 1].createdAt) > hoursAgo) {
    start += limit; // next page

    response = await z.request({
      url: 'https://jsonplaceholder.typicode.com/posts',
      params: {
        _start: start,
        _limit: limit
      }
    });

    results = results.concat(response.json);
  }

  return results;
};

```

### How do search-powered fields relate to dynamic dropdowns and why are they both required together?

To understand search-powered fields, we have to have a good understanding of dynamic dropdowns.

When users are selecting specific resources (for instance, a Google Sheet), it's important they're able to select the exact sheet they want. Instead of referencing the sheet by name (which may change), we match via `id` instead. Rather than directing the user copy and paste an id for every item they might encounter, there is the notion of a **dynamic dropdown**. A dropdown is a trigger that returns a list of resources. It can pull double duty and use its results to power another trigger, search, or action in the same app.  It provides a list of ids with labels that show the item's name:

![](https://cdn.zapier.com/storage/photos/fb56bdc2aab91504be0e51800bec4d64.png)

The field's value reaches your app as an id. You define this connection with the `dynamic` property, which is a string: `trigger_key.id_key.label_key`. This approach works great if the user setting up the Zap always wants the Zap to use the same spreadsheet. They specify the id during setup and the Zap runs happily.

**Search fields** take this connection a step further. Rather than set the spreadsheet id at setup, the user could precede the action with a search field to make the id dynamic. For instance, let's say you have a different spreadsheet for every day of the week. You could build the following zap:

1. Some Trigger
2. Calculate what day of the week it is today (Code)
3. Find the spreadsheet that matches the day from Step 2
4. Update the spreadsheet (with the id from step 3) with some data

If the connection between steps 3 and 4 is a common one, you can indicate that in your field by specifying `search` as a `search_key.id_key`. When paired **with a dynamic dropdown**, this will add a button to the editor that will add the search step to the user's Zap and map the id field correctly.

![](https://cdn.zapier.com/storage/photos/d263fd3a56cf8108cb89195163e7c9aa.png)

This is paired most often with "update" actions, where a required parameter will be a resource id.

<a id="paging"></a>
### What's the deal with pagination? When is it used and how does it work?

Paging is **only used when a trigger is part of a dynamic dropdown**. Depending on how many items exist and how many are returned in the first poll, it's possible that the resource the user is looking for isn't in the initial poll. If they hit the "see more" button, we'll increment the value of `bundle.meta.page` and poll again.

Paging is a lot like a regular trigger except the range of items returned is dynamic. The most common example of this is when you can pass a `offset` parameter:

```js
(z, bundle) => {
  const promise = z.request({
    url: 'https://example.com/api/list.json',
    params: {
      limit: 100,
      offset: 100 * bundle.meta.page
    }
  });
  return promise.then((response) => response.json);
};
```

If your API uses cursor-based paging instead of an offset, you can use `z.cursor.get` and `z.cursor.set`:

```js
// the perform method of our trigger
// ensure operation.canPaginate is true!

const performWithoutAsync = (z, bundle) => {
  return Promise.resolve()
    .then(() => {
      if (bundle.meta.page === 0) {
        // first page, no need to fetch a cursor
        return Promise.resolve();
      } else {
        return z.cursor.get(); // Promise<string | null>
      }
    })
    .then(cursor => {
      return z.request(
        'https://5ae7ad3547436a00143e104d.mockapi.io/api/recipes',
        {
          params: { cursor: cursor } // if cursor is null, it's ignored here
        }
      );
    })
    .then(response => {
      // need to save the cursor and return a promise, but also need to pass the data along
      return Promise.all([response.items, z.cursor.set(response.nextPage)]);
    })
    .then(([items /* null */]) => {
      return items;
    });
};

// ---------------------------------------------------

const performWithAsync = async (z, bundle) => {
  let cursor;
  if (bundle.meta.page) {
    cursor = await z.cursor.get(); // string | null
  }

  const response = await z.request(
    'https://5ae7ad3547436a00143e104d.mockapi.io/api/recipes',
    {
      // if cursor is null, it's sent as an empty query
      //   param and should be ignored by the server
      params: { cursor: cursor }
    }
  );

  // we successfully got page 1, should store the cursor in case the user wants page 2
  await z.cursor.set(response.nextPage);

  return response.items;
};

```

Cursors are stored per-zap and last about an hour. Per the above, make sure to only include the cursor if `bundle.meta.page !== 0`, so you don't accidentally reuse a cursor from a previous poll.

Lastly, you need to set `canPaginate` to `true` in your polling definition (per the [schema](https://github.com/zapier/zapier-platform/blob/master/packages/schema/docs/build/schema.md#basicpollingoperationschema)) for the `z.cursor` methods to work as expected.

<a id="dedup"></a>
### How does deduplication work?

Each time a polling Zap runs, Zapier needs to decide which of the items in the response should trigger the zap. To do this, we compare the `id`s to all those we've seen before, trigger on new objects, and update the list of seen `id`s. When a Zap is turned on, we initialize the list of seen `id`s with a single poll. When it's turned off, we clear that list. For this reason, it's important that calls to a polling endpoint always return the newest items.

For example, the initial poll returns objects 4, 5, and 6 (where a higher `id` is newer). If a later poll increases the limit and returns objects 1-6, then 1, 2, and 3 will be (incorrectly) treated like new objects.

There's a more in-depth explanation [here](https://zapier.com/developer/documentation/v2/deduplication/).

### Why are my triggers complaining if I don't provide an explicit `id` field?

For deduplication to work, we need to be able to identify and use a unique field. In older, legacy Zapier Web Builder apps, we guessed if `id` wasn't present. In order to ensure we don't guess wrong, we now require that the developers send us an `id` field. If your objects have a differently-named unique field, feel free to adapt this snippet and ensure this test passes:

```js
// ...
let items = z.JSON.parse(response.content).items;
items.forEach(item => {
  item.id = item.contactId;
})

return items;
```

### Node 6 No Longer Supported

If you're seeing errors like the following:

```
InvalidParameterValueException An error occurred (InvalidParameterValueException) when calling the CreateFunction operation: The runtime parameter of nodejs6.10 is no longer supported for creating or updating AWS Lambda functions. We recommend you use the new runtime (nodejs8.10) while creating or updating functions.
```

then you need to update your `zapier-platform-core` dependency to a non-deprecated version that uses a newer version of Node.js. Complete the following instructions as soon as possible:

1. Edit `package.json` to depend on a version of `zapier-platform-core` >= `7.0.0`. (8.x is the latest) There's a list of all breaking changes (marked with an :exclamation:) in the [changelog](https://github.com/zapier/zapier-platform/blob/master/CHANGELOG.md).
2. Increment the `version` property in `package.json`
3. Ensure you're using version `v8.10.0` (or greater) of node locally (`node -v`). Use [nvm](https://github.com/nvm-sh/nvm) to use a different one if need be.
4. Run `rm -rf node_modules && npm i` to get a fresh copy of everything
5. Run `zapier test` to ensure your tests still pass
6. Run `zapier push`
7. Run `zapier promote YOUR_NEW_VERSION` (from step 2)
8. Migrate your users from the previous version (`zapier migrate OLD_VERSION NEW_VERSION`)

<a id="analytics"></a>
### What Analytics are Collected?

Starting with version `8.4.0`, Zapier collects information about each invocation of the CLI tool.

This data is collected purely to improve the CLI experience and will **never** be used for advertising or any non-product purpose. There are 3 collection modes that are set on a per-computer basis.

**Anonymous**

When you run a command with analytics in `anonymous` mode, the following data is sent to Zapier:

* which command you ran
* if that command is a known command
* how many arguments you supplied (but not the contents of the arguments)
* which flags you used (but not their contents)
* the version of CLI that you're using

**Enabled** (the default)

When analytics are fully `enabled`, the above is sent, plus:

* your operating system (the result of calling [`process.platform`](https://nodejs.org/api/process.html#process_process_platform))
* your Zapier user id

**Disabled**

Lastly, analytics can be `disabled` entirely, either by running `zapier analytics --mode disabled` or setting the `DISABLE_ZAPIER_ANALYTICS` environment variable to `1`.

We take great care not to collect any information about your filesystem or anything otherwise secret. You can see exactly what's being collecting at runtime by prefixing any command with `DEBUG=zapier:analytics`.

### What's the Difference Between an "App" and an "Integration"?

We're in the process of doing some renaming across our Zapier marketing terms. Eventually we'll use "integration" everywhere. Until then, know that these terms are interchangeable and describe the code that you write that connects your API to Zapier.

## Command Line Tab Completion

We have provided two tab completion scripts to make it easier to use the Zapier Platform CLI, for zsh and bash.

### Zsh Completion Script

To use the zsh completion script, first setup support for completion, if you haven't already done so. This example assumes your completion scripts are in `~/.zsh/completion`. Adjust accordingly if you put them somewhere else:

```zsh
# add custom completion scripts
fpath=(~/.zsh/completion $fpath)

# compsys initialization
autoload -U compinit
compinit
```

Next download our completion script to your completions directory:

```zsh
cd ~/.zsh/completion
curl https://raw.githubusercontent.com/zapier/zapier-platform/master/packages/cli/goodies/zsh/_zapier -O
```

Finally, restart your shell and start hitting TAB with the `zapier` command!

### Bash Completion Script

To use the bash completion script, first download the completion script. The example assumes your completion scripts are in `~/.bash_completion.d` directory. Adjust accordingly if you put them somewhere else.

```bash
cd ~/.bash_completion.d
curl https://raw.githubusercontent.com/zapier/zapier-platform/master/packages/cli/goodies/bash/_zapier -O
```

Next source the script from your `~/.bash_profile`:

```bash
source ~/.bash_completion.d/_zapier
```

Finally, restart your shell and start hitting TAB with the `zapier` command!

## The Zapier Platform Packages

The Zapier Platform consists of 3 npm packages that are released simultaneously as a trio.

- [`zapier-platform-cli`](https://github.com/zapier/zapier-platform/tree/master/packages/cli) is the code that powers the `zapier` command. You use it most commonly with the `test`, `scaffold`, and `push` commands. It's installed with `npm install -g zapier-platform-cli` and does not correspond to a particular app.

- [`zapier-platform-core`](https://github.com/zapier/zapier-platform/tree/master/packages/core) is what allows your app to interact with Zapier. It holds the `z` object and app tester code. Your app depends on a specific version of `zapier-platform-core` in the `package.json` file. It's installed via `npm install` along with the rest of your app's dependencies.

- [`zapier-platform-schema`](https://github.com/zapier/zapier-platform/tree/master/packages/clischema) enforces app structure behind the scenes. It's a dependency of `core`, so it will be installed automatically.

### Updating

The Zapier platform and its tools are under active development. While you don't need to install every release, we release new versions because they are better than the last. We do our best to adhere to [Semantic Versioning](https://semver.org/) wherein we won't break your code unless there's a `major` release. Otherwise, we're just fixing bugs (`patch`) and adding features (`minor`).

Barring unforeseen circumstances, all released platform versions will continue to work for the forseeable future. While you never *have* to upgrade your app's `platform-core` dependency, we recommend keeping an eye on the [changelog](https://github.com/zapier/zapier-platform/blob/master/CHANGELOG.md) to see what new features and bux fixes are available.

<!-- TODO: if we decouple releases, change this -->
The most recently released version of `cli` and `core` is `8.4.2`. You can see the versions you're working with by running `zapier -v`.

To update `cli`, run `npm install -g zapier-platform-cli`.

To update the version of `core` your app depends on, set the `zapier-platform-core` dependency in your `package.json` to a version listed [here](https://www.npmjs.com/package/zapier-platform-core?activeTab=versions) and run `npm install`.

For maximum compatibility, keep the versions of `cli` and `core` in sync.

## Development of the CLI

This section is only relevant if you're editing the `zapier-platform-cli` package itself.

### Commands

- `export ZAPIER_BASE_ENDPOINT='https://localhost:8001'` if you're building against a local dev environment
- `npm install` for getting started
- `npm run build` for updating `./lib` from `./src`
- `npm run watch` for automatically building as you work
- `npm test` for running tests (also runs `npm run build`)
- `npm link` (while in this project's directory) and then use `zapier` command elsewhere
- `npm run test-convert` for running integration tests for the `zapier convert` command
- `npm run docs` for updating docs
- `npm run gen-completions` for updating the auto complete scripts

### Publishing of the CLI (after merging)

- `npm version [patch|minor|major]` will pull, test, update docs, increment version in package.json, push tags, and publish to npm
- `npm run validate-templates` for validating the example apps
- `npm run set-template-versions VERSION` for updating the platform-core version in the example app repos to `VERSION`

## Get Help!

You can get help by either emailing partners@zapier.com or by [joining our Slack team here](https://join.slack.com/t/zapier-platform/shared_invite/enQtNTg1MjM5NjMzNTI3LTUyYWJjM2E1NTQ3NjViMGY0MzQ1NWJiMDJmNjcyNTJjMWRlOTg4MTNjOWEwNDFlNGExODU5OTgzNWM3MzZlMjk).
