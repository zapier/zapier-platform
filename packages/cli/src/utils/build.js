const crypto = require('crypto');
const os = require('os');
const path = require('path');

const browserify = require('browserify');
const through = require('through2');
const _ = require('lodash');
const archiver = require('archiver');
const fs = require('fs');
const fse = require('fs-extra');
const klaw = require('klaw');
const updateNotifier = require('update-notifier');
const colors = require('colors/safe');
const ignore = require('ignore');
const gitIgnore = require('parse-gitignore');
const semver = require('semver');

const constants = require('../constants');

const {
  writeFile,
  readFile,
  copyDir,
  ensureDir,
  removeDir
} = require('./files');

const { prettyJSONstringify, startSpinner, endSpinner } = require('./display');

const {
  getLinkedAppConfig,
  checkCredentials,
  upload: _uploadFunc,
  callAPI
} = require('./api');

const { runCommand, isWindows } = require('./misc');

const debug = require('debug')('zapier:build');

const stripPath = (cwd, filePath) => filePath.split(cwd).pop();

// given entry points in a directory, return a list of files that uses
// could probably be done better with module-deps...
// TODO: needs to include package.json files too i think
//   https://github.com/serverless/serverless-optimizer-plugin?
const requiredFiles = (cwd, entryPoints) => {
  if (!_.endsWith(cwd, path.sep)) {
    cwd += path.sep;
  }

  const argv = {
    noParse: [undefined],
    extensions: [],
    ignoreTransform: [],
    entries: entryPoints,
    fullPaths: false,
    builtins: false,
    commondir: false,
    bundleExternal: true,
    basedir: cwd,
    browserField: false,
    detectGlobals: true,
    insertGlobals: false,
    insertGlobalVars: {
      process: undefined,
      global: undefined,
      'Buffer.isBuffer': undefined,
      Buffer: undefined
    },
    ignoreMissing: true,
    debug: false,
    standalone: undefined
  };
  const b = browserify(argv);

  return new Promise((resolve, reject) => {
    b.on('error', reject);

    const paths = [];
    b.pipeline.get('deps').push(
      through
        .obj((row, enc, next) => {
          const filePath = row.file || row.id;
          paths.push(stripPath(cwd, filePath));
          next();
        })
        .on('end', () => {
          paths.sort();
          resolve(paths);
        })
    );
    b.bundle();
  });
};

const listFiles = dir => {
  const isBlacklisted = filePath => {
    return constants.BLACKLISTED_PATHS.find(excluded => {
      return filePath.search(excluded) === 0;
    });
  };

  return new Promise((resolve, reject) => {
    const paths = [];
    const cwd = dir + path.sep;
    klaw(dir, { preserveSymlinks: true })
      .on('data', item => {
        const strippedPath = stripPath(cwd, item.path);
        if (!item.stats.isDirectory() && !isBlacklisted(strippedPath)) {
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

// Exclude file paths in .gitignore
const respectGitIgnore = (dir, paths) => {
  const gitIgnorePath = path.join(dir, '.gitignore');
  if (!fs.existsSync(gitIgnorePath)) {
    if (!constants.IS_TESTING) {
      console.log(
        `\n\n\t${colors.yellow(
          '!! Warning !!'
        )}\n\nThere is no .gitignore, so we are including all files. This might make the source.zip file too large\n`
      );
    }
    return paths;
  }
  const gitIgnoredPaths = gitIgnore(gitIgnorePath);
  const validGitIgnorePaths = gitIgnoredPaths.filter(ignore.isPathValid);
  const gitFilter = ignore().add(validGitIgnorePaths);

  return gitFilter.filter(paths);
};

const forceIncludeDumbPath = (appConfig, filePath) => {
  let matchesConfigInclude = false;
  const configIncludePaths = _.get(appConfig, 'includeInBuild', []);
  _.each(configIncludePaths, includePath => {
    if (filePath.match(RegExp(includePath, 'i'))) {
      matchesConfigInclude = true;
      return false;
    }
    return true; // Because of consistent-return
  });

  const nodeMajorVersion = semver(constants.LAMBDA_VERSION).major;

  return (
    filePath.endsWith('package.json') ||
    filePath.endsWith('definition.json') ||
    filePath.endsWith(
      // Special, for zapier-platform-legacy-scripting-runner
      path.join('bin', `linux-x64-node-${nodeMajorVersion}`, 'deasync.node')
    ) ||
    filePath.match(
      path.sep === '\\' ? /aws-sdk\\apis\\.*\.json/ : /aws-sdk\/apis\/.*\.json/
    ) ||
    matchesConfigInclude
  );
};

const writeZipFromPaths = (dir, zipPath, paths) => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const zip = archiver('zip', {
      store: true // Sets the compression method to STORE.
    });

    // listen for all archive data to be written
    output.on('close', function() {
      resolve();
    });

    zip.on('error', function(err) {
      reject(err);
    });

    // pipe archive data to the file
    zip.pipe(output);

    paths.forEach(function(filePath) {
      var basePath = path.dirname(filePath);
      if (basePath === '.') {
        basePath = undefined;
      }
      var name = path.join(dir, filePath);
      zip.file(name, { name: filePath, mode: 0o755 });
    });

    zip.finalize();
  });
};

const makeZip = async (dir, zipPath, disableDependencyDetection) => {
  const entryPoints = [
    path.resolve(dir, 'zapierwrapper.js'),
    path.resolve(dir, 'index.js')
  ];

  let paths;

  const [dumbPaths, smartPaths, appConfig] = await Promise.all([
    listFiles(dir),
    requiredFiles(dir, entryPoints),
    getLinkedAppConfig(dir).catch(() => ({}))
  ]);

  if (disableDependencyDetection) {
    paths = dumbPaths;
  } else {
    let finalPaths = smartPaths.concat(
      dumbPaths.filter(forceIncludeDumbPath.bind(null, appConfig))
    );
    finalPaths = _.uniq(finalPaths);
    finalPaths.sort();
    debug('\nZip files:');
    finalPaths.forEach(filePath => debug(`  ${filePath}`));
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
  finalPaths.forEach(filePath => debug(`  ${filePath}`));
  debug();
  await writeZipFromPaths(dir, zipPath, finalPaths);
};

// Similar to utils.appCommand, but given a ready to go app
// with a different location and ready to go zapierwrapper.js.
const _appCommandZapierWrapper = (dir, event) => {
  const app = require(`${dir}/zapierwrapper.js`);
  event = Object.assign({}, event, {
    calledFromCli: true
  });
  return new Promise((resolve, reject) => {
    app.handler(event, {}, (err, resp) => {
      if (err) {
        reject(err);
      } else {
        resolve(resp);
      }
    });
  });
};

const maybeNotifyAboutOutdated = () => {
  // find a package.json for the app and notify on the core dep
  // `build` won't run if package.json isn't there, so if we get to here we're good
  const requiredVersion = _.get(
    require(path.resolve('./package.json')),
    `dependencies.${constants.PLATFORM_PACKAGE}`
  );

  if (requiredVersion) {
    const notifier = updateNotifier({
      pkg: { name: constants.PLATFORM_PACKAGE, version: requiredVersion },
      updateCheckInterval: constants.UPDATE_NOTIFICATION_INTERVAL
    });

    if (notifier.update && notifier.update.latest !== requiredVersion) {
      notifier.notify({
        message: `There's a newer version of ${colors.cyan(
          constants.PLATFORM_PACKAGE
        )} available.\nConsider updating the dependency in your\n${colors.cyan(
          'package.json'
        )} (${colors.grey(notifier.update.current)} → ${colors.green(
          notifier.update.latest
        )}) and then running ${colors.red('zapier test')}.`
      });
    }
  }
};

const _buildFunc = async ({
  skipNpmInstall = false,
  disableDependencyDetection = false
} = {}) => {
  const zipPath = constants.BUILD_PATH;
  const sourceZipPath = constants.SOURCE_PATH;
  const wdir = process.cwd();

  const osTmpDir = await fse.realpath(os.tmpdir());
  const tmpDir = path.join(
    osTmpDir,
    'zapier-' + crypto.randomBytes(4).toString('hex')
  );

  maybeNotifyAboutOutdated();

  // make sure our directories are there
  await ensureDir(tmpDir);
  await ensureDir(constants.BUILD_DIR);

  startSpinner('Copying project to temp directory');
  await copyDir(wdir, tmpDir, {
    filter: skipNpmInstall ? dir => !dir.includes('.zip') : undefined
  });

  let output = {};
  if (!skipNpmInstall) {
    endSpinner();
    startSpinner('Installing project dependencies');
    output = await runCommand('npm', ['install', '--production'], {
      cwd: tmpDir
    });
  }

  // `npm install` may fail silently without returning a non-zero exit code, need to check further here
  const corePath = path.join(
    tmpDir,
    'node_modules',
    constants.PLATFORM_PACKAGE
  );
  if (!fs.existsSync(corePath)) {
    throw new Error(
      'Could not install dependencies properly. Error log:\n' + output.stderr
    );
  }
  endSpinner();

  startSpinner('Applying entry point file');
  // TODO: should this routine for include exist elsewhere?
  const zapierWrapperBuf = await readFile(
    path.join(
      tmpDir,
      'node_modules',
      constants.PLATFORM_PACKAGE,
      'include',
      'zapierwrapper.js'
    )
  );
  await writeFile(
    path.join(tmpDir, 'zapierwrapper.js'),
    zapierWrapperBuf.toString()
  );
  endSpinner();

  startSpinner('Building app definition.json');
  const rawDefinition = (await _appCommandZapierWrapper(tmpDir, {
    command: 'definition'
  })).results;

  const fileWriteError = await writeFile(
    path.join(tmpDir, 'definition.json'),
    prettyJSONstringify(rawDefinition)
  );

  if (fileWriteError) {
    debug('\nFile Write Error:\n', fileWriteError, '\n');
    throw new Error(
      `Unable to write ${tmpDir}/definition.json, please check file permissions!`
    );
  }
  endSpinner();

  startSpinner('Validating project');
  const validateResponse = await _appCommandZapierWrapper(tmpDir, {
    command: 'validate'
  });

  const validationErrors = validateResponse.results;
  if (validationErrors.length) {
    debug('\nErrors:\n', validationErrors, '\n');
    throw new Error(
      'We hit some validation errors, try running `zapier validate` to see them!'
    );
  }

  // No need to mention specifically we're validating style checks as that's
  //   implied from `zapier validate`, though it happens as a separate process
  const styleChecksResponse = await callAPI('/style-check', {
    skipDeployKey: true,
    method: 'POST',
    body: rawDefinition
  });

  const styleErrors = styleChecksResponse.errors;
  if (!_.isEmpty(styleErrors)) {
    debug('\nErrors:\n', styleErrors, '\n');
    throw new Error(
      'We hit some style validation errors, try running `zapier validate` to see them!'
    );
  }
  endSpinner();

  startSpinner('Zipping project and dependencies');
  await makeZip(tmpDir, path.join(wdir, zipPath), disableDependencyDetection);
  await makeSourceZip(
    tmpDir,
    path.join(wdir, sourceZipPath),
    disableDependencyDetection
  );
  endSpinner();

  startSpinner('Testing build');
  if (!isWindows()) {
    // TODO err, what should we do on windows?

    // tries to do a reproducible build at least
    // https://content.pivotal.io/blog/barriers-to-deterministic-reproducible-zip-files
    // https://reproducible-builds.org/tools/ or strip-nondeterminism
    await runCommand(
      'find',
      ['.', '-exec', 'touch', '-t', '201601010000', '{}', '+'],
      { cwd: tmpDir }
    );
  }
  endSpinner();

  startSpinner('Cleaning up temp directory');
  await removeDir(tmpDir);
  endSpinner();

  return zipPath;
};

const buildAndOrUpload = async (
  { build = false, upload = false } = {},
  buildOpts
) => {
  if (!(build || upload)) {
    throw new Error('must either build or upload');
  }
  await checkCredentials();
  if (build) {
    await _buildFunc(buildOpts);
  }
  if (upload) {
    await _uploadFunc();
  }
};

module.exports = {
  buildAndOrUpload,
  makeZip,
  makeSourceZip,
  listFiles,
  requiredFiles
};
