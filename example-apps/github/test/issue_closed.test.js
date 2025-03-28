require('dotenv').config();
const zapier = require('zapier-platform-core');
const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('issue_closed trigger', () => {
  zapier.tools.env.inject();
  
  it('should load issue samples', async () => {
    const bundle = {
      inputData: {
        repo: process.env.TEST_REPO || 'zapier/zapier-platform' // Provide a fallback
      }
    };
    
    const results = await appTester(
      App.triggers.issue_closed.operation.performList,
      bundle
    );
    
    expect(results.length).toBeGreaterThan(0);
    const issue = results[0];
    expect(issue.id).toBeDefined();
    expect(issue.title).toBeDefined();
    expect(issue.state).toEqual('closed');
  });
});