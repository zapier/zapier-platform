module.exports = (method) => {
  return (
    (method.startsWith('creates.') && method.endsWith('.operation.perform')) ||
    (method.startsWith('resources.') &&
      method.endsWith('.create.operation.perform'))
  );
};
