const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');

const { callAPI } = require('../../utils/api');
const { deleteFile } = require('../../utils/files');
const { AUTH_LOCATION, AUTH_LOCATION_RAW } = require('../../constants');

class LogoutCommand extends BaseCommand {
  async perform() {
    let success = true;
    this.log(
      'Preparing to deactivate local deploy key and reset local configs.'
    );
    this.startSpinner('Deactivating local deploy key');
    try {
      await callAPI('/keys', { method: 'DELETE', body: { single: true } });
    } catch (e) {
      success = false;
      this.error(
        `Deletion API request failed. Is your ${AUTH_LOCATION} already empty or invalid? If so, feel free to ignore this error.`
      );
    } finally {
      this.stopSpinner({ success });
    }

    this.startSpinner(`Destroying \`${AUTH_LOCATION}\``);
    const deletedFileResult = deleteFile(AUTH_LOCATION);
    this.debug(`file deletion success?: ${deletedFileResult}`);
    this.stopSpinner();

    this.log('The active deploy key was deactivated');
  }
}

LogoutCommand.flags = buildFlags();
LogoutCommand.examples = ['zapier logout'];
LogoutCommand.description = `Deactivates your acive deploy key and resets \`${AUTH_LOCATION_RAW}\`.`;

module.exports = LogoutCommand;
