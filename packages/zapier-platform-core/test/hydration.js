'use strict';

require('should');

const createDehydrator = require('../src/tools/create-dehydrator');
const funcToFind = () => {};
const funcToMiss = () => {};
const dehydrate = createDehydrator({
  _zapier: {
    app: {
      some: {
        path: {
          to: funcToFind
        }
      }
    }
  }
});

describe('hydration', () => {
  describe('dehydrate', () => {

    it('should not allow orphaned dehydrate', () => {
      const inputData = { key: 'value' };
      try {
        dehydrate('foo', inputData);
        '1'.should.eql('2'); // shouldn't pass
      } catch (err) {
        err.message.should.containEql('You must pass in a function/array/object.');
      }
    });

    it('should not allow missing function', () => {
      const inputData = { key: 'value' };
      try {
        dehydrate(funcToMiss, inputData);
        '1'.should.eql('2'); // shouldn't pass
      } catch (err) {
        err.message.should.containEql('We could not find your function/array/object anywhere on your App definition.');
      }
    });

    it('should deepfind a function on the app', () => {
      const result = dehydrate(funcToFind);
      result.should.eql('hydrate|||{"type":"method","method":"some.path.to","bundle":{}}|||hydrate');
    });

  });

});
