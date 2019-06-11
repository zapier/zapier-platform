#!/usr/bin/env node

const fs = require('fs');
const corePackageJson = require('../package.json');

let lsrPackageJson;
try {
  // Optional dependency
  lsrPackageJson = require('../node_modules/zapier-platform-legacy-scripting-runner/package.json');
} catch (err) {
  // Do nothing
}

// Read from ../, write to ./
const boilerplatePackageJsonPath = './boilerplate/package.json';
const boilerplateDefinitionJsonPath = './boilerplate/definition.json';

const boilerplatePackageJson = require(`.${boilerplatePackageJsonPath}`);
const boilerplateDefinitionJson = require(`.${boilerplateDefinitionJsonPath}`);

let coreVersionToSet = corePackageJson.version;
let lsrVersionToSet;

if (process.argv.length === 3) {
  if (process.argv[2] === 'debug') {
    coreVersionToSet = `file:../zapier-platform-core-${
      corePackageJson.version
    }.tgz`;

    if (lsrPackageJson) {
      lsrVersionToSet = `file:../node_modules/zapier-platform-legacy-scripting-runner/zapier-platform-legacy-scripting-runner-${
        lsrPackageJson.version
      }.tgz`;
    }
  } else if (process.argv[2] === 'revert') {
    coreVersionToSet = 'CORE_PLATFORM_VERSION';

    if (lsrPackageJson) {
      lsrVersionToSet = lsrPackageJson.version;
    }
  }
}

// Update version
boilerplatePackageJson.dependencies['zapier-platform-core'] = coreVersionToSet;
boilerplateDefinitionJson.platformVersion = coreVersionToSet;

if (lsrVersionToSet) {
  boilerplatePackageJson.dependencies[
    'zapier-platform-legacy-scripting-runner'
  ] = lsrVersionToSet;
}

fs.writeFileSync(
  boilerplatePackageJsonPath,
  JSON.stringify(boilerplatePackageJson, null, '  ') + '\n'
);
fs.writeFileSync(
  boilerplateDefinitionJsonPath,
  JSON.stringify(boilerplateDefinitionJson, null, '  ') + '\n'
);
