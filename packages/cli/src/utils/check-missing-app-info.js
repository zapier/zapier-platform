const { isPublished } = require('../utils/api');

module.exports = (app) => {
  if (app.status && isPublished(app.status)) {
    return false;
  }
  const requiredFields = [
    { apiName: 'title' },
    { apiName: 'description' },
    { apiName: 'app_category', cliName: 'category' },
    { apiName: 'intention', cliName: 'audience' },
    { apiName: 'role' },
  ];
  const missingRequiredFields = requiredFields.filter(
    (field) => app[field.apiName] == null,
  );
  if (missingRequiredFields.length) {
    throw new Error(
      `Your integration is missing required info (${missingRequiredFields
        .map((field) => field.cliName ?? field.apiName)
        .join(', ')}). Please, run "zapier register" to add it.`,
    );
  }

  return false;
};
