module.exports = (method) => {
  return (
    (method.startsWith('searches.') && method.endsWith('.operation.perform')) ||
    (method.startsWith('resources.') &&
      method.endsWith('.search.operation.perform'))
  );
};
