'use strict';

require('should');

const createDehydrator = require('../src/tools/create-dehydrator');
const funcToFind = () => {};
const funcToMiss = () => {};

const input = {
  _zapier: {
    app: {
      some: {
        path: {
          to: funcToFind,
        },
      },
    },
  },
};

const dehydrate = createDehydrator(input);
const dehydrateFile = createDehydrator(input, 'file');

describe('hydration', () => {
  describe('dehydrate', () => {
    afterEach(() => {
      delete process.env._ZAPIER_ONE_TIME_SECRET;
    });

    it('should not allow orphaned dehydrate', () => {
      const inputData = { key: 'value' };
      (() => {
        dehydrate('foo', inputData);
      }).should.throw(
        'You must pass in a function/array/object. We got string instead.',
      );
    });

    it('should not allow missing function', () => {
      const inputData = { key: 'value' };
      (() => {
        dehydrate(funcToMiss, inputData);
      }).should.throw(
        'We could not find your function/array/object anywhere on your App definition.',
      );
    });

    it('should deepfind a function on the app', () => {
      const result = dehydrate(funcToFind);
      result.should.eql(
        'hydrate|||{"type":"method","method":"some.path.to","bundle":{}}|||hydrate',
      );
    });

    it('should allow passing of cache expiration argument along in the dehydrated data', () => {
      const result = dehydrate(funcToFind, {}, 60);
      result.should.eql(
        'hydrate|||{"type":"method","method":"some.path.to","bundle":{},"cacheExpiration":60}|||hydrate',
      );
    });

    it('should not accept payload size bigger than 12000 bytes.', () => {
      const inputData = { key: 'a'.repeat(12001) };
      (() => {
        dehydrate(funcToFind, inputData);
      }).should.throw(/Oops! You passed too much data/);
    });

    it('should sign payload', () => {
      process.env._ZAPIER_ONE_TIME_SECRET = 'super secret';
      const inputData = { key: 'value' };
      const result = dehydrate(funcToFind, inputData);
      result.should.eql(
        'hydrate|||eyJ0eXBlIjoibWV0aG9kIiwibWV0aG9kIjoic29tZS5wYXRoLnRvIiwiYnVuZGxlIjp7ImtleSI6InZhbHVlIn19:Xp29ksdiVvXpnXXA3jXSdA3JkbM=|||hydrate',
      );
    });
  });

  describe('dehydrateFile', () => {
    afterEach(() => {
      delete process.env._ZAPIER_ONE_TIME_SECRET;
    });

    it('should not allow missing function', () => {
      const inputData = { key: 'value' };
      (() => {
        dehydrateFile(funcToMiss, inputData);
      }).should.throw(
        'We could not find your function/array/object anywhere on your App definition.',
      );
    });

    it('should deepfind a function on the app', () => {
      const inputData = { key: 'value' };
      const result = dehydrateFile(funcToFind, inputData);
      result.should.eql(
        'hydrate|||{"type":"file","method":"some.path.to","bundle":{"key":"value"}}|||hydrate',
      );
    });

    it('should allow passing of cache expiration argument along in the dehydrated data', () => {
      const inputData = { key: 'value' };
      const result = dehydrateFile(funcToFind, inputData, 60);
      result.should.eql(
        'hydrate|||{"type":"file","method":"some.path.to","bundle":{"key":"value"},"cacheExpiration":60}|||hydrate',
      );
    });

    it('should not accept payload size bigger than 12000 bytes.', () => {
      const inputData = { key: 'a'.repeat(12001) };
      (() => {
        dehydrateFile(funcToFind, inputData);
      }).should.throw(/Oops! You passed too much data/);
    });

    it('should sign payload', () => {
      process.env._ZAPIER_ONE_TIME_SECRET = 'super secret';
      const inputData = { key: 'value' };
      const result = dehydrateFile(funcToFind, inputData);
      result.should.eql(
        'hydrate|||eyJ0eXBlIjoiZmlsZSIsIm1ldGhvZCI6InNvbWUucGF0aC50byIsImJ1bmRsZSI6eyJrZXkiOiJ2YWx1ZSJ9fQ==:5QJ6kP3xyaJu0ENOfrLEIENT6/w=|||hydrate',
      );
    });
  });
});
