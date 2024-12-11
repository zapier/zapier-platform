#!/usr/bin/env node
/* eslint-disable no-console */

const path = require('path');
const fs = require('fs');
const os = require('os');
const childProcess = require('child_process');

const fullTestRepoUrl =
  'git@github.com:zapier/zapier-platform-app-converted-full-test.git';

const tmpDir = path.join(os.tmpdir(), 'full-test-');
const testTmpDir = fs.mkdtempSync(tmpDir);

const cmd = `npm link && cd ${testTmpDir} && git clone ${fullTestRepoUrl} . && npm install && npm link zapier-platform-legacy-scripting-runner && zapier test`;

console.log('Pulling and testing full-test...');

const child = childProcess.exec(cmd);

child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);
child.on('exit', (code) =>
  console.log(`Finished with code "${code.toString()}"!`),
);
