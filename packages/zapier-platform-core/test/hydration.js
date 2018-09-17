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
    afterEach(() => {
      delete process.env._ZAPIER_ONE_TIME_SECRET;
    });

    it('should not allow orphaned dehydrate', () => {
      const inputData = { key: 'value' };
      try {
        dehydrate('foo', inputData);
        '1'.should.eql('2'); // shouldn't pass
      } catch (err) {
        err.message.should.containEql(
          'You must pass in a function/array/object.'
        );
      }
    });

    it('should not allow missing function', () => {
      const inputData = { key: 'value' };
      try {
        dehydrate(funcToMiss, inputData);
        '1'.should.eql('2'); // shouldn't pass
      } catch (err) {
        err.message.should.containEql(
          'We could not find your function/array/object anywhere on your App definition.'
        );
      }
    });

    it('should deepfind a function on the app', () => {
      const result = dehydrate(funcToFind);
      result.should.eql(
        'hydrate|||{"type":"method","method":"some.path.to","bundle":{}}|||hydrate'
      );
    });

    it('should not accept payload size bigger than 2048 bytes.', () => {
      const inputData = { key: 'a'.repeat(2049) };
      const payloadSize = JSON.stringify(inputData).length;
      try {
        dehydrate(funcToFind, inputData);
        '1'.should.eql('2'); // shouldn't pass
      } catch (err) {
        err.message.should.containEql(
          `Oops! You passed too much data (${payloadSize} bytes) to your dehydration function - try slimming it down under 2048 bytes (usually by just passing the needed IDs).`
        );
      }
    });

    it('should sign payload', () => {
      process.env._ZAPIER_ONE_TIME_SECRET = 'super secret';
      const inputData = { key: 'value' };
      const result = dehydrate(funcToFind, inputData);
      result.should.eql(
        'hydrate|||eyJ0eXBlIjoibWV0aG9kIiwibWV0aG9kIjoic29tZS5wYXRoLnRvIiwiYnVuZGxlIjp7ImtleSI6InZhbHVlIn19:Xp29ksdiVvXpnXXA3jXSdA3JkbM=|||hydrate'
      );
    });
  });
});
