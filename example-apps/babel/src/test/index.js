import should from 'should';

import zapier from 'zapier-platform-core';

import App from '../index';
const appTester = zapier.createAppTester(App);

describe('My Test', () => {

  it('should test the auth succeeds', async () => {
    const bundle = {
      authData: {
        username: 'user',
        password: 'secret'
      }
    };

    const response = await appTester(App.authentication.test, bundle);
    should(response.status).eql(200);
    response.request.headers.Authorization.should.eql('Basic dXNlcjpzZWNyZXQ=');
  });

  it('should test the auth fails', async () => {
    const bundle = {
      authData: {
        username: 'user',
        password: 'boom'
      }
    };

    try {
      const response = await appTester(App.authentication.test, bundle);
    } catch(e) {
      e.message.should.containEql('The username and/or password you supplied is incorrect');
    }
  });

});
