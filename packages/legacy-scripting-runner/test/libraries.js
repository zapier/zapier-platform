require('should');

describe('Utils/Libraries', () => {
  it('btoa', (done) => {
    const btoa = require('../btoa');
    const result = btoa('something');
    result.should.equal('c29tZXRoaW5n');
    done();
  });

  it('atob', (done) => {
    const atob = require('../atob');
    const result = atob('c29tZXRoaW5n');
    result.should.equal('something');
    done();
  });

  describe('$', () => {
    const $ = require('../$');

    it('$.param()', (done) => {
      const result = $.param({ test: 'something', more: true, also: '@' });
      result.should.equal('test=something&more=true&also=%40');
      done();
    });

    it('$.parseXML()', (done) => {
      const xml = $.parseXML('<do><something>also</something></do>');
      const result = xml.getElementsByTagName('do').length;
      result.should.equal(1);
      done();
    });
  });
});
