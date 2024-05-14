const _ = require('lodash');

const performBulkEchoesIds = {
  name: 'performBulkReturnType',

  shouldRun: (method) => {
    return (
      method.endsWith('.operation.performBulk') && method.startsWith('creates.')
    );
  },

  run: (method, results, compiledApp, bundle) => {
    if (!Array.isArray(bundle.bulk)) {
      // Should not happen, but we don't want this check to break because of a bad
      // input bundle either
      return [];
    }

    if (!_.isPlainObject(results)) {
      // create-is-object should have caught this
      return [];
    }

    const inputIds = bundle.bulk
      .map((b) => {
        return b && b.meta ? b.meta.id : null;
      })
      .filter((id) => id);

    const outputIds = Object.keys(results);
    const missingIds = inputIds.filter((id) => !outputIds.includes(id));

    if (missingIds.length > 0) {
      return [
        `Result object must have these IDs as keys: ${inputIds.join(', ')}; ` +
          `missing IDs: ${missingIds.join(', ')}.`,
      ];
    }

    const errors = [];
    for (const [id, item] of results.entries()) {
      if (!_.isPlainObject(item)) {
        errors.push(`Result object member with ID '${id}' must be an object`);
      } else if (!_.isPlainObject(item.outputData)) {
        errors.push(
          `Result object member with ID '${id}' must have 'outputData' object`
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

module.exports = performBulkEchoesIds;
