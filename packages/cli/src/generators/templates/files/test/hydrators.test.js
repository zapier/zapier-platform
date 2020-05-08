/* globals describe, expect, test */

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);
zapier.tools.env.inject();

describe('downloadFile', () => {
  test('download file', async () => {
    if (!process.env.ZAPIER_DEPLOY_KEY) {
      console.warn('skipped as ZAPIER_DEPLOY_KEY is not defined');
      return;
    }

    const bundle = {
      inputData: {
        url: 'https://httpbin.zapier-tooling.com/xml',
      },
    };

    const url = await appTester(App.hydrators.downloadFile, bundle);
    expect(url).toContain(
      'https://zapier-dev-files.s3.amazonaws.com/cli-platform/'
    );
  });
});
