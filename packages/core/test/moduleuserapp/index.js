'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});

const _authentication = require('./authentication');

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  } else {
    const newObj = {};
    if (obj != null) {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          newObj[key] = obj[key];
        }
      }
    }
    newObj.default = obj;
    return newObj;
  }
}

const authentication = _interopRequireWildcard(_authentication);

exports.default = {
  authentication,
};

module.exports = exports['default']; // eslint-disable-line
