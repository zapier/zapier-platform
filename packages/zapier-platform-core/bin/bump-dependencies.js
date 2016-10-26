#!/usr/bin/env node

const fs = require('fs');

const packageJson = require('../package.json');

packageJson.dependencies['zapier-platform-schema'] = packageJson.version;

fs.writeFile('./package.json', JSON.stringify(packageJson, null, '  ') + '\n');
