'use strict';
const _ = require('lodash');

const findDuplicateFieldKeys = (fields) => {
  const counts = _.countBy(fields, 'key');
  return _.reduce(
    counts,
    (dups, count, key) => {
      if (count > 1) {
        dups.push(key);
      }
      return dups;
    },
    []
  );
};

module.exports = findDuplicateFieldKeys;
