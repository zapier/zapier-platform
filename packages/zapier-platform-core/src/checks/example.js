'use strict';

/*
  An example checker, we still have lots TODO:
   * compare trigger, search, action result to resource.sample if available
   * validate returned inputFields to schema
   * etc...
*/
const exampleChecker = {
  name: 'exampleChecker',
  shouldRun: (method /*, bundle*/) => {
    return method && true;
  },
  run: (method, results) => {
    if (results) {
      // could return ['Bad thing!'];
      return [];
    }
    return [];
  }
};

module.exports = exampleChecker;
