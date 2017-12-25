require('should');

const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);

describe('Searches - <%= LABEL %>', () => {
  zapier.tools.env.inject();

  it('should get an object', (done) => {
    const bundle = {
      authData: <%= AUTH_DATA %>,
<% if (INPUT_DATA) { %>
      inputData: <%= INPUT_DATA %>
<% } %>
    };

    appTester(App.searches['<%= KEY %>'].operation.perform, bundle)
      .then((results) => {
        results.should.be.an.Array();
        results.length.should.be.aboveOrEqual(1);
        results[0].should.have.property('id');
        done();
      })
      .catch(done);
  });

});
