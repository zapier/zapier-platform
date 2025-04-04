const fs = require('fs');
const colors = require('colors/safe');
const ignore = require('ignore');
const gitIgnore = require('parse-gitignore');
const path = require('path');

const constants = require('../constants');
const isBlocklisted = (filePath) => {
  return constants.BLOCKLISTED_PATHS.find((excluded) => {
    return filePath.search(excluded) === 0;
  });
};
// Exclude file paths in .gitignore
const respectGitIgnore = (dir, paths) => {
  const gitIgnorePath = path.join(dir, '.gitignore');
  if (!fs.existsSync(gitIgnorePath)) {
    if (!constants.IS_TESTING) {
      console.warn(
        `\n\n\t${colors.yellow(
          '!! Warning !!',
        )}\n\nThere is no .gitignore, so we are including all files. This might make the source.zip file too large\n`,
      );
    }
    return paths;
  }
  const gitIgnoredPaths = gitIgnore(gitIgnorePath);
  const validGitIgnorePaths = gitIgnoredPaths.filter(ignore.isPathValid);
  const gitFilter = ignore().add(validGitIgnorePaths);

  return gitFilter.filter(paths);
};

module.exports = {
  isBlocklisted,
  respectGitIgnore,
};
