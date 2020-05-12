/* globals describe, expect, test */

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);
zapier.tools.env.inject();

const CORE_VERSION = zapier.version.split('.').map((s) => parseInt(s));

const FILE_URL =
  'https://cdn.zapier.com/storage/files/f6679cf77afeaf6b8426de8d7b9642fc.pdf';

// This is what you get when doing `curl <FILE_URL> | sha1sum`
const EXPECTED_SHA1 = '3cf58b42a0fb1b7cc58de8110096841ece967530';

describe('uploadFile', () => {
  test('upload file v10', async () => {
    if (CORE_VERSION[0] < 10) {
      console.warn(
        `skipped because this only works on core v10+ and you're on ${zapier.version}`
      );
      return;
    }

    const bundle = {
      inputData: {
        filename: 'sample.pdf',

        // in production, this will be an hydration URL to the selected file's data
        file: FILE_URL,
      },
    };

    const result = await appTester(
      App.creates.uploadFile_v10.operation.perform,
      bundle
    );
    expect(result.filename).toBe('sample.pdf');
    expect(result.file.sha1).toBe(EXPECTED_SHA1);
  });

  test('upload file v9', async () => {
    const bundle = {
      inputData: {
        filename: 'sample.pdf',

        // in production, this will be an hydration URL to the selected file's data
        file: FILE_URL,
      },
    };

    const result = await appTester(
      App.creates.uploadFile_v9.operation.perform,
      bundle
    );
    expect(result.filename).toBe('sample.pdf');
    expect(result.file.sha1).toBe(EXPECTED_SHA1);
  });
});
