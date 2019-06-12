require('should');

const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);

describe('Trigger - <%= key %>', () => {
  zapier.tools.env.inject();

  it('should get an array', async () => {
    const bundle = {
      authData: <%= authData %>,
<% if (inputData) { %>
      inputData: <%= inputData %>
<% } %>
    };

    const results = await appTester(App.triggers['<%= key %>'].operation.perform, bundle);
    results.should.be.an.Array();
  });
});
