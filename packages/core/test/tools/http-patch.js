'use strict';

const should = require('should');

const createAppTester = require('../../src/tools/create-app-tester');
const appDefinition = require('../userapp');

describe.skip('create-lambda-handler', () => {
  // this block is skipped because there's no way to un-modify 'http' once we've done it
  // I've verified that the bottom test works in isolation, but doesn't when it's part of the larger suite
  describe('http patch', () => {
    it('should patch by default', async () => {
      const appTester = createAppTester(appDefinition);
      await appTester(appDefinition.resources.list.list.operation.perform);
      const http = require('http'); // core modules are never cached
      should(http.patchedByZapier).eql(true);
    });

    it('should be ablet opt out of patch', async () => {
      const appTester = createAppTester({
        ...appDefinition,
        flags: { skipHttpPatch: true }
      });
      await appTester(appDefinition.resources.list.list.operation.perform);
      const http = require('http'); // core modules are never cached
      should(http.patchedByZapier).eql(undefined);
    });
  });
});
