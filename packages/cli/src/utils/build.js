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
const updateNotifier = require('update-notifier');

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

const { findCorePackageDir, runCommand } = require('./misc');
const { isBlocklisted, respectGitIgnore } = require('./ignore');
const { localAppCommand } = require('./local');

const debug = require('debug')('zapier:build');

// const stripPath = (cwd, filePath) => filePath.split(cwd).pop();

// Given entry points in a directory, return an array of file paths that are
// required for the build. The returned paths are relative to workingDir.
const requiredFiles = async (workingDir, entryPoints) => {
  const appPackageJson = require(path.join(workingDir, 'package.json'));
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
    absWorkingDir: workingDir,
    tsconfigRaw: '{}',
  });

  return Object.keys(result.metafile.inputs);
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
function* walkDirWithIgnores(dir) {
  const shouldInclude = (entry) => {
    // FIXME: entry.parentPath is not necessarily a relative path
    return !isBlocklisted(path.join(entry.parentPath, entry.name));
  };
  yield* iterfilter(shouldInclude, walkDir(dir));
}

// Yields files and symlinks (as fs.Direnv objects) from a directory recursively
// that match any of the given or preset regex patterns.
function* walkDirWithPatterns(dir, patterns) {
  const presetPatterns = [
    `${path.sep}definition\\.json$`,
    `${path.sep}package\\.json$`,
    `${path.sep}aws-sdk${path.sep}apis${path.sep}.*\\.json$`,
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

const writeZipFromPaths = (workingDir, zipPath, paths) => {
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
      const name = path.join(workingDir, filePath);
      zip.file(name, { name: filePath, mode: 0o755 });
    });

    zip.finalize();
  });
};

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
    // separator to '/' because we're supposed to use '/' in a zip file.
    // Those are the only two methods we're currently using. If you wanted to
    // call other zip.xxx methods, you should patch them here as well.
    const origFileMethod = zip.file;
    zip.file = (filepath, data) => {
      filepath = filepath.replaceAll('\\', '/');
      return origFileMethod.call(zip, filepath, data);
    };
    const origSymlinkMethod = zip.symlink;
    zip.symlink = (name, target, mode) => {
      name = name.replaceAll('\\', '/');
      target = target.replaceAll('\\', '/');
      return origSymlinkMethod.call(zip, name, target, mode);
    };
  }

  zip.pipe(output);
  return zip;
};

const looksLikeWorkspaceRoot = async (dir) => {
  if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) {
    return true;
  }

  const packageJsonPath = path.join(dir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return false;
  }

  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch (err) {
    return false;
  }

  return packageJson?.workspaces != null;
};

// Traverses up the directory tree to find the workspace root. The workspace
// root directory either contains pnpm-workspace.yaml or a package.json file
// with a "workspaces" field. Returns the absolute path to the workspace root
// directory, or null if not found.
const findWorkspaceRoot = async (workingDir) => {
  let dir = workingDir;
  for (let i = 0; i < 500; i++) {
    if (await looksLikeWorkspaceRoot(dir)) {
      return dir;
    }
    if (dir === '/' || dir.match(/^[a-z]:\\$/i)) {
      break;
    }
    dir = path.dirname(dir);
  }
  return null;
};

const getNearestNodeModulesDir = (workingDir, relPath) => {
  if (relPath.endsWith(`${path.sep}package.json`)) {
    const nmDir = path.resolve(
      workingDir,
      path.dirname(relPath),
      'node_modules',
    );
    return fs.existsSync(nmDir) ? nmDir : null;
  } else {
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
    return null;
  }
};

// Creates the build.zip file.
const makeZip = async (workingDir, zipPath, disableDependencyDetection) => {
  const zip = openZip(zipPath);

  if (disableDependencyDetection) {
    // Ideally, if dependency detection works really well, we don't need to
    // support --disable-dependency-detection at all. We might want phase out
    // this code path over time.
    for (const entry of walkDirWithIgnores(workingDir)) {
      const relPath = path.join(entry.parentPath, entry.name);
      const absPath = path.resolve(workingDir, relPath);
      if (entry.isFile()) {
        zip.file(absPath, { name: relPath });
      } else if (entry.isSymbolicLink()) {
        // Resolve the symlink and write the target to the zip
        const target = fs.realPathSync(absPath);
        zip.file(target, { name: relPath });
      }
    }
  } else {
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
        ...expandRequiredFiles(
          workingDir,
          await requiredFiles(workingDir, entryPoints),
        ),
        ...itermap(
          (entry) => path.join(entry.parentPath, entry.name),
          walkDirWithPatterns(workingDir, appConfig?.includeInBuild),
        ),
      ]),
    ).sort();

    const workspaceRoot = (await findWorkspaceRoot(workingDir)) || workingDir;

    if (workspaceRoot !== workingDir) {
      const appDirRelPath = path.relative(workspaceRoot, workingDir);
      const linkNames = ['zapierwrapper.js', 'index.js'];
      for (const name of linkNames) {
        zip.symlink(name, path.join(appDirRelPath, name), 0o644);
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
      const nameInZip = path.relative(workspaceRoot, absPath);
      if (nameInZip === 'package.json' && workspaceRoot !== workingDir) {
        // Ignore workspace root's package.json
        continue;
      }
      zip.file(absPath, { name: nameInZip });
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
        (entry) => entry.isSymbolicLink(),
        walkDirLimitedLevels(absNmDir, 2),
      );
      for (const symlink of symlinks) {
        const absPath = path.resolve(
          workingDir,
          symlink.parentPath,
          symlink.name,
        );
        const nameInZip = path.relative(workspaceRoot, absPath);
        zip.file(absPath, { name: nameInZip });
      }
    }

    // If the developer uses pnpm workspaces, we'll use the '__root' directory
    // in the zip to represent the workspace root. The directory layout in the
    // zip file would be like:
    // ├─__root/
    // │   └── node_modules/
    // │       └── .pnpm/
    // │            └── zapier-platform-core@17.1.0/
    // │                └── node_modules/
    // │                    ├── zapier-platform-core/
    // │                    │   ├── package.json
    // │                    │   └── other platform-core files...
    // │                    ├── lodash/ -> ../../lodash@4.17.21/node_modules/lodash/
    // │                    └── other dependencies of platform-core...
    // ├─ node_modules/
    // │  ├── zapier-platform-core/ -> ../__root/node_modules/.pnpm/zapier-platform-core@17.1.0/node_modules/zapier-platform-core/
    // │  └── other dependencies of the app...
    // ├─ package.json
    // ├─ index.js
    // └─ other files of the app...
  }

  await zip.finish();
};

const makeSourceZip = async (workingDir, zipPath) => {
  const paths = Array.from(
    itermap(
      // respectGitIgnore() wants relative paths
      (entry) =>
        path.relative(workingDir, path.join(entry.parentPath, entry.name)),
      walkDirWithIgnores(workingDir),
    ),
  );
  const finalPaths = respectGitIgnore(workingDir, paths);
  finalPaths.sort();
  debug('\nSource Zip files:');
  finalPaths.forEach((filePath) => debug(`  ${filePath}`));
  debug();
  await writeZipFromPaths(workingDir, zipPath, finalPaths);
};

const maybeNotifyAboutOutdated = () => {
  // find a package.json for the app and notify on the core dep
  // `build` won't run if package.json isn't there, so if we get to here we're good
  const requiredVersion = _.get(
    require(path.resolve('./package.json')),
    `dependencies.${PLATFORM_PACKAGE}`,
  );

  if (requiredVersion) {
    const notifier = updateNotifier({
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
      startSpinner(`Running ${ZAPIER_BUILD_KEY} script`);
      await runCommand('npm', ['run', ZAPIER_BUILD_KEY], options);
      endSpinner();
    }
  }
};

const _buildFunc = async ({
  skipNpmInstall = false,
  disableDependencyDetection = false,
  skipValidation = false,
  printProgress = true,
  checkOutdated = true,
} = {}) => {
  const maybeStartSpinner = printProgress ? startSpinner : () => {};
  const maybeEndSpinner = printProgress ? endSpinner : () => {};

  if (checkOutdated) {
    maybeNotifyAboutOutdated();
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

  await maybeRunBuildScript();

  // make sure our directories are there
  await fse.ensureDir(workingDir);
  const buildDir = path.join(appDir, BUILD_DIR);
  await fse.ensureDir(buildDir);

  const corePath = findCorePackageDir(workingDir);

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
    if (!fs.existsSync(corePath)) {
      throw new Error(
        'Could not install dependencies properly. Error log:\n' + output.stderr,
      );
    }
  }

  maybeEndSpinner();
  maybeStartSpinner('Applying entry point files');

  await copyZapierWrapper(corePath, workingDir);

  maybeEndSpinner();
  maybeStartSpinner('Building app definition.json');

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
  await makeZip(workingDir, zipPath, disableDependencyDetection);
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
    await fse.removeDir(workingDir);
    maybeEndSpinner();
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
  makeSourceZip,
  makeZip,
  maybeRunBuildScript,
  requiredFiles,
};
