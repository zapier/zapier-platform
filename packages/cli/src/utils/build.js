const crypto = require('crypto');
const os = require('os');
const path = require('path');

const _ = require('lodash');
const archiver = require('archiver');
const esbuild = require('esbuild');
const fs = require('fs');
const fse = require('fs-extra');
const klaw = require('klaw');
const updateNotifier = require('update-notifier');
const colors = require('colors/safe');
const semver = require('semver');
const { minimatch } = require('minimatch');

const {
  constants: { Z_BEST_COMPRESSION },
} = require('zlib');

const constants = require('../constants');

const { writeFile, copyDir, ensureDir, removeDir } = require('./files');

const {
  prettyJSONstringify,
  startSpinner,
  endSpinner,
  flattenCheckResult,
} = require('./display');

const {
  getLinkedAppConfig,
  getWritableApp,
  upload: _uploadFunc,
  validateApp,
} = require('./api');

const { copyZapierWrapper } = require('./zapierwrapper');

const checkMissingAppInfo = require('./check-missing-app-info');

const { runCommand, isWindows, findCorePackageDir } = require('./misc');
const { respectGitIgnore } = require('./ignore');
const { localAppCommand } = require('./local');

const debug = require('debug')('zapier:build');

const stripPath = (cwd, filePath) => filePath.split(cwd).pop();

// given entry points in a directory, return a list of files that uses
const requiredFiles = async ({ cwd, entryPoints }) => {
  if (!_.endsWith(cwd, path.sep)) {
    cwd += path.sep;
  }

  const result = await esbuild.build({
    entryPoints,
    outdir: './build',
    bundle: true,
    platform: 'node',
    metafile: true,
    logLevel: 'warning',
    external: ['../test/userapp'],
    format: 'esm',
    write: false, // no need to write outfile
    absWorkingDir: cwd,
  });

  return Object.keys(result.metafile.inputs).map((path) =>
    stripPath(cwd, path),
  );
};

const listFiles = (dir) => {
  const isBlocklisted = (filePath) => {
    return constants.BLOCKLISTED_PATHS.find((excluded) => {
      return filePath.search(excluded) === 0;
    });
  };

  return new Promise((resolve, reject) => {
    const paths = [];
    const cwd = dir + path.sep;
    klaw(dir, { preserveSymlinks: true })
      .on('data', (item) => {
        const strippedPath = stripPath(cwd, item.path);
        if (!item.stats.isDirectory() && !isBlocklisted(strippedPath)) {
          paths.push(strippedPath);
        }
      })
      .on('error', reject)
      .on('end', () => {
        paths.sort();
        resolve(paths);
      });
  });
};

const forceIncludeDumbPath = (appConfig, filePath) => {
  let matchesConfigInclude = false;
  const configIncludePaths = _.get(appConfig, 'includeInBuild', []);
  _.each(configIncludePaths, (includePath) => {
    if (filePath.match(RegExp(includePath, 'i'))) {
      matchesConfigInclude = true;
      return false;
    }
    return true; // Because of consistent-return
  });

  const nodeMajorVersion = semver.coerce(constants.LAMBDA_VERSION).major;

  return (
    filePath.endsWith('package.json') ||
    filePath.endsWith('definition.json') ||
    // include old async deasync versions so this runs seamlessly across node versions
    filePath.endsWith(path.join('bin', 'linux-x64-node-10', 'deasync.node')) ||
    filePath.endsWith(path.join('bin', 'linux-x64-node-12', 'deasync.node')) ||
    filePath.endsWith(path.join('bin', 'linux-x64-node-14', 'deasync.node')) ||
    filePath.endsWith(
      // Special, for zapier-platform-legacy-scripting-runner
      path.join('bin', `linux-x64-node-${nodeMajorVersion}`, 'deasync.node'),
    ) ||
    filePath.match(
      path.sep === '\\' ? /aws-sdk\\apis\\.*\.json/ : /aws-sdk\/apis\/.*\.json/,
    ) ||
    matchesConfigInclude
  );
};

const writeZipFromPaths = (dir, zipPath, paths) => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const zip = archiver('zip', {
      zlib: { level: Z_BEST_COMPRESSION },
    });

    // listen for all archive data to be written
    output.on('close', function () {
      resolve();
    });

    zip.on('error', function (err) {
      reject(err);
    });

    // pipe archive data to the file
    zip.pipe(output);

    paths.forEach(function (filePath) {
      let basePath = path.dirname(filePath);
      if (basePath === '.') {
        basePath = undefined;
      }
      const name = path.join(dir, filePath);
      zip.file(name, { name: filePath, mode: 0o755 });
    });

    zip.finalize();
  });
};

const makeZip = async (dir, zipPath, disableDependencyDetection) => {
  const entryPoints = [path.resolve(dir, 'zapierwrapper.js')];

  const indexPath = path.resolve(dir, 'index.js');
  if (fs.existsSync(indexPath)) {
    // Necessary for CommonJS integrations. The zapierwrapper they use require()
    // the index.js file using a variable. esbuild can't detect it, so we need
    // to add it here specifically.
    entryPoints.push(indexPath);
  }

  let paths;

  const [dumbPaths, smartPaths, appConfig] = await Promise.all([
    listFiles(dir),
    requiredFiles({ cwd: dir, entryPoints }),
    getLinkedAppConfig(dir).catch(() => ({})),
  ]);

  if (disableDependencyDetection) {
    paths = dumbPaths;
  } else {
    let finalPaths = smartPaths.concat(
      dumbPaths.filter(forceIncludeDumbPath.bind(null, appConfig)),
    );
    finalPaths = _.uniq(finalPaths);
    finalPaths.sort();
    debug('\nZip files:');
    finalPaths.forEach((filePath) => debug(`  ${filePath}`));
    debug('');
    paths = finalPaths;
  }

  await writeZipFromPaths(dir, zipPath, paths);
};

const makeSourceZip = async (dir, zipPath) => {
  const paths = await listFiles(dir);
  const finalPaths = respectGitIgnore(dir, paths);
  finalPaths.sort();
  debug('\nSource Zip files:');
  finalPaths.forEach((filePath) => debug(`  ${filePath}`));
  debug();
  await writeZipFromPaths(dir, zipPath, finalPaths);
};

const maybeNotifyAboutOutdated = () => {
  // find a package.json for the app and notify on the core dep
  // `build` won't run if package.json isn't there, so if we get to here we're good
  const requiredVersion = _.get(
    require(path.resolve('./package.json')),
    `dependencies.${constants.PLATFORM_PACKAGE}`,
  );

  if (requiredVersion) {
    const notifier = updateNotifier({
      pkg: { name: constants.PLATFORM_PACKAGE, version: requiredVersion },
      updateCheckInterval: constants.UPDATE_NOTIFICATION_INTERVAL,
    });

    if (notifier.update && notifier.update.latest !== requiredVersion) {
      notifier.notify({
        message: `There's a newer version of ${colors.cyan(
          constants.PLATFORM_PACKAGE,
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
      startSpinner(`Running ${ZAPIER_BUILD_KEY} script`);
      await runCommand('npm', ['run', ZAPIER_BUILD_KEY], options);
      endSpinner();
    }
  }
};

// Get `workspaces` from root package.json and convert them to absolute paths.
// Returns an empty array if package.json can't be found.
const listWorkspaces = (workspaceRoot) => {
  const packageJsonPath = path.join(workspaceRoot, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return [];
  }

  let packageJson;
  try {
    packageJson = require(packageJsonPath);
  } catch (err) {
    return [];
  }

  return (packageJson.workspaces || []).map((relpath) =>
    path.resolve(workspaceRoot, relpath),
  );
};

const _buildFunc = async ({
  skipNpmInstall = false,
  disableDependencyDetection = false,
  skipValidation = false,
  printProgress = true,
  checkOutdated = true,
} = {}) => {
  const zipPath = constants.BUILD_PATH;
  const sourceZipPath = constants.SOURCE_PATH;
  const wdir = process.cwd();

  const osTmpDir = await fse.realpath(os.tmpdir());
  const tmpDir = path.join(
    osTmpDir,
    'zapier-' + crypto.randomBytes(4).toString('hex'),
  );
  debug('Using temp directory: ', tmpDir);

  if (checkOutdated) {
    maybeNotifyAboutOutdated();
  }

  await maybeRunBuildScript();

  // make sure our directories are there
  await ensureDir(tmpDir);
  await ensureDir(constants.BUILD_DIR);

  if (printProgress) {
    startSpinner('Copying project to temp directory');
  }

  const copyFilter = skipNpmInstall
    ? (src) => !src.endsWith('.zip')
    : undefined;

  await copyDir(wdir, tmpDir, { filter: copyFilter });

  if (skipNpmInstall) {
    const corePackageDir = findCorePackageDir();
    const nodeModulesDir = path.dirname(corePackageDir);
    const workspaceRoot = path.dirname(nodeModulesDir);
    if (wdir !== workspaceRoot) {
      // If we're in here, it means the user is using npm/yarn workspaces
      const workspaces = listWorkspaces(workspaceRoot);

      await copyDir(nodeModulesDir, path.join(tmpDir, 'node_modules'), {
        filter: (src) => {
          if (src.endsWith('.zip')) {
            return false;
          }
          const stat = fse.lstatSync(src);
          if (stat.isSymbolicLink()) {
            const realPath = path.resolve(
              path.dirname(src),
              fse.readlinkSync(src),
            );
            for (const workspace of workspaces) {
              // Use minimatch to do glob pattern match. If match, it means the
              // symlink points to a workspace package, so we don't copy it.
              if (minimatch(realPath, workspace)) {
                return false;
              }
            }
          }
          return true;
        },
        onDirExists: (dir) => {
          // Don't overwrite existing sub-directories in node_modules
          return false;
        },
      });
    }
  }

  let output = {};
  if (!skipNpmInstall) {
    if (printProgress) {
      endSpinner();
      startSpinner('Installing project dependencies');
    }
    output = await runCommand('npm', ['install', '--production'], {
      cwd: tmpDir,
    });
  }

  // `npm install` may fail silently without returning a non-zero exit code, need to check further here
  const corePath = path.join(
    tmpDir,
    'node_modules',
    constants.PLATFORM_PACKAGE,
  );
  if (!fs.existsSync(corePath)) {
    throw new Error(
      'Could not install dependencies properly. Error log:\n' + output.stderr,
    );
  }

  if (printProgress) {
    endSpinner();
    startSpinner('Applying entry point files');
  }

  await copyZapierWrapper(corePath, tmpDir);

  if (printProgress) {
    endSpinner();
    startSpinner('Building app definition.json');
  }

  const rawDefinition = await localAppCommand(
    { command: 'definition' },
    tmpDir,
    false,
  );
  const fileWriteError = await writeFile(
    path.join(tmpDir, 'definition.json'),
    prettyJSONstringify(rawDefinition),
  );

  if (fileWriteError) {
    debug('\nFile Write Error:\n', fileWriteError, '\n');
    throw new Error(
      `Unable to write ${tmpDir}/definition.json, please check file permissions!`,
    );
  }

  if (printProgress) {
    endSpinner();
  }

  if (!skipValidation) {
    /**
     * 'Validation' as performed here is twofold:
     * (Locally - `validate`) A Schema Validation is performed locally against the versions schema
     * (Remote - `validateApp`) Both the Schema, AppVersion, and Auths are validated
     */

    if (printProgress) {
      startSpinner('Validating project schema and style');
    }
    const validationErrors = await localAppCommand(
      { command: 'validate' },
      tmpDir,
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
    if (printProgress) {
      endSpinner();
    }

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

  if (printProgress) {
    startSpinner('Zipping project and dependencies');
  }
  await makeZip(tmpDir, path.join(wdir, zipPath), disableDependencyDetection);
  await makeSourceZip(
    tmpDir,
    path.join(wdir, sourceZipPath),
    disableDependencyDetection,
  );

  if (printProgress) {
    endSpinner();
    startSpinner('Testing build');
  }

  if (!isWindows()) {
    // TODO err, what should we do on windows?

    // tries to do a reproducible build at least
    // https://content.pivotal.io/blog/barriers-to-deterministic-reproducible-zip-files
    // https://reproducible-builds.org/tools/ or strip-nondeterminism
    await runCommand(
      'find',
      ['.', '-exec', 'touch', '-t', '201601010000', '{}', '+'],
      { cwd: tmpDir },
    );
  }

  if (printProgress) {
    endSpinner();
    startSpinner('Cleaning up temp directory');
  }

  await removeDir(tmpDir);

  if (printProgress) {
    endSpinner();
  }

  return zipPath;
};

const buildAndOrUpload = async (
  { build = false, upload = false } = {},
  buildOpts,
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
    await _buildFunc(buildOpts);
  }
  if (upload) {
    await _uploadFunc(app, buildOpts);
  }
};

module.exports = {
  buildAndOrUpload,
  makeZip,
  makeSourceZip,
  listFiles,
  requiredFiles,
  maybeRunBuildScript,
};
