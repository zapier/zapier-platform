const _ = require('lodash');

/*
  Turn node style async methods with callbacks into methods that return promises.
  Poor man's version of Bluebird's promisify module. If we start using Bluebird,
  ditch this module.
*/

const promisify = (fn, context) => {
  return (...args) => {
    return new Promise((resolve, reject) => {
      const cb = (err, result) => {
        if (err) {
          reject(err);
        }
        resolve(result);
      };
      fn.apply(context, args.concat(cb));
    });
  };
};

const promisifyAll = (object, context) => {
  return _.reduce(
    object,
    (result, method, name) => {
      if (!name.match(/Sync$/)) {
        result[`${name}Async`] = promisify(method, context);
      }
      result[name] = method;
      return result;
    },
    {},
  );
};

/*
  Promisify white list of method names for an object. Object is passed as
  context (this) when calling. Useful for AWS, where some of the methods
  are dynamic properties not reachable in an each loop.
 */
const promisifySome = (object, methods) => {
  _.each(methods, (name) => {
    if (!name.match(/Sync$/)) {
      object[`${name}Async`] = promisify(object[name], object);
    }
  });
  return object;
};

module.exports = {
  promisify,
  promisifyAll,
  promisifySome,
};
