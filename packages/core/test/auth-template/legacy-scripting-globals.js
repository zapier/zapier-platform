'use strict';

const should = require('should');

const {
  ErrorException,
  HaltedException,
  StopRequestException,
  ExpiredAuthException,
  RefreshTokenException,
  InvalidSessionException,
  atob,
  btoa,
  legacyZ,
} = require('../../src/auth-template/legacy-scripting-globals');

describe('legacy-scripting-globals', () => {
  it('exports distinct Error subclasses for each legacy exception name', () => {
    should(new HaltedException('halted')).be.instanceOf(Error);
    should(new StopRequestException('stopped')).be.instanceOf(Error);
    should(new ExpiredAuthException('expired')).be.instanceOf(Error);
    should(new RefreshTokenException('refresh')).be.instanceOf(Error);
    should(new InvalidSessionException('invalid')).be.instanceOf(Error);
    should(new ErrorException('generic', 'code', 500)).be.instanceOf(Error);
  });

  it('round-trips a string through btoa/atob', () => {
    should(atob(btoa('hello world'))).equal('hello world');
  });

  describe('legacyZ', () => {
    it('parses and stringifies JSON', () => {
      should(legacyZ.JSON.parse('{"a":1}')).deepEqual({ a: 1 });
      should(legacyZ.JSON.stringify({ a: 1 })).equal('{"a":1}');
    });

    it('throws a friendly error when JSON.parse fails', () => {
      should(() => legacyZ.JSON.parse('not json')).throw(/Error parsing/);
    });

    it('hashes a string', () => {
      should(legacyZ.hash('sha256', 'hello')).equal(
        '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
      );
    });

    it('hmacs a string', () => {
      should(legacyZ.hmac('sha256', 'secret', 'hello')).be.a.String();
    });

    it('censors a string with snipify', () => {
      const result = legacyZ.snipify('some-secret-value');
      should(result).startWith(':censored:');
      should(result).not.containEql('some-secret-value');
    });

    it('returns null from snipify for non-strings', () => {
      should(legacyZ.snipify(123)).equal(null);
    });
  });
});
