const fetch = require('node-fetch');
const path = require('path');
const tmp = require('tmp');
const fse = require('fs-extra');
const AdmZip = require('adm-zip');

const { writeFile, copyDir } = require('./files');

const MONOREPO_EXAMPLES = new Set([
  'babel',
  'basic-auth',
  'create',
  'custom-auth',
  'digest-auth',
  'dynamic-dropdown',
  'files',
  'middleware',
  'minimal',
  'oauth2',
  'resource',
  'rest-hooks',
  'search',
  'search-or-create',
  'session-auth',
  'trigger',
  'typescript'
]);

const atob = str => {
  return new Buffer(str, 'base64').toString('binary');
};

const githubRequest = async url => {
  const rawRes = await fetch(url, {
    headers: {
      Authorization: process.env.GITHUB_API_TOKEN
        ? `token ${process.env.GITHUB_API_TOKEN}`
        : undefined
    }
  });
  return rawRes.json();
};

const downloadSampleAppFromGithub = async (key, destDir) => {
  const tempDir = tmp.tmpNameSync();

  const exampleApps = await githubRequest(
    'https://api.github.com/repos/zapier/zapier-platform/contents/packages/examples'
  );
  const exampleApp = exampleApps.find(app => app.name === `example-app-${key}`);
  const exampleFiles = await githubRequest(`${exampleApp.git_url}?recursive=1`);

  await Promise.all(
    exampleFiles.tree.filter(file => file.type === 'blob').map(async file => {
      const fileInfo = await githubRequest(file.url);
      if (fileInfo.encoding !== 'base64') {
        // not sure if/when this happens, but it doesn't hurt to be careful
        console.log(
          `!! Failed to download file ${
            file.path
          }, please file an issue at https://github.com/zapier/zapier-platform`
        );
        return;
      }
      const fileContent = atob(fileInfo.content);
      // TODO: windows compatibility - github paths all have / in the path. need to replace with path.sep

      // this ensures the nested structure is created
      return fse.outputFile(path.resolve(tempDir, file.path), fileContent);
    })
  );
  await copyDir(tempDir, destDir);
  return fse.remove(tempDir);
};

const downloadAndUnzipTo = async (key, destDir) => {
  const fragment = `zapier-platform-example-app-${key}`;
  const folderInZip = `${fragment}-master`;
  const url = `https://codeload.github.com/zapier/${fragment}/zip/master`;

  const tempDir = tmp.tmpNameSync();
  const tempFilePath = path.resolve(tempDir, 'zapier-template.zip');

  await fse.ensureDir(tempDir);
  const res = await fetch(url);
  const buffer = await res.buffer();
  await writeFile(tempFilePath, buffer);

  const zip = new AdmZip(tempFilePath);
  zip.extractAllTo(tempDir, true);
  const currPath = await path.join(tempDir, folderInZip);

  await copyDir(currPath, destDir);
  return fse.remove(tempDir);
};

const downloadSampleAppTo = (key, destDir) => {
  const downloadMethod = MONOREPO_EXAMPLES.has(key)
    ? downloadSampleAppFromGithub
    : downloadAndUnzipTo;
  return downloadMethod(key, destDir);
};

const removeReadme = dir => {
  return fse.remove(path.join(dir, 'README.md'));
};

module.exports = {
  downloadSampleAppTo,
  removeReadme
};
