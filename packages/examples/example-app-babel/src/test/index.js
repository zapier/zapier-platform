import should from 'should';

import zapier from 'zapier-platform-core';

const appTester = zapier.createAppTester(require('../index'));

describe('My Test', () => {

  it('should test the auth', async (done) => {
    const response = await appTester('authentication.test');
    should(response.status).eql(200);
    done();
  });

});
