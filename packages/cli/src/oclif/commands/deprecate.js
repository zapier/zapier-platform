const BaseCommand = require('../ZapierBaseCommand');
const { Args } = require('@oclif/core');
const { buildFlags } = require('../buildFlags');

const { callAPI } = require('../../utils/api');

class DeprecateCommand extends BaseCommand {
  async perform() {
    const app = await this.getWritableApp();
    const { version, date } = this.args;
    this.log(
      `Preparing to deprecate version ${version} your app "${app.title}".\n`,
    );
    const url = `/apps/${app.id}/versions/${version}/deprecate`;
    this.startSpinner(`Deprecating ${version}`);
    await callAPI(url, {
      method: 'PUT',
      body: {
        deprecation_date: date,
      },
    });
    this.stopSpinner();
    this.log(
      `\nWe'll let users know that this version is no longer recommended and will cease to work on ${date}.`,
    );
  }
}

DeprecateCommand.flags = buildFlags();
DeprecateCommand.args = {
  version: Args.string({
    description: 'The version to deprecate.',
    required: true,
  }),
  date: Args.string({
    description:
      'The date (YYYY-MM-DD) when Zapier will make the specified version unavailable.',
    required: true,
  }),
};
DeprecateCommand.examples = ['zapier deprecate 1.2.3 2011-10-01'];
DeprecateCommand.description = `Mark a non-production version of your integration as deprecated, with removal by a certain date.

Use this when an integration version will not be supported or start breaking at a known date.

Zapier will send an email warning users of the deprecation once a date is set, they'll start seeing it as "Deprecated" in the UI, and once the deprecation date arrives, if the Zaps weren't updated, they'll be paused and the users will be emailed again explaining what happened.

After the deprecation date has passed it will be safe to delete that integration version.

Do not use this if you have non-breaking changes, such as fixing help text.`;
DeprecateCommand.skipValidInstallCheck = true;

module.exports = DeprecateCommand;
