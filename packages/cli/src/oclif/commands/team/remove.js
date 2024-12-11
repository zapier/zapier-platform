const ZapierBaseCommand = require('../../ZapierBaseCommand');
const { cyan } = require('colors/safe');
const { buildFlags } = require('../../buildFlags');
const { callAPI, getWritableApp } = require('../../../utils/api');
const { BASE_ENDPOINT } = require('../../../constants');
const { listTeamMembers, transformUserRole } = require('../../../utils/team');

class TeamRemoveCommand extends ZapierBaseCommand {
  async perform() {
    this.startSpinner('Loading team members');
    const { admins, limitedCollaborators, subscribers } =
      await listTeamMembers();

    const choices = [...admins, ...limitedCollaborators, ...subscribers].map(
      ({ status, name, role, email, id }) => ({
        status,
        value: { id, email, role: transformUserRole(role) },
        name: `${email} (${transformUserRole(role)})`,
        short: email,
      }),
    );

    this.stopSpinner();

    const {
      role,
      email,
      id: invitationId,
    } = await this.promptWithList(
      'Which team member do you want to remove?',
      choices,
    );
    this.log();
    if (
      !(await this.confirm(
        `About to revoke ${cyan(role)}-level access from ${cyan(
          email,
        )}. Are you sure?`,
        true,
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
      body: { email_id: invitationId },
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
TeamRemoveCommand.skipValidInstallCheck = true;

module.exports = TeamRemoveCommand;
