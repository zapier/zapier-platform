const fetch = require('node-fetch');
const path = require('path');
const fse = require('fs-extra');
const AdmZip = require('adm-zip');
const debug = require('debug')('zapier:example-apps');

const xdg = require('./xdg');
const { copyDir } = require('./files');
const { PACKAGE_VERSION } = require('../constants');

const REPO_ZIP_URL = `https://codeload.github.com/zapier/zapier-platform/zip/zapier-platform-cli%40${PACKAGE_VERSION}`;
const zipName = `zapier-platform-zapier-platform-cli-${PACKAGE_VERSION}`;
const folderName = `zapier-platform-cached`; // version independant

const checkCacheUpToDate = async (repoDir) => {
  const etagPath = path.join(repoDir, 'etag');
  let currentEtag;
  try {
    currentEtag = await fse.readFile(etagPath, { encoding: 'utf8' });
  } catch (err) {
    currentEtag = '';
  }
  const res = await fetch(REPO_ZIP_URL, { method: 'HEAD' });
  const latestEtag = res.headers.get('etag');

  return currentEtag === latestEtag;
};

const downloadRepo = async (destDir) => {
  const destZipPath = path.join(destDir, `${zipName}.zip`);

  const res = await fetch(REPO_ZIP_URL);
  const dest = fse.createWriteStream(destZipPath);
  res.body.pipe(dest);

  await new Promise((resolve, reject) => {
    dest.on('finish', () => {
      resolve();
    });
    dest.on('error', reject);
  });

  const zip = new AdmZip(destZipPath);
  zip.extractAllTo(destDir, true);

  // Save etag for cache validation
  // this could probably just be cli version, but this is fine too
  const etagPath = path.join(destDir, zipName, 'etag');
  fse.writeFileSync(etagPath, res.headers.get('etag'));

  fse.removeSync(destZipPath);
  fse.renameSync(path.join(destDir, zipName), path.join(destDir, folderName));

  return destZipPath;
};

const ensureRepoCached = async () => {
  const cacheDir = xdg.ensureCacheDir();
  const repoDir = path.join(cacheDir, folderName);

  if (fse.existsSync(repoDir)) {
    debug('repo exists');
    if (!(await checkCacheUpToDate(repoDir))) {
      debug('cached repo is stale, re-downloading');
      await fse.remove(repoDir);
      await downloadRepo(cacheDir);
    }
  } else {
    debug('no cached repo, downloading');
    await downloadRepo(cacheDir);
  }

  return repoDir;
};

const downloadExampleAppTo = async (exampleName, destDir) => {
  const repoDir = await ensureRepoCached();
  const cachedExampleDir = path.join(repoDir, 'example-apps', exampleName);
  await copyDir(cachedExampleDir, destDir);
};

const removeReadme = (dir) => {
  return fse.remove(path.join(dir, 'README.md'));
};

module.exports = {
  downloadExampleAppTo,
  removeReadme,
};
