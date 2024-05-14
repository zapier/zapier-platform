module.exports = (method) => {
  // `method` will never start with "resources.". Seems like legacy code.
  return (
    (method.startsWith('creates.') &&
      (method.endsWith('.operation.perform') ||
        method.endsWith('.operation.performBulk'))) ||
    (method.startsWith('resources.') &&
      method.endsWith('.create.operation.perform'))
  );
};
