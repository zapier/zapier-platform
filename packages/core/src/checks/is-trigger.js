module.exports = (method) => {
  return (
    // `method` will never start with "resources." in production.
    // Seems only for testing.
    (method.startsWith('triggers.') && method.endsWith('.operation.perform')) ||
    (method.startsWith('resources.') &&
      method.endsWith('.list.operation.perform'))
  );
};
