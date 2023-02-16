const should = require('should');
const checkMissingAppInfo = require('../../utils/check-missing-app-info');

describe('check missing required app info', () => {
  it('should raise an error when one or more required app info are missing', () => {
    const app = {
      id: 123,
      public: false,
      pending: false,
      title: 'Test App',
      description: 'Sample description',
      key: 'App123',
      app_category: 'crm',
    };
    should(() => checkMissingAppInfo(app)).throw(new Error(`Your integration is missing required info (intention, role). Please, run "zapier register" to add it.`));
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
});
