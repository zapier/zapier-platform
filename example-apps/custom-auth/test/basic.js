require('should');

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('App.authentication.test', () => {

  it('passes authentication and returns json', (done) => {

    const bundle = {
      authData: {
        apiKey: 'secret'
      }
    };

    appTester(App.authentication.test, bundle)
      .then((json_response) => {
        json_response.should.have.property('username')
        done();
      })
      .catch(done);

  });

});
