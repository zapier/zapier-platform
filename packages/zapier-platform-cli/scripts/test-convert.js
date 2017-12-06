#!/usr/bin/env node

const _ = require('lodash');
const path = require('path');
const tmp = require('tmp');
const utils = require('../lib/utils');

const fse = require('fs-extra');
const childProcess = utils.promisifyAll(require('child_process'));

const appsToConvert = [
  {id: 80082, name: 'simple-basic-auth'},
  {id: 80182, name: 'trigger-session-auth'},
  {id: 82052, name: 'simple-oauth'},
  {id: 82250, name: 'search-oauth'},
  {id: 82251, name: 'basic-api-header'},
  {id: 82460, name: 'custom-fields'},
  // TODO: Add more apps that use different scripting methods, as we start to support them
];

const testConvertedApp = (appToConvert, rootTmpDir) => {
  const zapierCmd = path.resolve(__dirname, '../zapier.js');
  // Prepare all env variables the apps might need
  const exportCmd = 'export CLIENT_ID=1234 CLIENT_SECRET=asdf USERNAME=user PASSWORD=passwd API_KEY=anything-goes ACCESS_TOKEN=a_token REFRESH_TOKEN=a_refresh_token';

  const logFile = path.resolve(__dirname, '..', `${appToConvert.name}.log`);
  const logStream = fse.createWriteStream(logFile);

  console.log(`Converting and testing ${appToConvert.name}, writing logs to ${logFile}`);
  return fse.ensureFile(logFile)
    .then(() => {
      return new Promise((resolve, reject) => {
        const cmd = `${zapierCmd} convert ${appToConvert.id} ${appToConvert.name} --debug && cd ${appToConvert.name} && npm install && ${zapierCmd} validate && ${exportCmd} && ${zapierCmd} test --timeout=10000`;
        const child = childProcess.exec(cmd, {cwd: rootTmpDir}, err => {
          if (err) {
            console.log('error starting child process:', err);
            reject(err);
          }
          resolve();
        });
        child.stdout.pipe(logStream);
        child.stderr.pipe(logStream);
      });
    })
    .then(() => {
      console.log(`${appToConvert.name} converted successfully`);
      return null;
    })
    .catch(() => {
      console.error(`${appToConvert.name} conversion failed. See ${logFile}.`);
      return appToConvert.name;
    });
};

global.argOpts = {};

const rootTmpDir = tmp.tmpNameSync();
fse.removeSync(rootTmpDir);
fse.ensureDirSync(rootTmpDir);

const tasks = _.map(appsToConvert, template => testConvertedApp(template, rootTmpDir));

Promise.all(tasks)
  .then(results => {
    const failures = _.filter(results, result => result !== null);
    if (failures.length) {
      console.error('these apps failed conversion:', failures.join(', '));
    } else {
      console.log('apps converted successfully');
    }
  });
