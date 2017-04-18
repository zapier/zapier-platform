require('should');

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('basic auth app', () => {

  it('automatically has Authorize Header add', (done) => {
    // Try changing the values of username or password to see how the test method behaves
    const bundle = {
      authData: {
        username: 'user',
        password: 'passwd'
      }
    };

    appTester(App.authentication.test, bundle)
      .then((response) => {
        response.status.should.eql(200);
        response.request.headers.Authorization.should.eql('Basic dXNlcjpwYXNzd2Q=');
        done();
      })
      .catch(done);
  });

  it('fails on bad auth', (done) => {
    // Try changing the values of username or password to see how the test method behaves
    const bundle = {
      authData: {
        username: 'user',
        password: 'badpwd'
      }
    };

    appTester(App.authentication.test, bundle)
      .then(() => {
        done('Should not get here');
      })
      .catch((error) => {
        error.message.should.containEql('The username and/or password you supplied is incorrect');
        done();
      });
  });
});
