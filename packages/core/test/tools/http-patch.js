'use strict';

const should = require('should');

const createAppTester = require('../../src/tools/create-app-tester');
const appDefinition = require('../userapp');

describe('create-lambda-handler', () => {
  describe('http patch', () => {
    it('should patch by default', async () => {
      const appTester = createAppTester(appDefinition);
      await appTester(appDefinition.resources.list.list.operation.perform);
      should(require('http').patchedByZapier).eql(true);
      should(require('https').patchedByZapier).eql(true);
    });

    // when we run this test, we have to run it without any other test calling createAppTester
    // this block is skipped because there's no way to un-modify 'http' once we've done it
    // it's skipped in the main suite and run on its own afterwards
    // if the test name changes, the test command in package.json must as well
    // console.error(process.env.OPT_OUT_PATCH_TEST_ONLY);
    (process.env.OPT_OUT_PATCH_TEST_ONLY ? it : it.skip)(
      'should be able to opt out of patch',
      async () => {
        const appTester = createAppTester({
          ...appDefinition,
          flags: { skipHttpPatch: true },
        });
        await appTester(appDefinition.resources.list.list.operation.perform);
        const http = require('http'); // core modules are never cached
        should(http.patchedByZapier).eql(undefined);
      }
    );
  });
});
