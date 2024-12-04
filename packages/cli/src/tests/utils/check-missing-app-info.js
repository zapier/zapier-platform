const should = require('should');
const checkMissingAppInfo = require('../../utils/check-missing-app-info');

describe('check missing required app info', () => {
  it('should raise an error when one or more required app info are missing', () => {
    const app = {
      id: 123,
      status: 'private',
      public: false,
      pending: false,
      title: 'Test App',
      description: 'Sample description',
      key: 'App123',
    };
    should(() => checkMissingAppInfo(app)).throw(
      new Error(
        `Your integration is missing required info (category, audience, role). Please, run "zapier register" to add it.`,
      ),
    );
  });
  it('should return false when all the required app info are set', () => {
    const app = {
      id: 123,
      public: false,
      pending: false,
      title: 'Test App',
      description: 'Sample description',
      key: 'App123',
      intention: 'private',
      app_category: 'crm',
      role: 'user',
    };
    checkMissingAppInfo(app).should.equal(false);
  });
  it('should return false when an app is public', () => {
    const app = {
      id: 123,
      public: false,
      status: 'public',
      pending: false,
      title: 'Test App',
      key: 'App123',
      intention: 'global',
      app_category: 'crm',
      role: 'user',
    };
    checkMissingAppInfo(app).should.equal(false);
  });
  it('should return false when an app is beta', () => {
    const app = {
      id: 123,
      public: false,
      status: 'beta',
      pending: false,
      title: 'Test App',
      key: 'App123',
      intention: 'global',
      app_category: 'crm',
      role: 'user',
    };
    checkMissingAppInfo(app).should.equal(false);
  });
});
