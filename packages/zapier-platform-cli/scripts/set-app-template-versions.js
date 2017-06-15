#!/usr/bin/env node

const _ = require('lodash');
const path = require('path');
const tmp = require('tmp');
const utils = require('../lib/utils');
const appTemplates = require('../lib/app-templates');

const fse = require('fs-extra');
const childProcess = utils.promisifyAll(require('child_process'));

const CLONE_URL_PREFIX = 'git@github.com:zapier/zapier-platform-example-app';

const newVersion = process.argv[2];
if (!newVersion) {
  console.error('Usage: npm run set-template-version [NEW_CORE_VERSION]');
  /*eslint no-process-exit: 0 */
  process.exit(1);
}

const exec = (cmd, cwd) => {
  return new Promise((resolve, reject) => {
    childProcess.exec(cmd, {cwd}, err => {
      if (err) {
        console.error('error:', err);
        reject(err);
      }
      resolve();
    });
  });
};

const setVersion = (template, rootTmpDir) => {
  const repoName = `zapier-platform-example-app-${template}`;
  const repoDir = path.resolve(rootTmpDir, repoName);
  const cloneUrl = `${CLONE_URL_PREFIX}-${template}`;
  var cmd = `git clone ${cloneUrl}`;

  console.log(`Setting zapier-platform-core version to ${newVersion} in ${template} app template.`);
  console.log(`cloning ${cloneUrl}\n`);

  return exec(cmd, rootTmpDir)
    .then(() => {
      const packageJsonFile = path.resolve(rootTmpDir, `${repoName}/package.json`);
      const packageJson = require(packageJsonFile);

      if (packageJson.dependencies['zapier-platform-core'] === newVersion) {
        return 'skip';
      }

      packageJson.dependencies['zapier-platform-core'] = newVersion;
      const json = JSON.stringify(packageJson, null, 2);
      fse.writeFileSync(packageJsonFile, json);
    })
    .then(result => {
      if (result === 'skip') {
        return result;
      }

      cmd = `git commit package.json -m "update zapier-platform-core version to ${newVersion}"`;
      return exec(cmd, repoDir);
    })
    .then(result => {
      if (result === 'skip') {
        return result;
      }

      cmd = 'git push origin master';
      return exec(cmd, repoDir);
    })
    .then(result => {
      if (result === 'skip') {
        console.log(`${template} is already set to ${newVersion}, skipping`);
        return 'skip';
      }
      console.log(`Set core version to ${newVersion} on app template ${template} successfully.`);
      return null;
    })
    .catch(err => {
      console.error(`Error setting core version for app template ${template}:`, err);
      return template;
    });
};

const rootTmpDir = tmp.tmpNameSync();
fse.removeSync(rootTmpDir);
fse.ensureDirSync(rootTmpDir);

const tasks = _.map(appTemplates, template => setVersion(template, rootTmpDir));

Promise.all(tasks)
  .then(results => {
    const failures = _.filter(results, result => result !== null && result !== 'skip');
    const skipped = _.filter(results, result => result === 'skip');
    const successCount = tasks.length - failures.length - skipped.length;

    if (failures.length) {
      console.error('failed to set core version on these templates:', failures.join(', '));
    }
    if (skipped.length) {
      console.log(`skipped ${skipped.length} templates because version was already set to ${newVersion}`);
    }
    if (successCount) {
      console.log(`Successfully updated versions in ${successCount} app templates`);
    }
  });
