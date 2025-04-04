const ZapierBaseCommand = require('../../ZapierBaseCommand');
const { cyan } = require('colors/safe');
const { listTeamMembers } = require('../../../utils/team');
const { buildFlags } = require('../../buildFlags');
const { transformUserRole } = require('../../../utils/team');

class TeamListCommand extends ZapierBaseCommand {
  async perform() {
    this.startSpinner('Loading team members');
    const { admins, limitedCollaborators, subscribers } =
      await listTeamMembers();
    this.stopSpinner();

    const cleanedUsers = [
      ...admins,
      ...limitedCollaborators,
      ...subscribers,
    ].map(({ status, name, role, email }) => ({
      status,
      name,
      role: transformUserRole(role),
      email,
    }));

    this.logTable({
      rows: cleanedUsers,
      headers: [
        ['Name', 'name'],
        ['Role', 'role'],
        ['Status', 'status'],
        ['Email', 'email'],
      ],
    });

    this.log(
      `To invite more team members, use the \`${cyan(
        'zapier team:add',
      )}\` command.`,
    );
  }
}

TeamListCommand.flags = buildFlags({ opts: { format: true } });
TeamListCommand.description = `Get team members involved with your integration.

These users come in three levels:

  * \`admin\`, who can edit everything about the integration
  * \`collaborator\`, who has read-only access for the app, and will receive periodic email updates. These updates include quarterly health scores and more.
  * \`subscriber\`, who can't directly access the app, but will receive periodic email updates. These updates include quarterly health scores and more.

Use the \`zapier team:add\` and \`zapier team:remove\` commands to modify your team.
`;
TeamListCommand.aliases = ['team:list'];
TeamListCommand.skipValidInstallCheck = true;

module.exports = TeamListCommand;
