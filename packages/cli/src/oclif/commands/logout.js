const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');

const { callAPI } = require('../../utils/api');
const { deleteFile } = require('../../utils/files');
const { AUTH_LOCATION, AUTH_LOCATION_RAW } = require('../../constants');

class LogoutCommand extends BaseCommand {
  async perform() {
    let success = true;
    this.startSpinner('Deactivating local deploy key');
    try {
      await callAPI('/keys', { method: 'DELETE', body: { single: true } });
    } catch (e) {
      success = false;
      this.error(
        `Deletion API request failed. Is your ${AUTH_LOCATION} already empty or invalid? If so, feel free to ignore this error.`,
      );
    } finally {
      this.stopSpinner({ success });
    }

    this.startSpinner(`Destroying \`${AUTH_LOCATION}\``);
    const deletedFileResult = deleteFile(AUTH_LOCATION);
    this.debug(`file deletion success?: ${deletedFileResult}`);
    this.stopSpinner();

    this.log();
    this.log('The active deploy key was deactivated');
  }
}

LogoutCommand.flags = buildFlags();
LogoutCommand.description = `Deactivate your active deploy key and reset \`${AUTH_LOCATION_RAW}\`.`;
LogoutCommand.skipValidInstallCheck = true;

module.exports = LogoutCommand;
