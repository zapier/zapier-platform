/* globals describe, expect, test */

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('uploadFile', () => {
  test('upload file', async () => {
    const bundle = {
      inputData: {
        filename: 'sample.pdf',

        // in production, this will be an hydration URL to the selected file's data
        file:
          'https://cdn.zapier.com/storage/files/f6679cf77afeaf6b8426de8d7b9642fc.pdf'
      }
    };

    const result = await appTester(
      App.creates.uploadFile.operation.perform,
      bundle
    );
    expect(result.filename).toBe('sample.pdf');
    expect(result.file.sha1).toBe('3cf58b42a0fb1b7cc58de8110096841ece967530');
  });
});
