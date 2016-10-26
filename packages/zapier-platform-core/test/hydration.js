'use strict';

require('should');

const createDehydrator = require('../src/tools/create-dehydrator');
const funcToFind = () => {};
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
        err.message.should.containEql("'foo' is not a valid full path / shorthand path.");
      }
    });

    it('should deepfind a function on the app', () => {
      const result = dehydrate(funcToFind);
      result.should.eql('hydrate|||{"type":"method","method":"some.path.to","bundle":{}}|||hydrate');
    });

  });

});
