const should = require('should');
const { createRootRequire, addKeyToPropertyOnApp } = require('../../utils/ast');

const sampleIndex = `
// leading comment

const CryptoCreate = require('./creates/crypto')
const BlahTrigger = require('./triggers/blah')

// We can roll up all our behaviors in an App.
const App = {
  // This is just shorthand to reference the installed dependencies you have. Zapier will
  // need to know these before we can upload
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  // beforeRequest & afterResponse are optional hooks into the provided HTTP client
  beforeRequest: [],

  afterResponse: [],

  // If you want to define optional resources to simplify creation of triggers, searches, creates - do that here!
  resources: {
  	test: () => {
      // red herring require
    	const fs = require('fs')
    }
  },

  // If you want your trigger to show up, you better include it here!
  triggers: {
    [BlahTrigger.key]: BlahTrigger
  },

  // If you want your creates to show up, you better include it here!
  creates: {
    [CryptoCreate.key]: CryptoCreate
  }
}

// Finally, export the app.
module.exports = App
`.trim();

describe('ast', () => {
  it('should add a new require statement at root', () => {
    // new nodes use a generic pretty printer, hence the ; and "
    // it shoudl be inserted after other top-level imports
    should(
      createRootRequire(sampleIndex, 'getThing', './a/b/c').includes(
        'const BlahTrigger = require(\'./triggers/blah\')\n\nconst getThing = require("./a/b/c");'
      )
    ).be.true();
  });

  it('should add a property to an existing action type', () => {
    const codeByLine = addKeyToPropertyOnApp(
      sampleIndex,
      'triggers',
      'getThing'
    )
      .split('\n')
      .map(x => x.trim());

    const firstIndex = codeByLine.indexOf('triggers: {');
    // assertions about what comes in the trigger property
    should(codeByLine.indexOf('[BlahTrigger.key]: BlahTrigger,')).eql(
      firstIndex + 1
    );
    should(codeByLine.indexOf('[getThing.key]: getThing')).eql(firstIndex + 2);

    should(codeByLine.includes('searches: {')).be.false();
  });

  it('should add a new property if missing', () => {
    const codeByLine = addKeyToPropertyOnApp(
      sampleIndex,
      'searches',
      'findThing'
    )
      .split('\n')
      .map(x => x.trim());
    console.log(codeByLine);

    const firstIndex = codeByLine.indexOf('searches: {');
    // assertions about what comes in the trigger property
    should(codeByLine.indexOf('[findThing.key]: findThing')).eql(
      firstIndex + 1
    );
  });
});
