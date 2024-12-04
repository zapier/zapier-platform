const _ = require('lodash');

const performBufferEchoesIds = {
  name: 'performBufferReturnType',

  shouldRun: (method, bundle) => {
    return (
      Array.isArray(bundle.buffer) &&
      method.endsWith('.operation.performBuffer') &&
      method.startsWith('creates.')
    );
  },

  run: (method, results, compiledApp, bundle) => {
    if (!_.isPlainObject(results)) {
      // create-is-object should have caught this
      return [];
    }

    const inputIds = bundle.buffer
      .map((b) => {
        return b && b.meta ? b.meta.id : null;
      })
      .filter((id) => id);

    const outputIds = Object.keys(results);
    const missingIds = inputIds.filter((id) => !outputIds.includes(id));

    if (missingIds.length > 0) {
      const LIMIT = 3;
      let missingIdsStr = missingIds.slice(0, LIMIT).join(', ');
      const remainingCount = missingIds.length - LIMIT;
      if (remainingCount > 0) {
        // Don't want to flood the user with too many IDs
        missingIdsStr += `, and ${remainingCount} more`;
      }
      return [`Result object is missing these IDs as keys: ${missingIdsStr}`];
    }

    const errors = [];
    for (const id of inputIds) {
      const item = results[id];

      if (!_.isPlainObject(item)) {
        errors.push(`Result object member with ID '${id}' must be an object`);
      } else if (
        !_.isPlainObject(item.outputData) &&
        typeof item.error !== 'string'
      ) {
        errors.push(
          `Result object member with ID '${id}' must have 'outputData' object or 'error' string`,
        );
      }

      if (errors.length >= 4) {
        // No need to flood the user with too many errors
        break;
      }
    }

    return errors;
  },
};

module.exports = performBufferEchoesIds;
