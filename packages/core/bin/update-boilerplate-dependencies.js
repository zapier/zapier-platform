#!/usr/bin/env node

const fs = require('fs');

const corePackageJson = require('zapier-platform-core/package.json');
const lsrPackageJson = require('zapier-platform-legacy-scripting-runner/package.json');

const isVersion = s => s && process.argv[2].match(/^\d+\.\d+\.\d+$/);

// Read from ../, write to ./
const boilerplatePackageJsonPath = './boilerplate/package.json';

const boilerplatePackageJson = require(`.${boilerplatePackageJsonPath}`);

let coreVersionToSet = corePackageJson.version;
let lsrVersionToSet = lsrPackageJson.version;

if (process.argv.length === 3) {
  if (process.argv[2] === 'revert') {
    coreVersionToSet = 'PLACEHOLDER';
    lsrVersionToSet = 'PLACEHOLDER';
  } else if (isVersion(process.argv[2])) {
    coreVersionToSet = process.argv[2];
  } else {
    const timestamp = process.argv[2];
    coreVersionToSet = `file:./core-${timestamp}.tgz`;
    lsrVersionToSet = `file:./legacy-scripting-runner-${timestamp}.tgz`;
  }
}

// Update dep versions
boilerplatePackageJson.dependencies['zapier-platform-core'] = coreVersionToSet;
boilerplatePackageJson.dependencies[
  'zapier-platform-legacy-scripting-runner'
] = lsrVersionToSet;

fs.writeFileSync(
  boilerplatePackageJsonPath,
  JSON.stringify(boilerplatePackageJson, null, '  ') + '\n'
);
