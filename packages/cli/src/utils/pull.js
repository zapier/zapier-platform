// prob put this in files
const fs = require('fs');
const path = require('path');

const constants = require('../constants');
const { respectGitIgnore } = require('./build');

const isBlacklisted = (filePath) => {
  return constants.BLACKLISTED_PATHS.find((excluded) => {
    return filePath.search(excluded) === 0;
  });
};

const getAbsolutePaths = (dir, files) => {
  return files.map((file) => path.join(dir, file));
};
// Some files were ignored during the original build step
// This includes anything declared in .gitignore, the file itsefl or blacklisted paths
const deleteUnignoredFiles = async (dir, targetFiles) => {
  const deletableFiles = getAbsolutePaths(
    dir,
    respectGitIgnore(dir, targetFiles)
  );

  const absTargetFiles = getAbsolutePaths(dir, targetFiles);
  const keepFiles = absTargetFiles.filter(
    (file) =>
      !deletableFiles.includes(file) ||
      file === '.gitignore' ||
      isBlacklisted(file)
  );

  for (const targetFile of absTargetFiles) {
    try {
      const stat = fs.statSync(targetFile);
      if (stat.isDirectory() && !keepFiles.includes(targetFile)) {
        await fs.promises.rm(targetFile, { recursive: true, force: true });
      } else if (!keepFiles.includes(targetFile)) {
        await fs.promises.unlink(targetFile);
      }
    } catch (e) {
      // can't open symlinked files
    }
  }
};

module.exports = {
  deleteUnignoredFiles,
};
