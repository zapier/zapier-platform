#!/usr/bin/env node

const fs = require('fs');
const corePackageJson = require('../package.json');

// Read from ../, write to ./
const boilerplatePackageJsonPath = './boilerplate/package.json';
const boilerplateDefinitionJsonPath = './boilerplate/definition.json';

const boilerplatePackageJson = require(`.${boilerplatePackageJsonPath}`);
const boilerplateDefinitionJson = require(`.${boilerplateDefinitionJsonPath}`);

const versionToSet =
  process.argv.length === 3 && process.argv[2] === 'revert'
    ? 'CORE_PLATFORM_VERSION'
    : corePackageJson.version;

// Update version
boilerplatePackageJson.dependencies['zapier-platform-core'] = versionToSet;
boilerplateDefinitionJson.platformVersion = versionToSet;

fs.writeFileSync(
  boilerplatePackageJsonPath,
  JSON.stringify(boilerplatePackageJson, null, '  ') + '\n'
);
fs.writeFileSync(
  boilerplateDefinitionJsonPath,
  JSON.stringify(boilerplateDefinitionJson, null, '  ') + '\n'
);
