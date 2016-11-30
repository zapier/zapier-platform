import should from 'should';

import zapier from 'zapier-platform-core';

const App = require('../index');
const appTester = zapier.createAppTester(App);

const mochaAsync = (fn) => {
  return async (done) => {
    try {
      await fn();
      done();
    } catch (err) {
      done(err);
    }
  };
};

describe('My Test', () => {

  it('should test the auth', mochaAsync(async () => {
    const response = await appTester(App.authentication.test);
    should(response.status).eql(200);
  }));

});
