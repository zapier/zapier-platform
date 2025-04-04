'use strict';

const should = require('should');

const _ = require('lodash');

const appDefinition = require('../userapp');
const moduleAppDefinition = require('../moduleuserapp');
const resolveMethodPath = require('../../src/tools/resolve-method-path');
const schemaTools = require('../../src/tools/schema');

describe('resolve-method-path', () => {
  const app = schemaTools.prepareApp(appDefinition);
  const moduleApp = schemaTools.prepareApp(moduleAppDefinition);

  const oauthAppDef = _.extend({}, appDefinition);
  oauthAppDef.authentication = {
    test: () => {},
    oauth2Config: {
      authorizeUrl: { method: 'GET', url: 'https://example.com' },
      getAccessToken: () => {},
    },
  };

  it('should resolve a request method object with a url', () => {
    resolveMethodPath(
      app,
      app.resources.contacterror.list.operation.perform,
    ).should.eql('resources.contacterror.list.operation.perform');
  });

  it('should resolve a method in a module', () => {
    resolveMethodPath(moduleApp, moduleApp.authentication.test).should.eql(
      'authentication.test',
    );

    resolveMethodPath(
      moduleApp,
      moduleAppDefinition.authentication.oauth2Config.authorizeUrl,
    ).should.eql('authentication.oauth2Config.authorizeUrl');
  });

  it('should resolve an inputFields array', () => {
    resolveMethodPath(
      app,
      app.resources.contact.list.operation.inputFields,
    ).should.eql('resources.contact.list.operation.inputFields');
  });

  it('should resolve a function', () => {
    resolveMethodPath(
      app,
      app.creates.contactCreate.operation.perform,
    ).should.eql('creates.contactCreate.operation.perform');

    resolveMethodPath(
      app,
      app.triggers.contactList.operation.perform,
    ).should.eql('triggers.contactList.operation.perform');

    resolveMethodPath(app, app.hydrators.getBigStuff).should.eql(
      'hydrators.getBigStuff',
    );
  });

  it('should resolve authentication paths', () => {
    const authApp = schemaTools.prepareApp(oauthAppDef);
    resolveMethodPath(authApp, authApp.authentication.test).should.eql(
      'authentication.test',
    );
    resolveMethodPath(
      authApp,
      authApp.authentication.oauth2Config.getAccessToken,
    ).should.eql('authentication.oauth2Config.getAccessToken');
    // oauthAppDef !== authApp due to prepareApp() - so make sure isEqual is used
    resolveMethodPath(
      authApp,
      oauthAppDef.authentication.oauth2Config.authorizeUrl,
    ).should.eql('authentication.oauth2Config.authorizeUrl');
    resolveMethodPath(
      authApp,
      authApp.authentication.oauth2Config.authorizeUrl,
    ).should.eql('authentication.oauth2Config.authorizeUrl');
  });

  it('should resolve deep paths quickly', () => {
    // is >1000ms if not memoizedFindMapDeep, ~300ms after
    const authApp = schemaTools.prepareApp(oauthAppDef);
    for (let i = 1000; i >= 0; i--) {
      resolveMethodPath(
        authApp,
        oauthAppDef.authentication.oauth2Config.authorizeUrl,
      );
    }
  });

  it('should throw if it fails to find', () => {
    const shouldThrow = () => resolveMethodPath(app, () => null);
    shouldThrow.should.throw(/We could not find/);
  });

  it('should be able to skip throwing if it fails to find', () => {
    should(resolveMethodPath(app, () => null, false)).eql(undefined);
  });

  it('should always error if it gets a wrong type', () => {
    const shouldThrow = () => resolveMethodPath(app, undefined);
    shouldThrow.should.throw(/You must pass in a function\/array\/object/);

    const shouldThrow2 = () => resolveMethodPath(app, 'ok', false);
    shouldThrow2.should.throw(/You must pass in a function\/array\/object/);
  });
});
