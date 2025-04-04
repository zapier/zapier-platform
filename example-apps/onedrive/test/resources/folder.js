'use strict';

require('should');

const zapier = require('zapier-platform-core');

const testUtils = require('../test-utils');
const App = require('../../index');
const appTester = zapier.createAppTester(App);

const TEST_RESOURCES = testUtils.TEST_RESOURCES;

describe('Folder Resource', () => {
  before(testUtils.globalBeforeSetup);

  it('should get an existing root folder', (done) => {
    const bundle = {
      authData: {
        access_token: process.env.ACCESS_TOKEN,
        refresh_token: process.env.REFRESH_TOKEN,
        accountType: 'personal',
      },
      inputData: {
        id: TEST_RESOURCES.folder.id,
      },
    };

    appTester(App.resources.folder.get.operation.perform, bundle)
      .then((result) => {
        result.should.have.property('id');
        result.should.have.property('folder');
        result.should.not.have.property('file');
        result.name.should.eql(TEST_RESOURCES.root.name);
        result._path.should.eql(TEST_RESOURCES.root.path);
        result._parent.should.eql(TEST_RESOURCES.root.parent);
        done();
      })
      .catch(done);
  });

  it('should get an existing child folder', (done) => {
    // An example scenario that could be worth testing if the HTTP request for
    // a child folder is sufficiently different from a root folder
    done();
  });

  it('should list folders in root dir', (done) => {
    const bundle = {
      authData: {
        access_token: process.env.ACCESS_TOKEN,
        refresh_token: process.env.REFRESH_TOKEN,
        accountType: 'personal',
      },
      inputData: {
        folder: '',
      },
      meta: {
        prefill: false,
      },
    };

    appTester(App.resources.folder.list.operation.perform, bundle)
      .then((results) => {
        results.length.should.above(0);
        results.forEach((result) => {
          result.should.have.property('id');
          result.should.have.property('folder');
          result.should.not.have.property('file');
        });
        done();
      })
      .catch(done);
  });

  it('should list folders without parents on no prefill', (done) => {
    // CODE TIP: When reusing a list operation to power a trigger and a
    // dynmaic dropdown (prefill), it's a good idea to test both scenarios if the
    // output from the operation varies between the two contexts
    const bundle = {
      authData: {
        access_token: process.env.ACCESS_TOKEN,
        refresh_token: process.env.REFRESH_TOKEN,
        accountType: 'personal',
      },
      inputData: {
        folder: TEST_RESOURCES.childFolder.path,
      },
      meta: {
        prefill: false,
      },
    };

    appTester(App.resources.folder.list.operation.perform, bundle)
      .then((results) => {
        results.length.should.above(0);

        let foundParents = false;

        results.forEach((result) => {
          result.should.have.property('id');
          result.should.have.property('folder');
          result.should.not.have.property('file');
          if (result.id < 0) {
            foundParents = true;
          }
        });

        foundParents.should.eql(false);
        done();
      })
      .catch(done);
  });

  it('should list folders with parents on prefill', (done) => {
    const bundle = {
      authData: {
        access_token: process.env.ACCESS_TOKEN,
        refresh_token: process.env.REFRESH_TOKEN,
        accountType: 'personal',
      },
      inputData: {
        folder: TEST_RESOURCES.childFolder.path,
      },
      meta: {
        prefill: true,
      },
    };

    appTester(App.resources.folder.list.operation.perform, bundle)
      .then((results) => {
        results.length.should.above(0);

        let foundParents = false;

        results.forEach((result) => {
          result.should.have.property('id');
          result.should.have.property('folder');
          result.should.not.have.property('file');
          if (result.id < 0) {
            foundParents = true;
          }
        });

        foundParents.should.eql(true);
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
      meta: {
        prefill: false,
      },
    };

    appTester(App.resources.folder.list.operation.perform, bundle)
      .then((results) => {
        results.length.should.above(0);
        results.forEach((result) => {
          result.should.have.property('id');
          result.should.have.property('folder');
          result.should.not.have.property('file');
        });
        const folder = results[0];
        const sampleKeys = Object.keys(App.resources.folder.sample);
        sampleKeys.forEach((sampleKey) => folder[sampleKey].should.eql(true));
        done();
      })
      .catch(done);
  });

  it('should create a new folder in the root dir', (done) => {
    const name = `Test-${new Date().getTime()}`;

    const bundle = {
      authData: {
        access_token: process.env.ACCESS_TOKEN,
        refresh_token: process.env.REFRESH_TOKEN,
        accountType: 'personal',
      },
      inputData: {
        folder: '',
        name,
      },
    };

    appTester(App.resources.folder.create.operation.perform, bundle)
      .then((result) => {
        result.should.have.property('id');
        result.should.have.property('folder');
        result.should.not.have.property('file');
        result.name.should.containEql(name);
        result._parent.should.eql('');
        result._path.should.containEql(`/${name}`);
        done();
      })
      .catch(done);
  });

  it('should create a new folder in a child dir', (done) => {
    // An example scenario that could be worth testing if the HTTP request for
    // a child folder is sufficiently different from a root folder
    done();
  });

  it('should find a folder in the root dir', (done) => {
    const bundle = {
      authData: {
        access_token: process.env.ACCESS_TOKEN,
        refresh_token: process.env.REFRESH_TOKEN,
        accountType: 'personal',
      },
      inputData: {
        folder: '',
        name: 'Documents',
      },
    };

    appTester(App.resources.folder.search.operation.perform, bundle)
      .then((results) => {
        results.length.should.above(0);
        results[0].should.have.property('id');
        results[0].should.have.property('folder');
        results[0].should.not.have.property('file');
        results[0].name.should.containEql('Documents');
        results[0]._parent.should.eql('');
        results[0]._path.should.containEql('/Documents');
        done();
      })
      .catch(done);
  });

  it('should find a folder in a child dir', (done) => {
    // An example scenario that could be worth testing if the HTTP request for
    // a child folder is sufficiently different from a root folder
    done();
  });
});
