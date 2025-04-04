const { listEndpointMulti } = require('./api');
const constants = require('../constants');

/**
 * BE: 'collaborator' = FE: 'admin'
 * BE: 'subscriber' = FE: 'subscriber'
 * BE: 'limited_collaborator' = FE: 'collaborator'
 */
const transformUserRole = (role) =>
  role === 'collaborator'
    ? 'admin'
    : role === 'subscriber'
      ? 'subscriber'
      : 'collaborator';

const listTeamMembers = async () => {
  return listEndpointMulti(
    { endpoint: 'collaborators', keyOverride: 'admins' },
    {
      endpoint: 'limited_collaborators',
      keyOverride: 'limitedCollaborators',
    },
    {
      endpoint: (app) =>
        `${constants.BASE_ENDPOINT}/api/platform/v3/integrations/${app.id}/subscribers`,
      keyOverride: 'subscribers',
    },
  );
};
module.exports = {
  listTeamMembers,
  transformUserRole,
};
