const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const _ = require('lodash');
const colors = require('colors/safe');
const fse = require('fs-extra');

const fixHome = (dir) => {
  const home = process.env.HOME || process.env.USERPROFILE;
  return dir.replace(/^~/, home);
};

const fileExistsSync = (fileName) => {
  try {
    fse.accessSync(fileName);
    return true;
  } catch (e) {
    return false;
  }
};

const validateFileExists = (fileName, errMsg) => {
  return fse.access(fileName).catch(() => {
    let msg = `: File ${fileName} not found.`;
    if (errMsg) {
      msg += ` ${errMsg}`;
    }
    throw new Error(msg);
  });
};

// Returns a promise that reads a file and returns a buffer.
const readFile = (fileName, errMsg) => {
  return validateFileExists(fileName, errMsg).then(() =>
    fse.readFile(fixHome(fileName)),
  );
};

const readFileStr = async (fileName, errMsg) => {
  const buf = await readFile(fileName, errMsg);
  return buf.toString();
};

// Returns a promise that writes a file.
const writeFile = (fileName, data) => {
  if (!data) {
    throw new Error('No data provided');
  }
  return fse.writeFile(fixHome(fileName), data);
};

// deletes a file, eats the error
const deleteFile = (path) => {
  try {
    fse.unlinkSync(path);
    return true;
  } catch (err) {
    return false;
  }
};

// Returns a promise that ensures a directory exists.
const ensureDir = (dir) => fse.ensureDir(dir);

const copyFile = (src, dest, mode) => {
  return new Promise((resolve, reject) => {
    const readStream = fse.createReadStream(src);
    const writeStream = fse.createWriteStream(dest, { mode });

    readStream.on('error', reject);
    writeStream.on('error', reject);

    writeStream.on('open', function () {
      readStream.pipe(writeStream);
    });

    writeStream.once('finish', (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
};

/*
  Returns a promise that copies a directory recursively.

  Options:

  - clobber: Overwrite existing files? Default is false.
  - filter:
      A function that returns true if the file should be copied. By default, it
      ignores node_modules and .zip files.
  - onCopy:
      A function called when a file is copied. Takes the destination path as an
      argument.
  - onSkip:
      A function called when a file is skipped. Takes the destination path as an
      argument.
  - onDirExists:
      A function called when a directory exists. Takes the destination path as
      an argument. Returns true to carry on copying. Returns false to skip.
*/
const copyDir = async (src, dst, options) => {
  const defaultFilter = (srcPath) => {
    const isntPackage = !srcPath.includes('node_modules');
    const isntBuild = !srcPath.endsWith('.zip');
    return isntPackage && isntBuild;
  };

  options = {
    clobber: false,
    filter: defaultFilter,
    onCopy: () => {},
    onSkip: () => {},
    onDirExists: () => true,
    ...options,
  };

  if (!options.filter) {
    options.filter = defaultFilter;
  }

  await ensureDir(dst);
  const files = await fse.readdirSync(src);

  const promises = files.map(async (file) => {
    const srcItem = path.resolve(src, file);

    let srcStat;
    try {
      srcStat = fse.statSync(srcItem);
    } catch (err) {
      // If the file is a symlink and the target doesn't exist, skip it.
      if (fse.lstatSync(srcItem).isSymbolicLink()) {
        console.warn(
          colors.yellow(
            `\n! Warning: symlink "${srcItem}" points to a non-existent file. Skipping!\n`,
          ),
        );
        return null;
      }

      // otherwise, rethrow the error
      throw err;
    }

    const srcIsFile = srcStat.isFile();

    const dstItem = path.resolve(dst, file);
    const dstExists = fileExistsSync(dstItem);
    if (!options.filter(srcItem)) {
      return null;
    }

    if (srcIsFile) {
      if (dstExists) {
        if (!options.clobber) {
          options.onSkip(dstItem);
          return null;
        }
        fse.removeSync(dstItem);
      }

      await copyFile(srcItem, dstItem, srcStat.mode);
      options.onCopy(dstItem);
    } else {
      let shouldCopyRecursively = true;
      if (dstExists) {
        shouldCopyRecursively = options.onDirExists(dstItem);
      }
      if (shouldCopyRecursively) {
        await copyDir(srcItem, dstItem, options);
      }
    }
  });

  return Promise.all(promises);
};

// Delete a directory.
const removeDir = (dir) => fse.remove(dir);
const removeDirSync = (dir) => fse.removeSync(dir);

// Returns true if directory is empty, else false.
// Rejects if directory does not exist.
const isEmptyDir = (dir) => fse.readdir(dir).then((items) => _.isEmpty(items));
const isExistingEmptyDir = async (dir) =>
  fse.existsSync(dir) && !(await isEmptyDir(dir));

const makeTempDir = () => {
  let workdir;
  const tmpBaseDir = os.tmpdir();
  while (!workdir || fse.existsSync(workdir)) {
    workdir = path.join(tmpBaseDir, crypto.randomBytes(20).toString('hex'));
  }
  fse.mkdirSync(workdir);
  return workdir;
};

// Iterates files and symlinks in a directory recursively.
// Yields fs.Dirent objects.
function* walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subDir = path.join(entry.parentPath, entry.name);
      yield* walkDir(subDir);
    } else if (entry.isFile() || entry.isSymbolicLink()) {
      yield entry;
    }
  }
}

// Iterates files and symlinks in a directory recursively, up to a specified
// number of levels deep (maxLevels). The minimum value for maxLevels is 1.
// Yields fs.Dirent objects.
function* walkDirLimitedLevels(dir, maxLevels, currentLevel = 1) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (currentLevel < maxLevels) {
        const subDir = path.join(entry.parentPath, entry.name);
        yield* walkDirLimitedLevels(subDir, maxLevels, currentLevel + 1);
      }
    } else if (entry.isFile() || entry.isSymbolicLink()) {
      yield entry;
    }
  }
}

module.exports = {
  copyDir,
  copyFile,
  deleteFile,
  ensureDir,
  fileExistsSync,
  isEmptyDir,
  isExistingEmptyDir,
  makeTempDir,
  readFile,
  readFileStr,
  removeDir,
  removeDirSync,
  validateFileExists,
  walkDir,
  walkDirLimitedLevels,
  writeFile,
};
