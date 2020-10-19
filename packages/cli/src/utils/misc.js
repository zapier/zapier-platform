const cp = require('child_process');
const debug = require('debug')('zapier:misc');

const _ = require('lodash');
const colors = require('colors/safe');
const path = require('path');
const fse = require('fs-extra');
const os = require('os');
const semver = require('semver');

const {
  PLATFORM_PACKAGE,
  PACKAGE_VERSION,
  NODE_VERSION_CLI_REQUIRES,
} = require('../constants');

const { fileExistsSync } = require('./files');

const camelCase = (str) => _.capitalize(_.camelCase(str));
const snakeCase = (str) => _.snakeCase(str);

const isWindows = () => {
  return os.platform().match(/^win/i);
};

// Run a bash command with a promise.
const runCommand = (command, args, options) => {
  if (isWindows()) {
    command += '.cmd';
  }

  if (_.get(global, ['argOpts', 'debug'])) {
    debug.enabled = true;
  }

  options = options || {};

  debug('\n');
  debug(
    `Running ${colors.bold(
      command + ' ' + args.join(' ')
    )} command in ${colors.bold(options.cwd || process.cwd())}:\n`
  );

  return new Promise((resolve, reject) => {
    const result = cp.spawn(command, args, options);

    let stdout = '';
    if (result.stdout) {
      result.stdout.on('data', (data) => {
        const str = data.toString();
        stdout += str;
        debug(colors.green(str));
      });
    }

    let stderr = '';
    if (result.stderr) {
      result.stderr.on('data', (data) => {
        const str = data.toString();
        stderr += str;
        debug(colors.red(str));
      });
    }

    result.on('error', reject);

    result.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr));
      }
      resolve({ stdout, stderr });
    });
  });
};

const isValidNodeVersion = (version = process.version) =>
  semver.satisfies(version, NODE_VERSION_CLI_REQUIRES);

const isValidAppInstall = () => {
  let packageJson, dependedCoreVersion;
  try {
    packageJson = require(path.join(process.cwd(), 'package.json'));
    dependedCoreVersion = _.get(packageJson, [
      'dependencies',
      PLATFORM_PACKAGE,
    ]);
    // could check for a lot more, but this is probably enough: https://docs.npmjs.com/files/package.json#dependencies
    if (!dependedCoreVersion) {
      return {
        valid: false,
        reason: `Your app doesn't depend on ${PLATFORM_PACKAGE}. Run \`${colors.cyan(
          `npm install -E ${PLATFORM_PACKAGE}`
        )}\` to resolve`,
      };
    } else if (!semver.valid(dependedCoreVersion)) {
      // semver.valid only matches exact versions
      return {
        valid: false,
        reason: `Your app must depend on an exact version of ${PLATFORM_PACKAGE}. Instead of "${dependedCoreVersion}", specify an exact version (such as "${PACKAGE_VERSION}")`,
      };
    }
  } catch (err) {
    return { valid: false, reason: String(err) };
  }

  try {
    const installedPackageJson = require(path.join(
      process.cwd(),
      'node_modules',
      PLATFORM_PACKAGE,
      'package.json'
    ));

    const installedCoreVersion = installedPackageJson.version;
    // not an error for now, but something to mention to them
    if (dependedCoreVersion !== installedCoreVersion) {
      console.warn(
        `\nYour code depends on v${dependedCoreVersion} of ${PLATFORM_PACKAGE}, but your local copy is v${installedCoreVersion}. You should probably reinstall your dependencies.\n`
      );
    }
  } catch (err) {
    return {
      valid: false,
      reason: `Looks like you're missing a local installation of ${PLATFORM_PACKAGE}. Run \`${colors.cyan(
        'npm install'
      )}\` to resolve`,
    };
  }

  return { valid: true };
};

const npmInstall = (appDir) => {
  return runCommand('npm', ['install'], { cwd: appDir });
};

/*
  Promise do-while loop. Executes promise returned by action,
  passing result to stop function. Keeps running action until
  stop returns truthy. Action is always run at least once.
 */
const promiseDoWhile = (action, stop) => {
  const loop = () =>
    action().then((result) => (stop(result) ? result : loop()));
  return loop();
};

/* Return full path to entry point file as specified in package.json (ie "index.js") */
const entryPoint = (dir) => {
  dir = dir || process.cwd();
  const packageJson = require(path.resolve(dir, 'package.json'));
  return fse.realpathSync(path.resolve(dir, packageJson.main));
};

const printVersionInfo = (context) => {
  const versions = [
    `zapier-platform-cli/${PACKAGE_VERSION}`,
    `node/${process.version}`,
  ];

  if (fileExistsSync(path.resolve('./package.json'))) {
    let requiredVersion = _.get(
      require(path.resolve('./package.json')),
      `dependencies.${PLATFORM_PACKAGE}`
    );
    if (requiredVersion) {
      // might be a caret, have to coerce for later comparison
      requiredVersion = semver.coerce(requiredVersion).version;

      // the single version their package.json requires
      versions.splice(1, 0, `zapier-platform-core/${requiredVersion}`);

      if (requiredVersion !== PACKAGE_VERSION) {
        versions.push(
          `${colors.yellow('\nWarning!')} "CLI" (${colors.green(
            PACKAGE_VERSION
          )}) and "core" (${colors.green(
            requiredVersion
          )}) versions are out of sync. This is probably fine, but if you're experiencing issues, update the ${colors.cyan(
            PLATFORM_PACKAGE
          )} dependency in your ${colors.cyan(
            'package.json'
          )} to ${colors.green(PACKAGE_VERSION)}.`
        );
      }

      if (
        fileExistsSync(
          path.resolve(`./node_modules/${PLATFORM_PACKAGE}/package.json`)
        )
      ) {
        // double check they have the right version installed
        const installedPkgVersion = require(path.resolve(
          `./node_modules/${PLATFORM_PACKAGE}/package.json`
        )).version;

        if (requiredVersion !== installedPkgVersion) {
          versions.push(
            `${colors.yellow('\nWarning!')} Required version (${colors.green(
              requiredVersion
            )}) and installed version (${colors.green(
              installedPkgVersion
            )}) are out of sync. Run ${colors.cyan('`npm install`')} to fix.\n`
          );
        }
      }
    }
  }

  context.line(versions.join('\n'));
};

module.exports = {
  camelCase,
  entryPoint,
  isValidAppInstall,
  isValidNodeVersion,
  isWindows,
  npmInstall,
  printVersionInfo,
  promiseDoWhile,
  runCommand,
  snakeCase,
};
