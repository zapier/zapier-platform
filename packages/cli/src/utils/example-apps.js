const fetch = require('node-fetch');
const path = require('path');
const fse = require('fs-extra');
const AdmZip = require('adm-zip');

const xdg = require('./xdg');
const { copyDir } = require('./files');

const REPO_ZIP_URL =
  'https://codeload.github.com/zapier/zapier-platform/zip/master';

const checkCacheUpToDate = async repoDir => {
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

const downloadRepo = async destDir => {
  const destZipPath = path.join(destDir, 'zapier-platform-master.zip');

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
  const etagPath = path.join(destDir, 'zapier-platform-master', 'etag');
  fse.writeFileSync(etagPath, res.headers.get('etag'));

  fse.removeSync(destZipPath);

  return destZipPath;
};

const ensureRepoCached = async () => {
  const cacheDir = xdg.ensureCacheDir();
  const repoDir = path.join(cacheDir, 'zapier-platform-master');

  if (fse.existsSync(repoDir)) {
    if (!await checkCacheUpToDate(repoDir)) {
      await fse.remove(repoDir);
      await downloadRepo(cacheDir);
    }
  } else {
    await downloadRepo(cacheDir);
  }

  return repoDir;
};

const downloadExampleAppTo = async (exampleName, destDir) => {
  const repoDir = await ensureRepoCached();
  const cachedExampleDir = path.join(repoDir, 'example-apps', exampleName);
  await copyDir(cachedExampleDir, destDir);
};

const removeReadme = dir => {
  return fse.remove(path.join(dir, 'README.md'));
};

module.exports = {
  downloadExampleAppTo,
  removeReadme
};
