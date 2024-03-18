module.exports = (method) => {
  return (
    // `method` will never start with "resources.". Seems like legacy code.
    (method.startsWith('triggers.') && method.endsWith('.operation.perform')) ||
    (method.startsWith('resources.') &&
      method.endsWith('.list.operation.perform'))
  );
};
