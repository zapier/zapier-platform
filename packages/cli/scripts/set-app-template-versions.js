#!/usr/bin/env node

const _ = require('lodash');
const path = require('path');
const tmp = require('tmp');
const { promisifyAll } = require('../src/utils/promisify');
const appTemplates = require('../src/app-templates');
const versionStore = require('../src/version-store');

const fse = require('fs-extra');
const semver = require('semver');
const yaml = require('yamljs');
const childProcess = promisifyAll(require('child_process'));

const CLONE_URL_PREFIX = 'git@github.com:zapier/zapier-platform-example-app';
const PACKAGES_NAMES = 'node, npm, and zapier-platform-core';
let packagesVersions;

const newCoreVersion = process.argv[2];
if (!newCoreVersion) {
  console.error('Usage: npm run set-template-version [NEW_CORE_VERSION]');
  /* eslint no-process-exit: 0 */
  process.exit(1);
}

const newVersions = versionStore[semver.parse(newCoreVersion).major];
newVersions.coreVersion = newCoreVersion;

const exec = (cmd, cwd) => {
  return new Promise((resolve, reject) => {
    childProcess.exec(cmd, { cwd }, (err) => {
      if (err) {
        console.error('error:', err);
        reject(err);
      }
      resolve();
    });
  });
};

const hasCurrentVersions = (newVersion, travisNodeVersion, packageJson) => {
  return (
    packageJson.dependencies['zapier-platform-core'] ===
      newVersion.coreVersion &&
    packageJson.engines.node === newVersion.nodeVersion &&
    packageJson.engines.npm === newVersion.npmVersion &&
    travisNodeVersion === newVersion.nodeVersion
  );
};

const setVersion = (template, rootTmpDir) => {
  const repoName = `zapier-platform-example-app-${template}`;
  const repoDir = path.resolve(rootTmpDir, repoName);
  const cloneUrl = `${CLONE_URL_PREFIX}-${template}`;
  var cmd = `git clone ${cloneUrl}`;
  packagesVersions = `${newVersions.nodeVersion}, ${newVersions.npmVersion}, and ${newVersions.coreVersion}`;

  console.log(
    `Setting versions of ${PACKAGES_NAMES} to ${packagesVersions} respectively in ${template} app template.`,
  );
  console.log(`cloning ${cloneUrl}\n`);

  return exec(cmd, rootTmpDir)
    .then(() => {
      const packageJsonFile = path.resolve(
        rootTmpDir,
        `${repoName}/package.json`,
      );
      const packageJson = require(packageJsonFile);

      const travisYamlFile = path.resolve(
        rootTmpDir,
        `${repoName}/.travis.yml`,
      );
      const travisYaml = yaml.load(travisYamlFile);

      if (hasCurrentVersions(newVersions, travisYaml.node_js[0], packageJson)) {
        return 'skip';
      }

      packageJson.dependencies['zapier-platform-core'] =
        newVersions.coreVersion;
      packageJson.engines.node = newVersions.nodeVersion;
      packageJson.engines.npm = newVersions.npmVersion;
      const json = JSON.stringify(packageJson, null, 2);
      fse.writeFileSync(packageJsonFile, json);

      travisYaml.node_js[0] = newVersions.nodeVersion;
      return fse.writeFile(travisYamlFile, yaml.stringify(travisYaml, null, 2));
    })
    .then((result) => {
      if (result === 'skip') {
        return result;
      }

      cmd = `git commit package.json .travis.yml -m "update ${PACKAGES_NAMES} versions to ${packagesVersions} respectively."`;
      return exec(cmd, repoDir);
    })
    .then((result) => {
      if (result === 'skip') {
        return result;
      }

      cmd = 'git push origin master';
      return exec(cmd, repoDir);
    })
    .then((result) => {
      if (result === 'skip') {
        console.log(
          `${template} is already set to ${packagesVersions} for ${PACKAGES_NAMES} respectively, skipping`,
        );
        return 'skip';
      }
      console.log(
        `Set ${PACKAGES_NAMES} versions to ${packagesVersions} respectively on app template ${template} successfully.`,
      );
      return null;
    })
    .catch((err) => {
      console.error(
        `Error setting ${PACKAGES_NAMES} versions for app template ${template}:`,
        err,
      );
      return template;
    });
};

const rootTmpDir = tmp.tmpNameSync();
fse.removeSync(rootTmpDir);
fse.ensureDirSync(rootTmpDir);

const tasks = _.map(appTemplates, (template) =>
  setVersion(template, rootTmpDir),
);

Promise.all(tasks).then((results) => {
  const failures = _.filter(
    results,
    (result) => result !== null && result !== 'skip',
  );
  const skipped = _.filter(results, (result) => result === 'skip');
  const successCount = tasks.length - failures.length - skipped.length;

  if (failures.length) {
    console.error(
      `failed to set ${PACKAGES_NAMES} versions on these templates:`,
      failures.join(', '),
    );
  }
  if (skipped.length) {
    console.log(
      `skipped ${skipped.length} templates because versions for ${PACKAGES_NAMES} were already set to ${packagesVersions} respectively`,
    );
  }
  if (successCount) {
    console.log(
      `Successfully updated versions in ${successCount} app templates`,
    );
  }
});
