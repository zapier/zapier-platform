'use strict';
const should = require('should');

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);

//This is an automated test for the Repo Trigger which populates the repo dropdown.
//It will run every time the `zapier test` command is executed.
describe('repo trigger', () => {
  zapier.tools.env.inject();

  // Make sure there's an open issue to fetch here!
  it('should get a repo', (done) => {
    const bundle = {
      authData: {
        username: process.env.TEST_USERNAME,
        password: process.env.TEST_PASSWORD
      },
      inputData: {
        filter: 'all'
      }
    };
    appTester(App.triggers.repo.operation.perform, bundle)
      .then((response) => {
        response.should.be.an.instanceOf(Array);
        done();
      })
      .catch(done);
  });
});
