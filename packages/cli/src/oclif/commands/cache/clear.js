const BaseCommand = require('../../ZapierBaseCommand');
const { Args } = require('@oclif/core');
const { buildFlags } = require('../../buildFlags');
const { listVersions, getWritableApp, callAPI } = require('../../../utils/api');
const { cyan } = require('colors/safe');

class ClearCacheCommand extends BaseCommand {
  async perform() {
    this.startSpinner('Fetching versions...');
    const { versions } = await listVersions();
    this.stopSpinner();

    const { majorVersion } = this.args;

    let selectedMajorVersion = majorVersion ? Number(majorVersion) : null;
    if (Number.isNaN(selectedMajorVersion)) {
      throw new Error(
        `Invalid major version '${majorVersion}'. Must be a number.`,
      );
    }

    const majorVersions = [
      ...new Set(
        versions.map((appVersion) => Number(appVersion.version.split('.')[0])),
      ),
    ];
    // Finds the current version in package.json.
    const currentVersion = await require(`${process.cwd()}/package.json`)
      .version;

    if (selectedMajorVersion === null) {
      selectedMajorVersion = await this._promptForMajorVersionSelection(
        majorVersions,
        currentVersion,
      );
    } else {
      if (!majorVersions.includes(selectedMajorVersion)) {
        throw new Error(
          `This integration does not have any versions on major version '${selectedMajorVersion}'. Valid versions are: ${majorVersions.join(
            ', ',
          )}`,
        );
      }
    }

    if (
      !(await this.confirm(
        `Are you sure you want to clear all cache data for major version '${cyan(
          selectedMajorVersion,
        )}'?`,
        true,
      ))
    ) {
      this.log('\ncancelled');
      return;
    }

    this.startSpinner('Clearing cache');
    const { id: appId } = await getWritableApp();
    const url = `/apps/${appId}/major-versions/${selectedMajorVersion}/cache`;

    await callAPI(url, { method: 'DELETE' });

    this.stopSpinner();

    this.log('Ok! Job is queued.');
  }

  /**
   * Prompts user to select a major version from a list of major versions.
   * @returns { majorVersion: int}
   */
  async _promptForMajorVersionSelection(majorVersions, currentVersion) {
    const currentMajorVersion = Number(currentVersion.split('.')[0]);

    const majorVersionChoices = majorVersions.map((v) => {
      const isCurrentMajorVersion = currentMajorVersion === v;

      return {
        name: `${v}${
          isCurrentMajorVersion ? ` (current version '${currentVersion}')` : ''
        }`,
        value: v,
      };
    });

    return await this.promptWithList(
      "Which major version's cache data would you like to delete?",
      majorVersionChoices,
      { default: currentMajorVersion },
    );
  }
}

ClearCacheCommand.args = {
  majorVersion: Args.string({
    description:
      '(Optional) The cache data will be deleted for this major version. If not provided, you must pick from a list of major versions for this integration.',
    required: false,
  }),
};
ClearCacheCommand.flags = buildFlags();
ClearCacheCommand.description = `Clear the cache data for a major version. 

This command clears the cache data for a major version of your integration.
The job will be run in the background and may take some time to complete.
You can check \`zapier history\` to see the job status.
`;
ClearCacheCommand.examples = [`zapier cache:clear`, `zapier cache:clear 2`];
ClearCacheCommand.skipValidInstallCheck = true;
ClearCacheCommand.hide = true;

module.exports = ClearCacheCommand;
