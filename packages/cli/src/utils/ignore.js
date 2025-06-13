const fs = require('node:fs');
const path = require('node:path');

const colors = require('colors/safe');
const gitIgnore = require('parse-gitignore');
const ignore = require('ignore');

const { IS_TESTING } = require('../constants');

const BLOCKLISTED_PREFIXES = [
  '.DS_Store',
  `.git${path.sep}`,
  `build${path.sep}`,
];
const BLOCKLISTED_SUFFIXES = ['.gitkeep', '.env', '.environment', '.zip'];

// Tells if we should exclude a file from build.zip or source.zip
const isBlocklisted = (relPath) => {
  // Will be excluded from build.zip and source.zip
  for (const prefix of BLOCKLISTED_PREFIXES) {
    if (relPath.startsWith(prefix)) {
      return true;
    }
  }
  for (const suffix of BLOCKLISTED_SUFFIXES) {
    if (relPath.endsWith(suffix)) {
      return true;
    }
  }
  return false;
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
