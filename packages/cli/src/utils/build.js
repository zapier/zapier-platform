const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const _ = require('lodash');
const archiver = require('archiver');
const esbuild = require('esbuild');
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

const { copyDir } = require('./files');

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

const { copyZapierWrapper, deleteZapierWrapper } = require('./zapierwrapper');

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

  const appPackageJson = require(path.join(cwd, 'package.json'));
  const isESM = appPackageJson.type === 'module';
  // Only include 'module' condition if the app is an ESM app (PDE-6187)
  // otherwise exclude 'module' since it breaks the build for hybrid packages (like uuid)
  // in CJS apps by only including ESM version of packages.
  // An empty list is necessary because otherwise if `platform: node` is specified,
  // the 'module' condition is included by default.
  // https://esbuild.github.io/api/#conditions
  const conditions = isESM ? ['module'] : [];
  const format = isESM ? 'esm' : 'cjs';

  const result = await esbuild.build({
    entryPoints,
    outdir: './build',
    bundle: true,
    platform: 'node',
    metafile: true,
    logLevel: 'warning',
    external: [
      '../test/userapp',
      'zapier-platform-core/src/http-middlewares/before/sanatize-headers', // appears in zapier-platform-legacy-scripting-runner/index.js
      './request-worker', // appears in zapier-platform-legacy-scripting-runner/zfactory.js
      './xhr-sync-worker.js', // appears in jsdom/living/xmlhttprequest.js
    ],
    format,
    conditions,
    write: false, // no need to write outfile
    absWorkingDir: cwd,
    tsconfigRaw: '{}',
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
  if (checkOutdated) {
    maybeNotifyAboutOutdated();
  }

  const zipPath = constants.BUILD_PATH;
  const sourceZipPath = constants.SOURCE_PATH;
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

  await maybeRunBuildScript();

  // make sure our directories are there
  await fse.ensureDir(workingDir);
  await fse.ensureDir(constants.BUILD_DIR);

  const corePath = path.join(
    workingDir,
    'node_modules',
    constants.PLATFORM_PACKAGE,
  );

  if (!skipNpmInstall) {
    if (printProgress) {
      startSpinner('Copying project to temp directory');
    }
    const copyFilter = (src) => !src.endsWith('.zip');
    await copyDir(appDir, workingDir, { filter: copyFilter });

    if (printProgress) {
      endSpinner();
      startSpinner('Installing project dependencies');
    }
    const output = await runCommand('npm', ['install', '--production'], {
      cwd: workingDir,
    });

    // `npm install` may fail silently without returning a non-zero exit code,
    // need to check further here
    if (!fs.existsSync(corePath)) {
      throw new Error(
        'Could not install dependencies properly. Error log:\n' + output.stderr,
      );
    }
  }

  if (printProgress) {
    endSpinner();
    startSpinner('Applying entry point files');
  }

  await copyZapierWrapper(corePath, workingDir);

  if (printProgress) {
    endSpinner();
    startSpinner('Building app definition.json');
  }

  const rawDefinition = await localAppCommand(
    { command: 'definition' },
    workingDir,
    false,
  );

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
  await makeZip(
    workingDir,
    path.join(appDir, zipPath),
    disableDependencyDetection,
  );
  await makeSourceZip(
    workingDir,
    path.join(appDir, sourceZipPath),
    disableDependencyDetection,
  );

  if (printProgress) {
    endSpinner();
  }

  if (skipNpmInstall) {
    if (printProgress) {
      startSpinner('Cleaning up temp files');
    }

    await deleteZapierWrapper(workingDir);
    fs.rmSync(path.join(workingDir, 'definition.json'));

    if (printProgress) {
      endSpinner();
    }
  } else {
    if (printProgress) {
      startSpinner('Cleaning up temp directory');
    }
    await fse.removeDir(workingDir);
    if (printProgress) {
      endSpinner();
    }
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
