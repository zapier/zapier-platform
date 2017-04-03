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
    const bundle = {
      authData: {
        username: 'user',
        password: 'passwd'
      }
    };

    const response = await appTester(App.authentication.test, bundle);
    should(response.status).eql(200);
    response.request.headers.Authorization.should.eql('Basic dXNlcjpwYXNzd2Q=');
  }));

});
