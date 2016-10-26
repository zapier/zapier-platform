const fetch = require('node-fetch');
const path = require('path');
const tmp = require('tmp');
const {promisifyAll} = require('./promisify');
const fse = promisifyAll(require('fs-extra'));
const AdmZip = require('adm-zip');

const {writeFile, copyDir} = require('./files');

const downloadAndUnzipTo = (key, destDir) => {
  const fragment = `zapier-platform-example-app-${key}`;
  const folderInZip = `${fragment}-master`;
  const url = `https://codeload.github.com/zapier/${fragment}/zip/master`;

  const tempDir = tmp.tmpNameSync();
  const tempFilePath = path.resolve(tempDir, 'zapier-template.zip');

  return fse.ensureDirAsync(tempDir)
    .then(() => fetch(url))
    .then((res) => res.buffer())
    .then((buffer) => writeFile(tempFilePath, buffer))
    .then(() => {
      const zip = new AdmZip(tempFilePath);
      zip.extractAllTo(tempDir, true);
      return path.join(tempDir, folderInZip);
    })
    .then((currPath) => copyDir(currPath, destDir))
    .then(() => fse.removeAsync(tempDir));
};

const removeReadme = (dir) => {
  return fse.removeAsync(path.join(dir, 'README.md'));
};

module.exports = {
  downloadAndUnzipTo,
  removeReadme
};
