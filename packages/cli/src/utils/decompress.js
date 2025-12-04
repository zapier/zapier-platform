// This is a modernized version of the decompress package.
// Instead of letting decompress import many of its plugins, such as
// decompress-unzip, decompress-tar, etc, we extracted only the unzip part,
// so we only depend on decompress-unzip.
// Original source: https://github.com/kevva/decompress/blob/84a8c104/index.js

const fsP = require('node:fs/promises');
const path = require('node:path');

const decompressUnzip = require('decompress-unzip');

const safeMakeDir = async (dir, realOutputPath) => {
  let resolvedPathToCheck;

  try {
    resolvedPathToCheck = await fsP.realpath(dir);
  } catch (error) {
    const parent = path.dirname(dir);
    resolvedPathToCheck = await safeMakeDir(parent, realOutputPath);
  }

  // Security check for zip slip vulnerability
  if (!resolvedPathToCheck.startsWith(realOutputPath)) {
    throw new Error('Refusing to create a directory outside the output path.');
  }

  await fsP.mkdir(dir, { recursive: true });
  return await fsP.realpath(dir);
};

const preventWritingThroughSymlink = async (destination, realOutputPath) => {
  let symlinkPointsTo;
  try {
    symlinkPointsTo = await fsP.readlink(destination);
  } catch (error) {
    // Either no file exists, or it's not a symlink. In either case, this is
    // not an escape we need to worry about in this phase.
  }

  if (symlinkPointsTo) {
    throw new Error('Refusing to write into a symlink');
  }
};

const extractItem = async (item, realOutputPath) => {
  const dest = path.join(realOutputPath, item.path);
  const mode = item.mode & ~process.umask();
  const now = new Date();

  if (item.type === 'directory') {
    await safeMakeDir(dest, realOutputPath);
    await fsP.utimes(dest, now, item.mtime);
    return item;
  }

  await safeMakeDir(path.dirname(dest), realOutputPath);

  if (item.type === 'file') {
    await preventWritingThroughSymlink(dest, realOutputPath);
  }

  const realDestinationDir = await fsP.realpath(path.dirname(dest));
  if (!realDestinationDir.startsWith(realOutputPath)) {
    throw new Error(
      'Refusing to write outside output directory: ' + realDestinationDir,
    );
  }

  if (item.type === 'symlink') {
    const absTargetPath = path.resolve(realDestinationDir, item.linkname);
    const relTargetPath = path.relative(realOutputPath, absTargetPath);
    if (relTargetPath.startsWith('..')) {
      // Security check to block symlinks pointing outside output directory,
      // like evil_link -> ../../../../../etc/passwd
      throw new Error(
        'Reusing to create symlink pointing to outside output directory: ' +
          item.linkname,
      );
    }

    // Windows will have issues with this line, since creating a symlink on
    // Windows requires Administrator privilege. But that's fine because we
    // only run decompress on Windows in CI tests, which do run with
    // Administrator privilege.
    await fsP.symlink(item.linkname, dest);
  } else {
    await fsP.writeFile(dest, item.data, { mode });
    await fsP.utimes(dest, now, item.mtime);
  }

  return item;
};

const decompress = async (input, output) => {
  if (typeof input !== 'string') {
    throw new TypeError('input must be a file path (string)');
  }

  if (typeof output !== 'string') {
    throw new TypeError('output must be a directory path (string)');
  }

  let fd, buf;
  try {
    fd = await fsP.open(input);
    buf = await fd.readFile();
  } finally {
    await fd?.close();
  }

  // Ensure output directory exists
  await fsP.mkdir(output, { recursive: true });
  const realOutputPath = await fsP.realpath(output);

  const items = await decompressUnzip()(buf);
  return await Promise.all(
    items.map(async (x) => {
      return await extractItem(x, realOutputPath);
    }),
  );
};

module.exports = decompress;
