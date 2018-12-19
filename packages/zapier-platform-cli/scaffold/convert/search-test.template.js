require('should');

const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);

describe('Search - <%= key %>', () => {
  zapier.tools.env.inject();

  it('should get an array', async () => {
    const bundle = {
      authData: <%= authData %>,
<% if (inputData) { %>
      inputData: <%= inputData %>
<% } %>
    };

    const results = await appTester(App.searches['<%= key %>'].operation.perform, bundle);
    results.should.be.an.Array();
    results.length.should.be.aboveOrEqual(1);
    results[0].should.have.property('id');
  });
});
