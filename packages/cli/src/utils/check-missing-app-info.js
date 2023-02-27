module.exports = (app) => {
  if (app.intention && app.intention !== 'private') {
    return false;
  }
  const requiredFields = [
    'title',
    'description',
    'app_category',
    'intention',
    'role',
  ];
  const missingRequiredFields = requiredFields.filter(
    (field) => app[field] == null
  );
  if (missingRequiredFields.length) {
    throw new Error(
      `Your integration is missing required info (${missingRequiredFields.join(
        ', '
      )}). Please, run "zapier register" to add it.`
    );
  }

  return false;
};
