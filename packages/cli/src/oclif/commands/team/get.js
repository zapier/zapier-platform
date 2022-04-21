const ZapierBaseCommand = require('../../ZapierBaseCommand');
const { cyan } = require('colors/safe');
const { listEndpointMulti } = require('../../../utils/api');
const { buildFlags } = require('../../buildFlags');

class TeamListCommand extends ZapierBaseCommand {
  async perform() {
    this.startSpinner('Loading team members');
    const { admins, limitedCollaborators } = await listEndpointMulti(
      { endpoint: 'collaborators', keyOverride: 'admins' },
      { endpoint: 'limited_collaborators', keyOverride: 'limitedCollaborators' }
    );

    this.stopSpinner();

    const cleanedUsers = [...admins, ...limitedCollaborators].map(
      ({ status, name, role, email }) => ({
        status,
        name,
        role: role === 'collaborator' ? 'admin' : 'collaborator',
        email,
      })
    );

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
        'zapier team:add'
      )}\` command.`
    );
  }
}

TeamListCommand.flags = buildFlags({ opts: { format: true } });
TeamListCommand.description = `Get team members involved with your integration.

These users come in two levels:

  * \`admin\`, who can edit everything about the integration
  * \`collaborator\`, who has read-only access for the app, but will receive periodic email updates. These updates include quarterly health scores and more.

Use the \`zapier team:add\` and \`zapier team:remove\` commands to modify your team.
`;
TeamListCommand.aliases = ['team:list'];

module.exports = TeamListCommand;
