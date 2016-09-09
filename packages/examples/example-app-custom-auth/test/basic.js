require('should');

const zapier = require('zapier-platform-core');

const appTester = zapier.createAppTester(require('../index'));

describe('custom auth app', () => {

  it('has auth details added to every request', (done) => {
    // Try changing the values of username or password to see how the test method behaves
    const bundle = {
      authData: {
        apiKey: 'my_key'
      }
    };

    appTester('authentication.test', bundle)
      .then((response) => {
        response.status.should.eql(200);
        response.request.url.should.containEql('?api_key=my_key');
        done();
      })
      .catch(done);
  });
});
