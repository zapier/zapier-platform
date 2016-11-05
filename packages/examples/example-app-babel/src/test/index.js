import should from 'should';

import zapier from 'zapier-platform-core';

const appTester = zapier.createAppTester(require('../index'));

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
    const response = await appTester('authentication.test');
    should(response.status).eql(200);
  }));

});
