const ZapierBaseCommand = require('../../ZapierBaseCommand');
const { cyan } = require('colors/safe');
const { buildFlags } = require('../../buildFlags');
const {
  callAPI,
  getWritableApp,
  listEndpointMulti,
} = require('../../../utils/api');
const { BASE_ENDPOINT } = require('../../../constants');

const roleName = (role) =>
  role === 'collaborator'
    ? 'admin'
    : role === 'subscriber'
    ? 'subscriber'
    : 'collaborator';

class TeamRemoveCommand extends ZapierBaseCommand {
  async perform() {
    this.startSpinner('Loading team members');
    const { admins, subscribers, limitedCollaborators } =
      await listEndpointMulti(
        { endpoint: 'collaborators', keyOverride: 'admins' },
        {
          endpoint: (app) =>
            `${BASE_ENDPOINT}/api/platform/v3/integrations/${app.id}/subscribers`,
          keyOverride: 'subscribers',
        },
        {
          endpoint: 'limited_collaborators',
          keyOverride: 'limitedCollaborators',
        }
      );

    const choices = [...admins, ...subscribers, ...limitedCollaborators].map(
      ({ status, name, role, email, id }) => ({
        status,
        value: { id, email, role: roleName(role) },
        name: `${email} (${roleName(role)})`,
        short: email,
      })
    );

    this.stopSpinner();

    const {
      role,
      email,
      id: invitationId,
    } = await this.promptWithList(
      'Which team member do you want to remove?',
      choices
    );
    this.log();
    if (
      !(await this.confirm(
        `About to revoke ${cyan(role)}-level access from ${cyan(
          email
        )}. Are you sure?`,
        true
      ))
    ) {
      this.log('\ncancelled');
      return;
    }

    this.startSpinner('Removing Team Member');
    const { id: appId } = await getWritableApp();
    const url =
      role === 'admin'
        ? `/apps/${appId}/collaborators/${invitationId}`
        : role === 'subscriber'
        ? `${BASE_ENDPOINT}/api/platform/v3/integrations/${appId}/subscribers/${invitationId}`
        : `/apps/${appId}/limited_collaborators`;

    await callAPI(url, {
      url: url.startsWith('http') ? url : undefined,
      method: 'DELETE',
      body: { email: this.args.email, email_id: invitationId },
    });

    this.stopSpinner();
  }
}

TeamRemoveCommand.flags = buildFlags();
TeamRemoveCommand.description = `Remove a team member from all versions of your integration.

Admins will immediately lose write access to the integration.
Collaborators will immediately lose read access to the integration.
Subscribers won't receive future email updates.`;

TeamRemoveCommand.aliases = ['team:delete'];

module.exports = TeamRemoveCommand;
