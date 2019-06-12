'use strict';

const ensurePath = (obj, path) => {
  obj = obj || {};
  path.split('.').reduce((coll, key) => {
    coll[key] = coll[key] || {};
    return coll[key];
  }, obj);
  return obj;
};

module.exports = ensurePath;
