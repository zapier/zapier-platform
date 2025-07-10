// Utility functions that helps you copy and delete the Lambda function entry
// point zapierwrapper.mjs or zapierwrapper.js to the integration directory.

const { existsSync } = require('node:fs');
const { readFile, writeFile, rm } = require('node:fs/promises');
const { join } = require('node:path');

// We have two different versions of zapierwrapper: the .mjs one for ESM and the
// .js one for CommonJS. To copy the right one, we check the module type in the
// integration's package.json.
//
// For esbuild to perform static analysis, zapierwrapper.mjs can only
// import('packageName') where the packageName must be a static string literal.
// It can't import(packageName) where packageName is a variable. So in
// zapierwrapper.mjs, there's a placeholder {REPLACE_ME_PACKAGE_NAME} that
// we'll replace with the actual package name.
const copyZapierWrapper = async (corePackageDir, appDir) => {
  const appPackageJson = require(join(appDir, 'package.json'));
  let wrapperFilename;
  if (appPackageJson.type === 'module') {
    wrapperFilename = 'zapierwrapper.mjs';
  } else {
    wrapperFilename = 'zapierwrapper.js';
  }
  const wrapperPath = join(corePackageDir, 'include', wrapperFilename);

  if (appPackageJson.type === 'module' && !existsSync(wrapperPath)) {
    throw new Error(
      "Couldn't find zapierwrapper.mjs in zapier-platform-core. Are you trying to run ESM? " +
        'If so, you need to upgrade zapier-platform-core to at least v17.',
    );
  }

  const wrapperText = (await readFile(wrapperPath, 'utf8')).replaceAll(
    '{REPLACE_ME_PACKAGE_NAME}',
    appPackageJson.name,
  );
  const wrapperDest = join(appDir, 'zapierwrapper.js');
  await writeFile(wrapperDest, wrapperText);
  return wrapperDest;
};

const deleteZapierWrapper = async (appDir) => {
  const wrapperPath = join(appDir, 'zapierwrapper.js');
  try {
    await rm(wrapperPath);
  } catch (err) {
    // ignore
  }
};

module.exports = {
  copyZapierWrapper,
  deleteZapierWrapper,
};
