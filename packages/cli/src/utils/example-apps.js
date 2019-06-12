const fetch = require('node-fetch');
const path = require('path');
const tmp = require('tmp');
const fse = require('fs-extra');

const { copyDir } = require('./files');

const monorepo = 'zapier/zapier-platform'; // would be cool to have this shared by all the packages?

const atob = str => {
  return new Buffer(str, 'base64').toString('binary');
};

const githubRequest = async url => {
  const rawRes = await fetch(url, {
    headers: {
      // users shouldn't need this, but if they're scaffolding a lot in a short time, they may get rate-limited
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
    `https://api.github.com/repos/${monorepo}/contents/example-apps`
  );
  const exampleApp = exampleApps.find(app => app.name === key);
  const exampleFiles = await githubRequest(`${exampleApp.git_url}?recursive=1`);

  await Promise.all(
    exampleFiles.tree.filter(file => file.type === 'blob').map(async file => {
      const fileInfo = await githubRequest(file.url);
      if (fileInfo.encoding !== 'base64') {
        // not sure if/when this happens, but it doesn't hurt to be careful
        console.log(
          `!! Failed to download file ${
            file.path
          }, please file an issue at https://github.com/${monorepo}`
        );
      }
      const fileContent = atob(fileInfo.content);

      // windows compatibility - github paths use "/", which should instead be platform agnostic
      // outputFile below might be smart enough to handle that, but I'm not sure
      const filePath = file.path.split('/').join(path.sep);

      // outputFile ensures the nested structure is created
      await fse.outputFile(path.resolve(tempDir, filePath), fileContent);
    })
  );
  await copyDir(tempDir, destDir);
  return fse.remove(tempDir);
};

const downloadSampleAppTo = (key, destDir) => {
  return downloadSampleAppFromGithub(key, destDir);
};

const removeReadme = dir => {
  return fse.remove(path.join(dir, 'README.md'));
};

module.exports = {
  downloadSampleAppTo,
  removeReadme
};
