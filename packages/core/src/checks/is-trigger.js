module.exports = (method) => {
  return (
    (method.startsWith('triggers.') && method.endsWith('.operation.perform')) ||
    (method.startsWith('resources.') &&
      method.endsWith('.list.operation.perform'))
  );
};
