'use strict';

require('should');

const zapier = require('zapier-platform-core');

const testUtils = require('../test-utils');
const App = require('../../index');
const appTester = zapier.createAppTester(App);

const TEST_RESOURCES = testUtils.TEST_RESOURCES;

describe('File Resource', () => {
  before(testUtils.globalBeforeSetup);

  it('should get an existing file in the root folder', (done) => {
    const bundle = {
      authData: {
        access_token: process.env.ACCESS_TOKEN,
        refresh_token: process.env.REFRESH_TOKEN,
        accountType: 'personal',
      },
      inputData: {
        id: TEST_RESOURCES.root.id,
      },
    };

    appTester(App.resources.file.get.operation.perform, bundle)
      .then((result) => {
        result.should.have.property('id');
        result.should.have.property('file');
        result.should.not.have.property('folder');
        result.name.should.eql(TEST_RESOURCES.root.name);
        result._path.should.eql(TEST_RESOURCES.root.path);
        result._parent.should.eql(TEST_RESOURCES.root.parent);
        done();
      })
      .catch(done);
  });

  it('should get an existing file in a child folder', (done) => {
    // An example scenario that could be worth testing if the HTTP request for
    // a child folder is sufficiently different from a root folder
    done();
  });

  it('should list files in root dir', (done) => {
    const bundle = {
      authData: {
        access_token: process.env.ACCESS_TOKEN,
        refresh_token: process.env.REFRESH_TOKEN,
        accountType: 'personal',
      },
      inputData: {
        folder: '',
      },
    };

    appTester(App.resources.file.list.operation.perform, bundle)
      .then((results) => {
        results.length.should.above(0);
        results.forEach((result) => {
          result.should.have.property('id');
          result.should.have.property('file');
          result.should.not.have.property('folder');
        });
        done();
      })
      .catch(done);
  });

  it('should not miss any fields from the sample', (done) => {
    const bundle = {
      authData: {
        access_token: process.env.ACCESS_TOKEN,
        refresh_token: process.env.REFRESH_TOKEN,
        accountType: 'personal',
      },
      inputData: {
        folder: '',
      },
    };

    appTester(App.resources.file.list.operation.perform, bundle)
      .then((results) => {
        results.length.should.above(0);
        results.forEach((result) => {
          result.should.have.property('id');
          result.should.have.property('file');
          result.should.not.have.property('folder');
        });
        const file = results[0];
        const sampleKeys = Object.keys(App.resources.file.sample);
        sampleKeys.forEach((sampleKey) => file[sampleKey].should.eql(true));
        done();
      })
      .catch(done);
  });

  it('should upload a new file in the root dir', (done) => {
    const file =
      'https://cdn.zapier.com/storage/files/f6679cf77afeaf6b8426de8d7b9642fc.pdf';
    const name = `Test-${new Date().getTime()}-ç€is-æ.pdf`;

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

    appTester(App.resources.file.create.operation.perform, bundle)
      .then((result) => {
        result.should.have.property('id');
        result.should.have.property('file');
        result.should.not.have.property('folder');
        result.name.should.containEql(name);
        result._parent.should.eql('');
        result._path.should.containEql(`/${name}`);
        done();
      })
      .catch(done);
  });

  it('should upload an utf8-named file', (done) => {
    // CODE TIP: It's a good idea to write multiple tests cases around creates
    // to verify some of the common edges:
    //    * Non-ascii data
    //    * Records associated with the right relationships (i.e. a file in a folder, an owner of a lead)
    //    * Critical defaults work as expected
    //    * Dates & times are set correctly
    done();
  });

  it('should upload a new file in the root dir, renaming it, because another one exists', (done) => {
    // An example of an edge case where a naming collision in OneDrive could
    // cause an overwrite or an auto-renaming of the file, so we want to test
    // and make sure we get the behavior we want (auto-renaming)
    done();
  });

  it('should find a file in the root dir', (done) => {
    const bundle = {
      authData: {
        access_token: process.env.ACCESS_TOKEN,
        refresh_token: process.env.REFRESH_TOKEN,
        accountType: 'personal',
      },
      inputData: {
        folder: '',
        name: 'sample',
      },
    };

    appTester(App.resources.file.search.operation.perform, bundle)
      .then((results) => {
        results.length.should.above(0);
        results[0].should.have.property('id');
        results[0].should.have.property('file');
        results[0].should.not.have.property('folder');
        results[0].name.should.containEql('sample');
        results[0]._parent.should.eql('');
        results[0]._path.should.containEql('/sample');
        done();
      })
      .catch(done);
  });

  it('should find a file in a child dir', (done) => {
    // An example scenario that could be worth testing if the HTTP request for
    // a child folder is sufficiently different from a root folder
    done();
  });

  it('should find a unicode file in a child dir', (done) => {
    // CODE TIP: Like with creates, adding multiple tests around the common
    // edge cases of searching is a good idea
    done();
  });
});
