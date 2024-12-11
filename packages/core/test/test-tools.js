'use strict';

const _ = require('lodash');
const should = require('should');

const createAppTester = require('../src/tools/create-app-tester');
const appDefinition = require('./userapp');

describe('test-tools', () => {
  const appTester = createAppTester(appDefinition);

  it('should run an explicit path', async () => {
    const results = await appTester(
      appDefinition.resources.list.list.operation.perform,
    );
    results.should.eql([{ id: 1234 }, { id: 5678 }]);
  });

  it('should fail to run a string path', () => {
    const results = () =>
      appTester('appDefinition.resources.list.list.operation.perform');
    results.should.throw(/You must pass in a function\/array\/object/);
  });

  it('should run simple ad-hoc functions', async () => {
    const results = await appTester(() => [1, 2, 3]);
    results.should.eql([1, 2, 3]);
  });

  it('should pass real z and bundle to ad-hoc functions', async () => {
    const results = await appTester(
      (z, bundle) => ({
        authData: bundle.authData,
        functionsWork: z.hash('md5', 'david'),
        zRequestExists: Boolean(z.request),
      }),
      { authData: { secret: 'password' } },
    );

    results.should.eql({
      authData: { secret: 'password' },
      functionsWork: '172522ec1028ab781d9dfd17eaca4427',
      zRequestExists: true,
    });
  });

  it('should error for an ad-hoc non-function', () => {
    const results = () => appTester([1, 2, 3]);
    results.should.throw(/Unable to find the following/);
  });

  it('should delete the temporary handler after use', async () => {
    await appTester(() => [1, 2, 3]);
    should(appDefinition._testRequest).eql(undefined);
  });

  it('should use the local cache and not RPC cache during test', async () => {
    const customInputFields = [
      { key: 'custom-field-1' },
      { key: 'custom-field-2' },
    ];

    // retrieves custom fields from API
    appTester.zcacheTestObj.should.eql({});
    const freshResults = await appTester(
      appDefinition.resources.cachedcustominputfields.list.operation
        .inputFields,
      {},
      true,
    );
    freshResults.should.eql(customInputFields);

    // retrieves custom fields from cache
    _.values(appTester.zcacheTestObj).should.containDeep([
      JSON.stringify(customInputFields),
    ]);
    const cachedResults = await appTester(
      appDefinition.resources.cachedcustominputfields.list.operation
        .inputFields,
      {},
    );
    cachedResults.should.eql(customInputFields);
  });
});
