const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');

const { callAPI } = require('../../utils/api');
const { deleteFile } = require('../../utils/files');
const { AUTH_LOCATION, AUTH_LOCATION_RAW } = require('../../constants');

class LogoutCommand extends BaseCommand {
  async perform() {
    this.log(
      'Preparing to deactivate local deploy key and reset local configs.'
    );
    this.startSpinner('Deactivating local deploy key');
    try {
      await callAPI('/keys', { method: 'DELETE', body: { single: true } });
    } catch (e) {
      this.warn(
        'Deletion API request failed. If this is unexpected, rerun this command with `--debug` for more info.'
      );
    }
    this.stopSpinner();

    this.startSpinner(`Destroying \`${AUTH_LOCATION_RAW}\``);
    const success = deleteFile(AUTH_LOCATION);
    this.debug(`file deletion success?: ${success}`);
    this.stopSpinner();

    this.log('The active deploy key was deactivated');
  }
}

LogoutCommand.flags = buildFlags({ opts: { format: true } });
LogoutCommand.examples = ['zapier logout'];
LogoutCommand.description = `Deactivates your acive deploy key and resets \`${AUTH_LOCATION_RAW}\`.`;

module.exports = LogoutCommand;
