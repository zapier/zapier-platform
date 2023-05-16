const _ = require('lodash');

const isJSONEncodable = (obj) => {
  if (obj === null || _.isBoolean(obj) || _.isNumber(obj) || _.isString(obj)) {
    return true;
  }

  if (!_.isPlainObject(obj) && !_.isArray(obj)) {
    return false;
  }

  for (const key in obj) {
    if (!isJSONEncodable(obj[key])) {
      return false;
    }
  }

  return true;
};

module.exports = isJSONEncodable;