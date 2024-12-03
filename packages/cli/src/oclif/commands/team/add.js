const ZapierBaseCommand = require('../../ZapierBaseCommand');
const { Args } = require('@oclif/core');
const { cyan } = require('colors/safe');
const { buildFlags } = require('../../buildFlags');
const { callAPI } = require('../../../utils/api');
const { BASE_ENDPOINT } = require('../../../constants');

const inviteMessage = (role, title) => {
  switch (role) {
    case 'admin':
      return `I would like you to help manage ${title}'s Zapier integration and get access to see how it's performing.`;
    case 'collaborator':
      return `I would like you to view ${title}'s Zapier integration and get access to see how it's performing.`;
    case 'subscriber':
      return `I would like you to get reports and updates about ${title}'s Zapier integration.`;
  }
};

class TeamAddCommand extends ZapierBaseCommand {
  async perform() {
    const { id, title } = await this.getWritableApp();

    const role = this.args.role;
    const message = this.args.message || inviteMessage(role, title);

    if (
      !this.flags.force &&
      !(await this.confirm(
        `About to invite ${cyan(this.args.email)} to as a team member at the ${
          this.args.role
        } level. An email will be sent with the following message:\n\n"${message}"\n\nIs that ok?`,
        true,
      ))
    ) {
      this.log('\ncancelled');
      return;
    }

    this.startSpinner('Inviting team member');

    const url =
      role === 'admin'
        ? `/apps/${id}/collaborators`
        : role === 'subscriber'
          ? `${BASE_ENDPOINT}/api/platform/v3/integrations/${id}/subscribers`
          : `/apps/${id}/limited_collaborators`;

    await callAPI(url, {
      url: url.startsWith('http') ? url : undefined,
      method: 'POST',
      body: { email: this.args.email, message },
    });
    this.stopSpinner();
  }
}

TeamAddCommand.args = {
  email: Args.string({
    description:
      "The user to be invited. If they don't have a Zapier account, they'll be prompted to create one.",
    required: true,
  }),
  role: Args.string({
    description:
      'The level the invited team member should be at. Admins can edit everything and get email updates. Collaborators have read-access to the app and get email updates. Subscribers only get email updates.',
    options: ['admin', 'collaborator', 'subscriber'],
    required: true,
  }),
  message: Args.string({
    description:
      'A message sent in the email to your team member, if you need to provide context. Wrap the message in quotes to ensure spaces get saved.',
  }),
};
TeamAddCommand.flags = buildFlags();
TeamAddCommand.description = `Add a team member to your integration.

These users come in three levels:

  * \`admin\`, who can edit everything about the integration
  * \`collaborator\`, who has read-only access for the app, and will receive periodic email updates. These updates include quarterly health scores and more.
  * \`subscriber\`, who can't directly access the app, but will receive periodic email updates. These updates include quarterly health scores and more.

Team members can be freely added and removed.`;

TeamAddCommand.examples = [
  'zapier team:add bruce@wayne.com admin',
  'zapier team:add robin@wayne.com collaborator "Hey Robin, check out this app."',
  'zapier team:add alfred@wayne.com subscriber "Hey Alfred, check out this app."',
];
TeamAddCommand.aliases = ['team:invite'];
TeamAddCommand.skipValidInstallCheck = true;

module.exports = TeamAddCommand;
