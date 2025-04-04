'use strict';

require('should');

const utils = require('../utils');
const extractParentsFromPath = utils.extractParentsFromPath;
const getStringByteSize = utils.getStringByteSize;

describe('Utils', () => {
  it('should extract parents from a folder path', () => {
    let parents = extractParentsFromPath('/Some/Kind of /Test');

    parents.length.should.eql(3);

    parents[0].id.should.eql(-1);
    parents[0].name.should.eql('/');
    parents[0]._path.should.eql('');
    parents[0].should.have.property('folder');
    parents[0].should.not.have.property('file');

    parents[1].id.should.eql(-2);
    parents[1].name.should.eql('Some');
    parents[1]._path.should.eql('/Some');
    parents[1].should.have.property('folder');
    parents[1].should.not.have.property('file');

    parents[2].id.should.eql(-3);
    parents[2].name.should.eql('Kind of ');
    parents[2]._path.should.eql('/Some/Kind of ');
    parents[2].should.have.property('folder');
    parents[2].should.not.have.property('file');

    parents = extractParentsFromPath('/Zapier');

    parents.length.should.eql(1);

    parents[0].id.should.eql(-1);
    parents[0].name.should.eql('/');
    parents[0]._path.should.eql('');
    parents[0].should.have.property('folder');
    parents[0].should.not.have.property('file');
  });

  it('should correctly compute the byte size of strings', () => {
    const tests = [
      {
        string: 'asd',
        expected: 3,
      },
      {
        string: '@€£¶‰dfg',
        expected: 14,
      },
      {
        string: '÷¶[]÷d()ß-°ú',
        expected: 18,
      },
      {
        string: 'ç€is-æ',
        expected: 10,
      },
    ];

    tests.forEach((test) =>
      getStringByteSize(test.string).should.eql(test.expected),
    );
  });
});
