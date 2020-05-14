const ZapierBaseCommand = require('../../ZapierBaseCommand');
// const { flags } = require('@oclif/command');
const { cyan } = require('colors/safe');
const { buildFlags } = require('../../buildFlags');
const { callAPI } = require('../../../utils/api');

const inviteMessage = (roleIsAdmin, title) =>
  roleIsAdmin
    ? `I would like you to help manage ${title}'s Zapier integration and get access to see how it's performing.`
    : `I would like you to get reports and updates about ${title}'s Zapier integration.`;

class TeamAddCommand extends ZapierBaseCommand {
  async perform() {
    const { id, title } = await this.getWritableApp();

    const roleIsAdmin = this.args.role === 'admin';
    const message = this.args.message || inviteMessage(roleIsAdmin, title);

    if (
      !this.flags.force &&
      !(await this.confirm(
        `About to invite ${cyan(this.args.email)} to as a team member at the ${
          this.args.role
        } level. An email will be sent with the following message:\n\n"${message}"\n\nIs that ok?`,
        true
      ))
    ) {
      this.log('\ncancelled');
      return;
    }

    this.startSpinner('Inviting team member');

    const url = roleIsAdmin
      ? `/apps/${id}/collaborators`
      : `https://zapier.com/api/platform/v3/integrations/${id}/subscribers`;
    await callAPI(url, {
      url: url.startsWith('http') ? url : undefined,
      method: 'POST',
      body: { email: this.args.email, message },
    });
    this.stopSpinner();
  }
}

TeamAddCommand.args = [
  {
    name: 'email',
    description:
      "The user to be invited. If they don't have a Zapier account, they'll be prompted to create one.",
    required: true,
  },
  {
    name: 'role',
    description:
      'The level the invited team member should be at. Admins can edit everything and get email updates. Subscribers only get email updates.',
    options: ['admin', 'subscriber'],
    required: true,
  },
  {
    name: 'message',
    description:
      'A message sent in the email to your team member, if you need to provide context. Wrap the message in quotes to ensure spaces get saved.',
  },
];
TeamAddCommand.flags = buildFlags();
TeamAddCommand.description = `Add a team member to your integration.

These users come in two levels:

  * \`admin\`, who can edit everything about the integration
  * \`subscriber\`, who can't directly access the app, but will receive periodic email updates. These updates include quarterly health socores and more.

Team members can be freely added and removed.`;

TeamAddCommand.examples = [
  'zapier team:add bruce@wayne.com admin',
  'zapier team:add alfred@wayne.com subscriber "Hey Alfred, check out this app."',
];
TeamAddCommand.aliases = ['team:invite'];

module.exports = TeamAddCommand;
