'use strict';

require('should');

const zapier = require('zapier-platform-core');

const testUtils = require('../test-utils');
const App = require('../../index');
const appTester = zapier.createAppTester(App);

const TEST_RESOURCES = testUtils.TEST_RESOURCES;

describe('Create Text File', () => {
  before(testUtils.globalBeforeSetup);

  it('should create a new text file in the root dir', (done) => {
    const file = 'Sample content';
    const name = `Test-${new Date().getTime()}`;

    const bundle = {
      authData: {
        access_token: process.env.ACCESS_TOKEN,
        refresh_token: process.env.REFRESH_TOKEN,
        accountType: 'personal',
      },
      inputData: {
        folder: '',
        file,
        name,
      },
    };

    appTester(App.creates.textFile.operation.perform, bundle)
      .then((result) => {
        result.should.have.property('id');
        result.should.have.property('file');
        result.should.not.have.property('folder');
        result.name.should.containEql(name);
        result.name.should.containEql('.txt');
        result.name.should.not.containEql('.txt.txt');
        result._parent.should.eql('');
        result._path.should.containEql(`/${name}`);
        done();
      })
      .catch(done);
  });

  it('should create a text file with a unicode name and contents', (done) => {
    const file = 'Ohweeeeee®™¥¶‰÷!!!!!!!!!!!';
    const name = `Test-ç€is-æ-${new Date().getTime()}.txt`;

    const bundle = {
      authData: {
        access_token: process.env.ACCESS_TOKEN,
        refresh_token: process.env.REFRESH_TOKEN,
        accountType: 'personal',
      },
      inputData: {
        folder: TEST_RESOURCES.folder.path,
        name,
        file,
      },
    };

    appTester(App.creates.textFile.operation.perform, bundle)
      .then((result) => {
        result.should.have.property('id');
        result.should.have.property('file');
        result.should.not.have.property('folder');
        result.name.should.containEql(name);
        result.name.should.containEql('.txt');
        result.name.should.not.containEql('.txt.txt');
        result._parent.should.eql(TEST_RESOURCES.folder.parent);
        result._path.should.containEql(`${TEST_RESOURCES.folder.path}/${name}`);
        done();
      })
      .catch(done);
  });

  it('should create a new text file in the root dir, renaming it, because another one exists', (done) => {
    const file = 'Sample content';
    const name = 'boom';

    const bundle = {
      authData: {
        access_token: process.env.ACCESS_TOKEN,
        refresh_token: process.env.REFRESH_TOKEN,
        accountType: 'personal',
      },
      inputData: {
        folder: '',
        file,
        name,
      },
    };

    appTester(App.creates.textFile.operation.perform, bundle)
      .then((result) => {
        result.should.have.property('id');
        result.should.have.property('file');
        result.should.not.have.property('folder');
        result.name.should.containEql(`${name} `);
        result.name.should.containEql('.txt');
        result.name.should.not.containEql('.txt.txt');
        result.name.should.not.containEql(`${name}.txt`);
        result._parent.should.eql('');
        result._path.should.containEql(`/${name} `);
        done();
      })
      .catch(done);
  });
});
