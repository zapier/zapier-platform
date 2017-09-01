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

const constants = require('../constants');

const {
  writeFile,
  readFile,
  copyDir,
  ensureDir,
  removeDir,
} = require('./files');

const {
  prettyJSONstringify,
  printStarting,
  printDone,
} = require('./display');

const {
  checkCredentials,
  upload,
  callAPI,
} = require('./api');

const {
  runCommand,
  isWindows,
} = require('./misc');

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
    noParse: [ undefined ],
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
    ignoreMissing: false,
    debug: false,
    standalone: undefined
  };
  const b = browserify(argv);

  return new Promise((resolve, reject) => {
    b.on('error', reject);

    const paths = [];
    b.pipeline.get('deps')
      .push(through.obj((row, enc, next) => {
        const filePath = row.file || row.id;
        // why does browserify add /private + filePath?
        paths.push(stripPath(cwd, filePath));
        next();
      })
        .on('end', () => {
          paths.sort();
          resolve(paths);
        }));
    b.bundle();
  });
};

const listFiles = (dir) => {
  return new Promise((resolve, reject) => {
    const paths = [];
    const cwd = dir + path.sep;
    klaw(dir)
      .on('data', (item) => {
        if (!item.stats.isDirectory()) {
          paths.push(stripPath(cwd, item.path));
        }
      })
      .on('error', reject)
      .on('end', () => {
        paths.sort();
        resolve(paths);
      });
  });
};

const forceIncludeDumbPath = (filePath/*, smartPaths*/) => {
  // we include smartPaths just incase you want to check the inclusion of some library
  return (
    (filePath.endsWith('package.json') || filePath.endsWith('definition.json'))
    || filePath.match(path.sep === '\\' ? /aws-sdk\\apis\\.*\.json/ : /aws-sdk\/apis\/.*\.json/)
    || (global.argOpts['include-js-map'] && filePath.endsWith('.js.map'))
  );
};

const makeZip = (dir, zipPath) => {
  const entryPoints = [
    path.resolve(dir, 'zapierwrapper.js'),
    path.resolve(dir, 'index.js')
  ];

  return requiredFiles(dir, entryPoints)
    .then((smartPaths) => Promise.all([
      smartPaths,
      listFiles(dir)
    ]))
    .then(([smartPaths, dumbPaths]) => {
      if (global.argOpts['disable-dependency-detection']) {
        return dumbPaths;
      }
      let finalPaths = smartPaths.concat(dumbPaths.filter(forceIncludeDumbPath, smartPaths));
      finalPaths = _.uniq(finalPaths);
      finalPaths.sort();
      if (global.argOpts.debug) {
        console.log('\nZip files:');
        finalPaths.map(filePath => console.log(`  ${filePath}`));
        console.log('');
      }
      return finalPaths;
    })
    .then((paths) => {
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

        paths.forEach(function (filePath) {
          var basePath = path.dirname(filePath);
          if (basePath === '.') {
            basePath = undefined;
          }
          var name = path.join(dir, filePath);
          zip.file(name, {name: filePath});
        });

        zip.finalize();
      });
    });
};

// Similar to utils.appCommand, but given a ready to go app
// with a different location and ready to go zapierwrapper.js.
const _appCommandZapierWrapper = (dir, event) => {
  const app = require(`${dir}/zapierwrapper.js`);
  event = Object.assign({}, event, {
    calledFromCli: true,
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

const build = (zipPath, wdir) => {
  wdir = wdir || process.cwd();
  zipPath = zipPath || constants.BUILD_PATH;
  const osTmpDir = fse.realpathSync(os.tmpdir());
  const tmpDir = path.join(osTmpDir, 'zapier-' + crypto.randomBytes(4).toString('hex'));

  return ensureDir(tmpDir)
    .then(() => ensureDir(constants.BUILD_DIR))
    .then(() => {
      printStarting('Copying project to temp directory');

      let filter;
      if (process.env.SKIP_NPM_INSTALL) {
        filter = (dir) => {
          const isntBuild = dir.indexOf('.zip') === -1;
          return isntBuild;
        };
      }
      return copyDir(wdir, tmpDir, {filter});
    })
    .then(() => {
      if (process.env.SKIP_NPM_INSTALL) {
        return {};
      }
      printDone();
      printStarting('Installing project dependencies');
      return runCommand('npm', ['install', '--production'], {cwd: tmpDir});
    })
    .then(() => {
      printDone();
      printStarting('Applying entry point file');
      // TODO: should this routine for include exist elsewhere?
      return readFile(path.join(tmpDir, 'node_modules', constants.PLATFORM_PACKAGE, 'include', 'zapierwrapper.js'))
        .then(zapierWrapperBuf => writeFile(`${tmpDir}/zapierwrapper.js`, zapierWrapperBuf.toString()));
    })
    .then(() => {
      printDone();
      printStarting('Building app definition.json');
      return _appCommandZapierWrapper(tmpDir, {command: 'definition'});
    })
    .then((rawDefinition) => {
      return Promise.all([
        writeFile(`${tmpDir}/definition.json`, prettyJSONstringify(rawDefinition.results)),
        Promise.resolve(rawDefinition.results),
      ]);
    })
    .then(([fileWriteError, rawDefinition]) => {
      if (fileWriteError) {
        if (global.argOpts.debug) {
          console.log('\nFile Write Error:');
          console.log(fileWriteError);
          console.log('');
        }
        throw new Error(`Unable to write ${tmpDir}/definition.json, please check file permissions!`);
      }

      printDone();
      printStarting('Validating project');

      return Promise.all([
        _appCommandZapierWrapper(tmpDir, {command: 'validate'}),
        Promise.resolve(rawDefinition),
      ]);
    })
    .then(([validateResponse, rawDefinition]) => {
      const errors = validateResponse.results;
      if (errors.length) {
        return Promise.resolve({
          errors: {
            validation: errors,
          },
        });
      }

      // No need to mention specifically we're validating style checks as that's
      //   implied from `zapier validate`, though it happens as a separate process

      return callAPI('/style-check', {
        skipDeployKey: true,
        method: 'POST',
        body: rawDefinition,
      });
    })
    .then((styleChecksResponse) => {
      const errors = styleChecksResponse.errors;
      if (!_.isEmpty(errors)) {
        throw new Error('We hit some validation errors, try running `zapier validate` to see them!');
      }

      printDone();
      printStarting('Zipping project and dependencies');
      return makeZip(tmpDir, wdir + path.sep + zipPath);
    })
    .then(() => {
      // tries to do a reproducible build at least
      // https://blog.pivotal.io/labs/labs/barriers-deterministic-reproducible-zip-files
      // https://reproducible-builds.org/tools/ or strip-nondeterminism
      printDone();
      printStarting('Testing build');

      if (isWindows()) {
        return {}; // TODO err, what should we do on windows?
      }
      return runCommand('find', ['.', '-exec', 'touch', '-t', '201601010000', '{}', '+'], {cwd: tmpDir});
    })
    .then(() => {
      printDone();
      printStarting('Cleaning up temp directory');
      return removeDir(tmpDir);
    })
    .then(() => {
      printDone();
      return zipPath;
    });
};

const buildAndUploadDir = (zipPath, appDir) => {
  zipPath = zipPath || constants.BUILD_PATH;
  appDir = appDir || '.';
  return checkCredentials()
    .then(() => {
      return build(zipPath, appDir);
    })
    .then(() => {
      return upload(zipPath, appDir);
    });
};

module.exports = {
  build,
  buildAndUploadDir,
  listFiles,
  requiredFiles,
};
