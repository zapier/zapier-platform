const createCallbackWrapper = require('../../src/tools/create-callback-wrapper');
const callbackStatusCatcher = require('../../src/app-middlewares/after/callback-status-catcher');
const should = require('should');

const CALLBACK_URL = 'https://example.com/callback';
const input = {
  _zapier: {
    event: {
      callback_url: CALLBACK_URL,
    },
  },
};
describe('callbackwrapper', () => {
  let wrapper;

  before(() => {
    wrapper = createCallbackWrapper(input);
  });
  it('should return a function', () => wrapper().should.eql(CALLBACK_URL));

  describe('reading the callback', () => {
    before(() => {
      // was probably set from the previous test
      delete input._zapier.event.callbackUsed;
      should.not.exist(input._zapier.event.callbackUsed);
    });
    it('should set the isUsed property', () => {
      wrapper();
      input._zapier.event.callbackUsed.should.eql(true);
    });
  });
});
describe('callbackStatusCatcher', () => {
  const output = {
    input,
  };
  describe('when functions finish with an accessed callback', () => {
    let result;
    before(() => {
      input._zapier.event.callbackUsed = true;
      result = callbackStatusCatcher(output);
    });
    it('should set callback flag on envelope', () =>
      result.status.should.be.eql('CALLBACK'));
  });
  describe('when functions finish without accessing callback', () => {
    let result;
    before(() => {
      delete input._zapier.event.callbackUsed;
      result = callbackStatusCatcher(output);
    });
    it('should not modify result', () => result.should.eql(output));
    it('should not set CALLBACK flag', () => should.not.exist(result.CALLBACK));
  });
});
