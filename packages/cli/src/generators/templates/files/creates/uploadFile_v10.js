const http = require('https'); // require('http') if your URL is not https

const FormData = require('form-data');

// Getting a stream directly from http. This only works on core 10+. For core
// 9.x compatible code, see uploadFile_v9.js.
const makeDownloadStream = (url) =>
  new Promise((resolve, reject) => {
    http.request(url, resolve).on('error', reject).end();
  });

const perform = async (z, bundle) => {
  const form = new FormData();

  form.append('filename', bundle.inputData.filename);

  // bundle.inputData.file will in fact be an URL where the file data can be
  // downloaded from which we do via a stream
  const stream = await makeDownloadStream(bundle.inputData.file, z);
  form.append('file', stream);

  const response = await z.request({
    url: 'https://auth-json-server.zapier-staging.com/upload',
    method: 'POST',
    body: form,
    headers: {
      // DO NOT do auth like this! We do this here because this is a file
      // uploading example so the auth is not the point.
      'x-api-key': 'secret',
    },
  });

  return response.data;
};

module.exports = {
  key: 'uploadFile_v10',
  noun: 'File',
  display: {
    label: 'Upload File v10',
    description: 'Uploads a file. Only works on zapier-platform-core v10+.',
  },
  operation: {
    inputFields: [
      { key: 'filename', required: true, type: 'string', label: 'Filename' },
      { key: 'file', required: true, type: 'file', label: 'File' },
    ],
    perform,
    sample: {
      id: 1,
      filename: 'example.pdf',
      file: 'SAMPLE FILE',
    },
  },
};
