'use strict';

require('should');

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);

const globalBeforeSetup = (done) => {
  zapier.tools.env.inject();

  if (
    !process.env.CLIENT_ID ||
    !process.env.CLIENT_SECRET ||
    !process.env.REFRESH_TOKEN
  ) {
    throw new Error(
      'Setup your .environment file (or use `export`) according to the README.',
    );
  }

  // ACCESS_TOKEN expires very quickly, so we get a new one per test run from REFRESH_TOKEN
  if (!process.env.ACCESS_TOKEN) {
    const bundle = {
      authData: {
        access_token: '',
        refresh_token: process.env.REFRESH_TOKEN,
        accountType: 'personal',
      },
    };

    appTester(App.authentication.oauth2Config.refreshAccessToken, bundle)
      .then((result) => {
        result.should.have.property('access_token');
        result.should.have.property('refresh_token');
        process.env.ACCESS_TOKEN = result.access_token;
        done();
      })
      .catch(done);
  } else {
    done();
  }
};

// Below is a set of files the app can use to test different scenarios.
// To make the test suite run, add files to your account in the given folders,
// then fill in the IDs of files from your account.  The `id` is visible in the
// URL when accessing the file in the browser, for example:
//   URL: https://onedrive.live.com/?cid=697LD7B578EB1372&id=697LD7B578EB1372%21716
//   ID: 697LD7B578EB1372!716
const TEST_RESOURCES = {
  root: {
    id: '',
    name: 'sample.pdf',
    path: '/sample.pdf',
    parent: '',
  },
  nested: {
    id: '',
    name: 'test.txt',
    path: '/Documents/Testing/test.txt',
    parent: '/Documents/Testing',
  },

  folder: {
    id: '',
    name: 'Documents',
    path: '/Documents',
    parent: '',
  },
  childFolder: {
    id: '',
    name: 'Testing',
    path: '/Documents/Testing',
    parent: '/Documents',
  },
};

module.exports = {
  globalBeforeSetup,
  TEST_RESOURCES,
};
