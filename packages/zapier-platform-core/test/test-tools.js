'use strict';

require('should');

const createAppTester = require('../src/tools/create-app-tester');
const appDefinition = require('./userapp');

describe('test-tools', () => {
  const appTester = createAppTester(appDefinition);

  it('should run explicit path', (done) => {
    appTester(appDefinition.resources.list.list.operation.perform)
      .then(results => {
        results.should.eql([{id: 1234}, {id: 5678}]);
        done();
      })
      .catch(done);
  });

});
