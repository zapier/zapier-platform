const BaseCommand = require('../../ZapierBaseCommand');
const { buildFlags } = require('../../buildFlags');
const { listVersions, getWritableApp, callAPI } = require('../../../utils/api');
const { cyan } = require('colors/safe');

class ClearCacheCommand extends BaseCommand {
  async perform() {
    this.startSpinner('Fetching versions...');
    const { versions } = await listVersions();
    this.stopSpinner();

    const { majorVersion } = this.args;

    let selectedMajorVersion =
      majorVersion === '' ? null : Number(majorVersion);

    const majorVersions = [
      ...new Set(
        versions.map((appVersion) => Number(appVersion.version.split('.')[0]))
      ),
    ];
    // Finds the current version in package.json.
    const currentVersion = await require(`${process.cwd()}/package.json`)
      .version;

    if (selectedMajorVersion === null) {
      selectedMajorVersion = await this._promptForMajorVersionSelection(
        majorVersions,
        currentVersion
      );
    } else {
      if (!majorVersions.includes(selectedMajorVersion)) {
        throw new Error(
          `This app does not have any versions on major version '${selectedMajorVersion}'. Valid versions are: ${majorVersions.join(
            ', '
          )}`
        );
      }
    }

    if (
      !(await this.confirm(
        `Are you sure you want to clear the app cache for major version '${cyan(
          selectedMajorVersion
        )}'?`,
        true
      ))
    ) {
      this.log('\ncancelled');
      return;
    }

    this.startSpinner('Clearing cache');
    const { id: appId } = await getWritableApp();
    const url = `/apps/${appId}/major-versions/${selectedMajorVersion}/cache`;

    await callAPI(url, {
      url: url.startsWith('http') ? url : undefined,
      method: 'DELETE',
    });

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
      'Which major version app cache would you like to delete?',
      majorVersionChoices,
      { default: currentMajorVersion }
    );
  }
}

ClearCacheCommand.args = [
  {
    name: 'majorVersion',
    description:
      '(Optional) The app cache will be deleted for this major version. If not provided, you must pick from a list of major versions for this app.',
    required: false,
  },
];
ClearCacheCommand.flags = buildFlags();
ClearCacheCommand.description = `Clears the app cache for a major version. 

The cache will be cleared for all app versions under the given major version.
This command will add a job to the worker queue so it may take some time to complete.
You can check \`zapier history\` to see the high level status of the job.
`;
ClearCacheCommand.examples = [`zapier cache clear`, `zapier cache clear 2`];
ClearCacheCommand.skipValidInstallCheck = true;

module.exports = ClearCacheCommand;
