const AdmZip = require('adm-zip');
const { existsSync, readFileSync } = require('fs');
const { resolve } = require('path');

const { BUILD_PATH, SOURCE_PATH } = require('../constants');
const { getLinkedApp, callAPI } = require('./api');
const { startSpinner, endSpinner } = require('./display');

const upload = ({
  zipPath = BUILD_PATH,
  sourceZipPath = SOURCE_PATH,
  appDir = '.'
} = {}) => {
  const fullZipPath = resolve(appDir, zipPath);
  const fullSourceZipPath = resolve(appDir, sourceZipPath);
  const isMissingZip = !existsSync(fullZipPath);

  if (isMissingZip) {
    throw new Error(
      'Missing a built app. Try running `zapier build` first.\nOr you could run `zapier push`, which will build and upload in one command.'
    );
  }

  return getLinkedApp(appDir)
    .then(app => {
      const zip = new AdmZip(fullZipPath);
      const definitionJson = zip.readAsText('definition.json');
      if (!definitionJson) {
        throw new Error('definition.json in the zip was missing!');
      }
      const definition = JSON.parse(definitionJson);

      const binaryZip = readFileSync(fullZipPath);
      const buffer = Buffer.from(binaryZip).toString('base64');

      const binarySourceZip = readFileSync(fullSourceZipPath);
      const sourceBuffer = Buffer.from(binarySourceZip).toString('base64');

      startSpinner(`Uploading version ${definition.version}`);
      return callAPI(`/apps/${app.id}/versions/${definition.version}`, {
        method: 'PUT',
        body: {
          zip_file: buffer,
          source_zip_file: sourceBuffer
        }
      });
    })
    .then(() => {
      endSpinner();
    });
};

module.exports = {
  upload
};
