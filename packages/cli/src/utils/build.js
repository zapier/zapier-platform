const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  constants: { Z_BEST_COMPRESSION },
} = require('node:zlib');

const _ = require('lodash');
const archiver = require('archiver');
const colors = require('colors/safe');
const esbuild = require('esbuild');
const fse = require('fs-extra');
const { createUpdateNotifier } = require('./esm-wrapper');
const decompress = require('decompress');

const {
  BUILD_DIR,
  BUILD_PATH,
  PLATFORM_PACKAGE,
  SOURCE_PATH,
  UPDATE_NOTIFICATION_INTERVAL,
} = require('../constants');
const { copyDir, walkDir, walkDirLimitedLevels } = require('./files');
const { iterfilter, itermap } = require('./itertools');

const {
  endSpinner,
  flattenCheckResult,
  prettyJSONstringify,
  startSpinner,
} = require('./display');

const {
  getLinkedAppConfig,
  getWritableApp,
  upload: _uploadFunc,
  validateApp,
} = require('./api');

const { copyZapierWrapper, deleteZapierWrapper } = require('./zapierwrapper');

const checkMissingAppInfo = require('./check-missing-app-info');

const { findCorePackageDir, isWindows, runCommand } = require('./misc');
const { isBlocklisted, respectGitIgnore } = require('./ignore');
const { localAppCommand } = require('./local');
const { throwForInvalidVersion } = require('./version');

const debug = require('debug')('zapier:build');

// const stripPath = (cwd, filePath) => filePath.split(cwd).pop();

// Given entry points in a directory, return an array of file paths that are
// required for the build. The returned paths are relative to workingDir.
const findRequiredFiles = async (workingDir, entryPoints) => {
  const appPackageJson = require(path.join(workingDir, 'package.json'));
  const isESM = appPackageJson.type === 'module';
  const format = isESM ? 'esm' : 'cjs';

  const result = await esbuild.build({
    entryPoints,
    outdir: './build',
    bundle: true,
    platform: 'node',
    metafile: true,
    logLevel: 'warning',
    logOverride: {
      'require-resolve-not-external': 'silent',
    },
    external: ['../test/userapp'],
    format,
    // Setting conditions to an empty array to exclude 'module' condition,
    // which Node.js doesn't use. https://esbuild.github.io/api/#conditions
    conditions: [],
    write: false, // no need to write outfile
    absWorkingDir: workingDir,
    tsconfigRaw: '{}',
    loader: {
      '.node': 'file',
    },
  });

  let relPaths = Object.keys(result.metafile.inputs);
  if (path.sep === '\\') {
    // The paths in result.metafile.inputs use forward slashes even on Windows,
    // path.normalize() will convert them to backslashes.
    relPaths = relPaths.map((x) => path.normalize(x));
  }
  return relPaths;
};

// From a file path relative to workingDir, traverse up the directory tree until
// it finds a directory that looks like a package directory, which either
// contains a package.json file or whose path matches a pattern like
// 'node_modules/(@scope/)package-name'.
// Returns null if no package directory is found.
const getPackageDir = (workingDir, relPath) => {
  const nm = `node_modules${path.sep}`;
  let i = relPath.lastIndexOf(nm);
  if (i < 0) {
    let dir = path.dirname(relPath);
    for (let j = 0; j < 100; j++) {
      const packageJsonPath = path.resolve(workingDir, dir, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        return dir;
      }
      const nextDir = path.dirname(dir);
      if (nextDir === dir) {
        break;
      }
      dir = nextDir;
    }
    return null;
  }

  i += nm.length;
  if (relPath[i] === '@') {
    // For scoped package, e.g. node_modules/@zapier/package-name
    const j = relPath.indexOf(path.sep, i + 1);
    if (j < 0) {
      return null;
    }
    i = j + 1; // skip the next path.sep
  }
  const j = relPath.indexOf(path.sep, i);
  if (j < 0) {
    return null;
  }
  return relPath.substring(0, j);
};

function expandRequiredFiles(workingDir, relPaths) {
  const expandedPaths = new Set(relPaths);
  for (const relPath of relPaths) {
    const packageDir = getPackageDir(workingDir, relPath);
    if (packageDir) {
      expandedPaths.add(path.join(packageDir, 'package.json'));
    }
  }
  return expandedPaths;
}

// Yields files and symlinks (as fs.Direnv objects) from a directory
// recursively, excluding names that are typically not needed in the build,
// such as .git, .env, build, etc.
function* walkDirWithPresetBlocklist(dir) {
  const shouldInclude = (entry) => {
    const relPath = path.relative(dir, path.join(entry.parentPath, entry.name));
    return !isBlocklisted(relPath);
  };
  yield* iterfilter(shouldInclude, walkDir(dir));
}

// Yields files and symlinks (as fs.Direnv objects) from a directory recursively
// that match any of the given or preset regex patterns.
function* walkDirWithPatterns(dir, patterns) {
  const sep = path.sep.replaceAll('\\', '\\\\'); // escape backslash for regex
  const presetPatterns = [
    `${sep}definition\\.json$`,
    `${sep}package\\.json$`,
    `${sep}aws-sdk${sep}apis${sep}.*\\.json$`,
  ];
  patterns = [...presetPatterns, ...(patterns || [])].map(
    (x) => new RegExp(x, 'i'),
  );
  const shouldInclude = (entry) => {
    const relPath = path.join(entry.parentPath, entry.name);
    if (isBlocklisted(relPath)) {
      return false;
    }
    for (const pattern of patterns) {
      if (pattern.test(relPath)) {
        return true;
      }
    }
    return false;
  };
  yield* iterfilter(shouldInclude, walkDir(dir));
}

// Opens a zip file for writing. Returns an Archiver object.
const openZip = (outputPath) => {
  const output = fs.createWriteStream(outputPath);
  const zip = archiver('zip', {
    zlib: { level: Z_BEST_COMPRESSION }, // Sets the compression level.
  });

  const streamCompletePromise = new Promise((resolve, reject) => {
    output.on('close', resolve);
    zip.on('error', reject);
  });

  zip.finish = async () => {
    // zip.finalize() doesn't return a promise, so here we create a
    // zip.finish() function so the caller can await it.
    // So callers: Use `await zip.finish()` and avoid zip.finalize().
    zip.finalize();
    await streamCompletePromise;
  };

  if (path.sep === '\\') {
    // On Windows, patch zip.file() and zip.symlink() so they normalize the path
    // separator to '/' because we're supposed to use '/' in a zip file
    // regardless of the OS platform. Those are the only two methods we're
    // currently using. If you wanted to call other zip.xxx methods, you should
    // patch them here as well.
    const origFileMethod = zip.file;
    zip.file = (filepath, data) => {
      filepath = path.normalize(filepath);
      return origFileMethod.call(zip, filepath, data);
    };
    const origSymlinkMethod = zip.symlink;
    zip.symlink = (name, target, mode) => {
      name = path.normalize(name);
      target = path.normalize(target);
      return origSymlinkMethod.call(zip, name, target, mode);
    };
  }

  zip.pipe(output);
  return zip;
};

const getNearestNodeModulesDir = (workingDir, relPath) => {
  if (path.basename(relPath) === 'package.json') {
    const nmDir = path.resolve(
      workingDir,
      path.dirname(relPath),
      'node_modules',
    );
    return fs.existsSync(nmDir) ? path.relative(workingDir, nmDir) : null;
  } else if (relPath.includes('node_modules')) {
    let dir = path.dirname(relPath);
    for (let i = 0; i < 100; i++) {
      if (dir.endsWith(`${path.sep}node_modules`)) {
        return dir;
      }
      const nextDir = path.dirname(dir);
      if (nextDir === dir) {
        break;
      }
      dir = nextDir;
    }
  }

  let dir = path.dirname(relPath);
  for (let i = 0; i < 100; i++) {
    const nmDir = path.join(dir, 'node_modules');
    if (fs.existsSync(path.resolve(workingDir, nmDir))) {
      return nmDir;
    }
    const nextDir = path.dirname(dir);
    if (nextDir === dir) {
      break;
    }
    dir = nextDir;
  }

  return null;
};

const countLeadingDoubleDots = (relPath) => {
  const parts = relPath.split(path.sep);
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] !== '..') {
      return i;
    }
  }
  return 0;
};

// Join all relPaths with workingDir and return the common ancestor directory.
const findCommonAncestor = (workingDir, relPaths) => {
  let maxLeadingDoubleDots = 0;

  if (isWindows()) {
    for (const relPath of relPaths) {
      if (relPath.match(/^[a-zA-Z]:/)) {
        // On Windows, relPath can be absolute if it starts with a different
        // drive letter than workingDir.
        return 'C:\\';
      } else {
        maxLeadingDoubleDots = Math.max(
          maxLeadingDoubleDots,
          countLeadingDoubleDots(relPath),
        );
      }
    }
  } else {
    for (const relPath of relPaths) {
      maxLeadingDoubleDots = Math.max(
        maxLeadingDoubleDots,
        countLeadingDoubleDots(relPath),
      );
    }
  }
  let commonAncestor = workingDir;
  for (let i = 0; i < maxLeadingDoubleDots; i++) {
    commonAncestor = path.dirname(commonAncestor);
  }
  return commonAncestor;
};

const stripDriveLetterForZip = (pathStr) => {
  return pathStr.replace(/^[cC]:\\/, '').replace(/^([a-zA-Z]):/, '$1');
};

const writeBuildZipDumbly = async (workingDir, zip) => {
  for (const entry of walkDirWithPresetBlocklist(workingDir)) {
    const absPath = path.resolve(entry.parentPath, entry.name);
    const relPath = path.relative(workingDir, absPath);
    if (entry.isFile()) {
      zip.file(absPath, { name: relPath });
    } else if (entry.isSymbolicLink()) {
      const target = path.relative(entry.parentPath, fs.realpathSync(absPath));
      zip.symlink(relPath, target, 0o644);
    }
  }
};

const writeBuildZipSmartly = async (workingDir, zip) => {
  const entryPoints = [path.resolve(workingDir, 'zapierwrapper.js')];
  const indexPath = path.resolve(workingDir, 'index.js');
  if (fs.existsSync(indexPath)) {
    // Necessary for CommonJS integrations. The zapierwrapper they use require()
    // the index.js file using a variable. esbuild can't detect it, so we need
    // to add it here specifically.
    entryPoints.push(indexPath);
  }

  const appConfig = await getLinkedAppConfig(workingDir, false);
  const relPaths = Array.from(
    new Set([
      // Files found by esbuild and their package.json files
      ...expandRequiredFiles(
        workingDir,
        await findRequiredFiles(workingDir, entryPoints),
      ),
      // Files matching includeInBuild and other preset patterns
      ...itermap(
        (entry) =>
          path.relative(workingDir, path.join(entry.parentPath, entry.name)),
        walkDirWithPatterns(workingDir, appConfig?.includeInBuild),
      ),
    ]),
  ).sort();

  const zipRoot = findCommonAncestor(workingDir, relPaths) || workingDir;

  if (zipRoot !== workingDir) {
    const appDirRelPath = path.relative(zipRoot, workingDir);
    // zapierwrapper.js and index.js are entry points.
    // 'config' is the default directory that the 'config' npm package expects
    // to find config files at the root directory.
    const linkNames = ['zapierwrapper.js', 'index.js', 'config'];
    for (const name of linkNames) {
      if (fs.existsSync(path.join(workingDir, name))) {
        zip.symlink(name, path.join(appDirRelPath, name), 0o644);
      }
    }

    const filenames = ['package.json', 'definition.json'];
    for (const name of filenames) {
      const absPath = path.resolve(workingDir, name);
      zip.file(absPath, { name, mode: 0o644 });
    }
  }

  // Write required files to the zip
  for (const relPath of relPaths) {
    const absPath = path.resolve(workingDir, relPath);
    const nameInZip = stripDriveLetterForZip(path.relative(zipRoot, absPath));
    if (nameInZip === 'package.json' && zipRoot !== workingDir) {
      // Ignore workspace root's package.json
      continue;
    }
    zip.file(absPath, { name: nameInZip, mode: 0o644 });
  }

  // Next, find all symlinks that are either: (1) immediate children of any
  // node_modules directory, or (2) located one directory level below a
  // node_modules directory. (1) is for the case of node_modules/package_name.
  // (2) is for the case of node_modules/@scope/package_name.
  const nodeModulesDirs = new Set();
  for (const relPath of relPaths) {
    const nmDir = getNearestNodeModulesDir(workingDir, relPath);
    if (nmDir) {
      nodeModulesDirs.add(nmDir);
    }
  }

  for (const relNmDir of nodeModulesDirs) {
    const absNmDir = path.resolve(workingDir, relNmDir);
    const symlinks = iterfilter(
      (entry) => {
        // Only include symlinks that are not in node_modules/.bin directories
        return (
          entry.isSymbolicLink() &&
          !entry.parentPath.endsWith(`${path.sep}node_modules${path.sep}.bin`)
        );
      },
      walkDirLimitedLevels(absNmDir, 2),
    );
    for (const symlink of symlinks) {
      const absPath = path.resolve(
        workingDir,
        symlink.parentPath,
        symlink.name,
      );
      const nameInZip = stripDriveLetterForZip(path.relative(zipRoot, absPath));
      const targetInZip = path.relative(
        stripDriveLetterForZip(symlink.parentPath),
        stripDriveLetterForZip(fs.realpathSync(absPath)),
      );
      zip.symlink(nameInZip, targetInZip, 0o644);
    }
  }
};

// Creates the build.zip file.
const makeBuildZip = async (
  workingDir,
  zipPath,
  disableDependencyDetection,
) => {
  const zip = openZip(zipPath);

  if (disableDependencyDetection) {
    // Ideally, if dependency detection works really well, we don't need to
    // support --disable-dependency-detection at all. We might want to phase out
    // this code path over time. Also, this doesn't handle workspaces.
    await writeBuildZipDumbly(workingDir, zip);
  } else {
    await writeBuildZipSmartly(workingDir, zip);
  }

  await zip.finish();
};

const makeSourceZip = async (workingDir, zipPath) => {
  const relPaths = Array.from(
    itermap(
      (entry) =>
        path.relative(workingDir, path.join(entry.parentPath, entry.name)),
      walkDirWithPresetBlocklist(workingDir),
    ),
  );
  const finalRelPaths = respectGitIgnore(workingDir, relPaths).sort();

  const zip = openZip(zipPath);

  debug('\nSource files:');
  for (const relPath of finalRelPaths) {
    if (relPath === 'definition.json' || relPath === 'zapierwrapper.js') {
      // These two files are generated at build time;
      // they're not part of the source code.
      continue;
    }

    const absPath = path.resolve(workingDir, relPath);
    debug(`  ${absPath}`);

    zip.file(absPath, { name: relPath, mode: 0o644 });
  }
  debug();

  await zip.finish();
};

const maybeNotifyAboutOutdated = async () => {
  // Made async because createUpdateNotifier() uses dynamic import() to load ESM-only update-notifier package
  // find a package.json for the app and notify on the core dep
  // `build` won't run if package.json isn't there, so if we get to here we're good
  const requiredVersion = _.get(
    require(path.resolve('./package.json')),
    `dependencies.${PLATFORM_PACKAGE}`,
  );

  if (requiredVersion) {
    const notifier = await createUpdateNotifier({
      pkg: { name: PLATFORM_PACKAGE, version: requiredVersion },
      updateCheckInterval: UPDATE_NOTIFICATION_INTERVAL,
    });

    if (notifier.update && notifier.update.latest !== requiredVersion) {
      notifier.notify({
        message: `There's a newer version of ${colors.cyan(
          PLATFORM_PACKAGE,
        )} available.\nConsider updating the dependency in your\n${colors.cyan(
          'package.json',
        )} (${colors.grey(notifier.update.current)} → ${colors.green(
          notifier.update.latest,
        )}) and then running ${colors.red('zapier test')}.`,
      });
    }
  }
};

const maybeRunBuildScript = async (options = {}) => {
  const ZAPIER_BUILD_KEY = '_zapier-build';

  // Make sure we don't accidentally call the Zapier build hook inside itself
  if (process.env.npm_lifecycle_event !== ZAPIER_BUILD_KEY) {
    const pJson = require(
      path.resolve(options.cwd || process.cwd(), 'package.json'),
    );

    if (_.get(pJson, ['scripts', ZAPIER_BUILD_KEY])) {
      if (options.printProgress) {
        startSpinner(`Running ${ZAPIER_BUILD_KEY} script`);
      }

      await runCommand('npm', ['run', ZAPIER_BUILD_KEY], options);

      if (options.printProgress) {
        endSpinner();
      }
    }
  }
};

const extractMissingModulePath = (testDir, error) => {
  // Extract relative path to print a more user-friendly error message
  if (error.message && error.message.includes('MODULE_NOT_FOUND')) {
    const searchString = `Cannot find module '${testDir}/`;
    const idx = error.message.indexOf(searchString);
    if (idx >= 0) {
      const pathStart = idx + searchString.length;
      const pathEnd = error.message.indexOf("'", pathStart);
      if (pathEnd >= 0) {
        const relPath = error.message.substring(pathStart, pathEnd);
        return relPath;
      }
    }
  }
  return null;
};

const testBuildZip = async (zipPath) => {
  const osTmpDir = await fse.realpath(os.tmpdir());
  const testDir = path.join(
    osTmpDir,
    'zapier-' + crypto.randomBytes(4).toString('hex'),
  );

  try {
    await fse.ensureDir(testDir);
    await decompress(zipPath, testDir);

    const wrapperPath = path.join(testDir, 'zapierwrapper.js');
    if (!fs.existsSync(wrapperPath)) {
      throw new Error('zapierwrapper.js not found in build.zip.');
    }

    const indexPath = path.join(testDir, 'index.js');
    const indexExists = fs.existsSync(indexPath);

    try {
      await runCommand(process.execPath, ['zapierwrapper.js'], {
        cwd: testDir,
        timeout: 5000,
      });
      if (indexExists) {
        await runCommand(process.execPath, ['index.js'], {
          cwd: testDir,
          timeout: 5000,
        });
      }
    } catch (error) {
      // Extract relative path to print a more user-friendly error message
      const relPath = extractMissingModulePath(testDir, error);
      if (relPath) {
        throw new Error(
          `Detected a missing file in build.zip: '${relPath}'\n` +
            `You may have to add it to ${colors.bold.underline('includeInBuild')} ` +
            `in your ${colors.bold.underline('.zapierapprc')} file.`,
        );
      } else if (error.message) {
        // Hide the unzipped temporary directory
        error.message = error.message
          .replaceAll(`file://${testDir}/`, '')
          .replaceAll(`${testDir}/`, '');
      }
      throw error;
    }
  } finally {
    // Clean up test directory
    await fse.remove(testDir);
  }
};

const _buildFunc = async (
  {
    skipNpmInstall = false,
    disableDependencyDetection = false,
    skipValidation = false,
    printProgress = true,
    checkOutdated = true,
  } = {},
  snapshotVersion,
) => {
  const maybeStartSpinner = printProgress ? startSpinner : () => {};
  const maybeEndSpinner = printProgress ? endSpinner : () => {};

  if (checkOutdated) {
    await maybeNotifyAboutOutdated(); // await needed because function is now async due to ESM import
  }
  const appDir = process.cwd();

  let workingDir;
  if (skipNpmInstall) {
    workingDir = appDir;
    debug('Building in app directory: ', workingDir);
  } else {
    const osTmpDir = await fse.realpath(os.tmpdir());
    workingDir = path.join(
      osTmpDir,
      'zapier-' + crypto.randomBytes(4).toString('hex'),
    );
    debug('Building in temp directory: ', workingDir);
  }

  await maybeRunBuildScript({ printProgress });

  // make sure our directories are there
  await fse.ensureDir(workingDir);
  const buildDir = path.join(appDir, BUILD_DIR);
  await fse.ensureDir(buildDir);

  if (!skipNpmInstall) {
    maybeStartSpinner('Copying project to temp directory');
    const copyFilter = (src) => !src.endsWith('.zip');
    await copyDir(appDir, workingDir, { filter: copyFilter });

    maybeEndSpinner();
    maybeStartSpinner('Installing project dependencies');
    const output = await runCommand('npm', ['install', '--production'], {
      cwd: workingDir,
    });

    // `npm install` may fail silently without returning a non-zero exit code,
    // need to check further here
    const corePath = path.join(workingDir, 'node_modules', PLATFORM_PACKAGE);
    if (!fs.existsSync(corePath)) {
      throw new Error(
        'Could not install dependencies properly. Error log:\n' + output.stderr,
      );
    }
  }

  maybeEndSpinner();
  maybeStartSpinner('Applying entry point files');

  const corePath = findCorePackageDir(workingDir);
  await copyZapierWrapper(corePath, workingDir);

  maybeEndSpinner();
  maybeStartSpinner('Building app definition.json');

  const rawDefinition = await localAppCommand(
    { command: 'definition' },
    workingDir,
    false,
  );

  const version = snapshotVersion ?? rawDefinition.version;
  throwForInvalidVersion(version);

  try {
    fs.writeFileSync(
      path.join(workingDir, 'definition.json'),
      prettyJSONstringify(rawDefinition),
    );
  } catch (err) {
    debug('\nFile Write Error:\n', err, '\n');
    throw new Error(
      `Unable to write ${workingDir}/definition.json, please check file permissions!`,
    );
  }

  maybeEndSpinner();

  if (!skipValidation) {
    /**
     * 'Validation' as performed here is twofold:
     * (Locally - `validate`) A Schema Validation is performed locally against the versions schema
     * (Remote - `validateApp`) Both the Schema, AppVersion, and Auths are validated
     */

    maybeStartSpinner('Validating project schema and style');
    const validationErrors = await localAppCommand(
      { command: 'validate' },
      workingDir,
      false,
    );
    if (validationErrors.length) {
      debug('\nErrors:\n', validationErrors, '\n');
      throw new Error(
        'We hit some validation errors, try running `zapier validate` to see them!',
      );
    }

    // No need to mention specifically we're validating style checks as that's
    //   implied from `zapier validate`, though it happens as a separate process
    const styleChecksResponse = await validateApp(rawDefinition);

    if (_.get(styleChecksResponse, ['errors', 'total_failures'])) {
      debug(
        '\nErrors:\n',
        prettyJSONstringify(styleChecksResponse.errors.results),
        '\n',
      );
      throw new Error(
        'We hit some style validation errors, try running `zapier validate` to see them!',
      );
    }

    maybeEndSpinner();

    if (_.get(styleChecksResponse, ['warnings', 'total_failures'])) {
      console.log(colors.yellow('WARNINGS:'));
      const checkIssues = flattenCheckResult(styleChecksResponse);
      for (const issue of checkIssues) {
        if (issue.category !== 'Errors') {
          console.log(colors.yellow(`- ${issue.description}`));
        }
      }
      console.log(colors.yellow('Run `zapier validate` for more details.'));
    }
  } else {
    debug('\nWarning: Skipping Validation');
  }

  maybeStartSpinner('Zipping project and dependencies');

  const zipPath = path.join(appDir, BUILD_PATH);
  await makeBuildZip(workingDir, zipPath, disableDependencyDetection);
  await makeSourceZip(
    workingDir,
    path.join(appDir, SOURCE_PATH),
    disableDependencyDetection,
  );

  maybeEndSpinner();

  if (skipNpmInstall) {
    maybeStartSpinner('Cleaning up temp files');
    await deleteZapierWrapper(workingDir);
    fs.rmSync(path.join(workingDir, 'definition.json'));
    maybeEndSpinner();
  } else {
    maybeStartSpinner('Cleaning up temp directory');
    await fse.remove(workingDir);
    maybeEndSpinner();
  }

  if (!isWindows()) {
    // "Testing build" doesn't work on Windows because of some permission issue
    // with symlinks
    maybeStartSpinner('Testing build');
    await testBuildZip(zipPath);
    maybeEndSpinner();
  }

  return zipPath;
};

const buildAndOrUpload = async (
  { build = false, upload = false } = {},
  buildOpts,
  snapshotVersion,
) => {
  if (!(build || upload)) {
    throw new Error('must either build or upload');
  }

  // we should able to build without any auth, but if we're uploading, we should fail early
  let app;
  if (upload) {
    app = await getWritableApp();
    checkMissingAppInfo(app);
  }

  if (build) {
    await _buildFunc(buildOpts, snapshotVersion);
  }
  if (upload) {
    await _uploadFunc(app, buildOpts, snapshotVersion);
  }
};

module.exports = {
  buildAndOrUpload,
  findRequiredFiles,
  makeBuildZip,
  makeSourceZip,
  maybeRunBuildScript,
  walkDirWithPresetBlocklist,
};
