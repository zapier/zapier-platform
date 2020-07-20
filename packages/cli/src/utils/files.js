const _ = require('lodash');
const crypto = require('crypto');
const os = require('os');
const path = require('path');

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
    fse.readFile(fixHome(fileName))
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

// Returns a promise that copies a directory.
const copyDir = (src, dst, options) => {
  const defaultFilter = (dir) => {
    const isntPackage = dir.indexOf('node_modules') === -1;
    const isntBuild = dir.indexOf('.zip') === -1;
    return isntPackage && isntBuild;
  };

  options = _.defaults(options || {}, {
    clobber: false,
    filter: defaultFilter,
    onCopy: () => {},
    onSkip: () => {},
  });

  return ensureDir(dst)
    .then(() => fse.readdir(src))
    .then((files) => {
      const promises = files.map((file) => {
        const srcItem = path.resolve(src, file);
        const dstItem = path.resolve(dst, file);
        const stat = fse.statSync(srcItem);
        const dstExists = fileExistsSync(dstItem);

        if (!options.filter(srcItem)) {
          return Promise.resolve();
        }

        if (dstExists && options.clobber) {
          fse.removeSync(dstItem);
        } else if (dstExists) {
          if (!stat.isDirectory()) {
            options.onSkip(dstItem);
            return Promise.resolve();
          }
        }

        if (stat.isDirectory()) {
          return ensureDir(dstItem).then(() =>
            copyDir(srcItem, dstItem, options)
          );
        } else {
          return copyFile(srcItem, dstItem, stat.mode).then(() => {
            options.onCopy(dstItem);
          });
        }
      });

      return Promise.all(promises);
    });
};

// Delete a directory.
const removeDir = (dir) => fse.remove(dir);

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

module.exports = {
  copyDir,
  deleteFile,
  ensureDir,
  fileExistsSync,
  isEmptyDir,
  isExistingEmptyDir,
  readFile,
  readFileStr,
  removeDir,
  validateFileExists,
  writeFile,
  copyFile,
  makeTempDir,
};
