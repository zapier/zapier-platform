const { randomBytes } = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const fetch = require('node-fetch');
const FormData = require('form-data');

const makeDownloadStream = async (url) => {
  // Create a temp file to store the downloaded file
  const filename = randomBytes(16).toString('hex');
  const tmpFilePath = path.join(os.tmpdir(), filename);
  const dest = fs.createWriteStream(tmpFilePath);

  const response = await fetch(url);

  // Download the file to the temp file. When finished, open a readable stream
  // from that temp file.
  return new Promise((resolve, reject) => {
    response.body
      .pipe(dest)
      .on('close', () => {
        const stream = fs.createReadStream(tmpFilePath).on('close', () => {
          // Delete the file once the stream is read
          fs.unlinkSync(tmpFilePath);
        });
        resolve(stream);
      })
      .on('error', reject);
  });
};

// The following commented code is actually better - getting a stream directly
// from http. But this only works on core 10+. core 9.x and below have a bug
// with how we log http responses.
//
// const http = require('https'); // require('http') if your URL is not https
//
// const makeDownloadStream = (url) =>
//   new Promise((resolve, reject) => {
//     http.request(url, resolve).on('error', reject).end();
//   });

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

  return response.json;
};

module.exports = {
  key: 'uploadFile',
  noun: 'File',
  display: {
    label: 'Upload File',
    description: 'Uploads a file.',
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
