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

// Some files were ignored during the original build step
// This includes anything declared in .gitignore, the file itsefl or blacklisted paths
const deleteIgnorableFiles = async (targetFiles) => {
  const cwd = process.cwd();

  // removes the cwd from the full path
  const targetFileRelative = targetFiles.map((file) =>
    path.relative(cwd, file)
  );

  const deletableFiles = respectGitIgnore('.', targetFileRelative).map((file) =>
    path.join(cwd, file)
  );
  const keepFiles = targetFiles.filter(
    (file) =>
      !deletableFiles.includes(file) ||
      file === '.gitignore' ||
      isBlacklisted(file)
  );

  for (const targetFile of targetFiles) {
    const stat = fs.statSync(targetFile);
    if (stat.isDirectory() && !keepFiles.includes(targetFile)) {
      await fs.promises.rm(targetFile, { recursive: true, force: true });
    } else if (!keepFiles.includes(targetFile)) {
      await fs.promises.unlink(targetFile);
    }
  }
};

module.exports = {
  deleteIgnorableFiles,
};
