const fs = require('node:fs');
const path = require('node:path');

const colors = require('colors/safe');
const gitIgnore = require('parse-gitignore');
const ignore = require('ignore');

const { BLOCKLISTED_PATHS, IS_TESTING } = require('../constants');

const isBlocklisted = (filePath) => {
  return (
    BLOCKLISTED_PATHS.find((excluded) => filePath.startsWith(excluded)) != null
  );
};

// Exclude file paths in .gitignore
const respectGitIgnore = (dir, paths) => {
  const gitIgnorePath = path.join(dir, '.gitignore');
  if (!fs.existsSync(gitIgnorePath)) {
    if (!IS_TESTING) {
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
