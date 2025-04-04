module.exports = (method) => {
  // `method` will never start with "resources." in production.
  // Seems only for testing.
  return (
    (method.startsWith('creates.') &&
      (method.endsWith('.operation.perform') ||
        method.endsWith('.operation.performBuffer'))) ||
    (method.startsWith('resources.') &&
      method.endsWith('.create.operation.perform'))
  );
};
