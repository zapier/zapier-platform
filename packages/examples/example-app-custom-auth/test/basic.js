require('should');

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('custom auth app', () => {

  it('has auth details added to every request', (done) => {
    // Try changing the values of username or password to see how the test method behaves
    const bundle = {
      authData: {
        apiKey: 'secret'
      }
    };

    appTester(App.authentication.test, bundle)
      .then((response) => {
        response.status.should.eql(200);
        response.request.url.should.containEql('?api_key=secret');
        done();
      })
      .catch(done);
  });
});
