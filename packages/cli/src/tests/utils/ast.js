const should = require('should');
const { createRootRequire, addKeyToPropertyOnApp } = require('../../utils/ast');

const sampleIndex = `
const CryptoCreate = require('./creates/crypto')
const BlahTrigger = require('./triggers/blah')
// comment!
const App = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,
  resources: {
  	test: () => {
      // red herring require
    	const fs = require('fs')
    }
  },
  triggers: {
    [BlahTrigger.key]: BlahTrigger
  },
  creates: {
    [CryptoCreate.key]: CryptoCreate
  }
}
module.exports = App
`.trim();

describe('ast', () => {
  describe('adding require statements', () => {
    it('should add a new require statement at root', () => {
      // new nodes use a generic pretty printer, hence the ; and "
      // it should be inserted after other top-level imports
      const result = createRootRequire(sampleIndex, 'getThing', './a/b/c');
      should(
        result.includes(
          'const BlahTrigger = require(\'./triggers/blah\')\nconst getThing = require("./a/b/c");'
        )
      ).be.true();
    });

    it('should add a new require even when there are none to find', () => {
      const result = createRootRequire(
        sampleIndex
          // drop existing require statements
          .split('\n')
          .slice(2)
          .join('\n'),
        'getThing',
        './a/b/c'
      );
      should(
        result.startsWith('// comment!\nconst getThing = require("./a/b/c");')
      ).be.true();
    });

    it('should skip duplicates', () => {
      const result = createRootRequire(sampleIndex, 'CryptoCreate', './a/b/c');
      should(
        result.includes("const CryptoCreate = require('./a/b/c')")
      ).be.false();
    });

    it('should not skip sneaky duplicates', () => {
      const result = createRootRequire(sampleIndex, 'Crypto', './a/b/c');
      should(result.includes('const Crypto = require("./a/b/c");')).be.true();
    });
  });

  describe('adding object properties', () => {
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
      should(codeByLine.indexOf('[getThing.key]: getThing')).eql(
        firstIndex + 2
      );

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

      const firstIndex = codeByLine.indexOf('searches: {');
      // assertions about what comes in the trigger property
      should(codeByLine.indexOf('[findThing.key]: findThing')).eql(
        firstIndex + 1
      );
      should(codeByLine[firstIndex + 2]).eql('}');
    });

    it('should work when there\'s not an "App", but there _is_ a "triggers" property', () => {
      const code = sampleIndex.split('App').join('Blah'); // still valid, but wrong variable name now

      const codeByLine = addKeyToPropertyOnApp(code, 'triggers', 'getThing')
        .split('\n')
        .map(x => x.trim());
      const firstIndex = codeByLine.indexOf('triggers: {');
      // assertions about what comes in the trigger property
      should(codeByLine.indexOf('[BlahTrigger.key]: BlahTrigger,')).eql(
        firstIndex + 1
      );
      should(codeByLine.indexOf('[getThing.key]: getThing')).eql(
        firstIndex + 2
      );
      should(codeByLine[firstIndex + 3]).eql('},');
    });

    it('should add a property when it has to find the variable', () => {
      const code = sampleIndex.split('App').join('Blah'); // still valid, but wrong variable name now

      const codeByLine = addKeyToPropertyOnApp(code, 'searches', 'getThing')
        .split('\n')
        .map(x => x.trim());
      const firstIndex = codeByLine.indexOf('searches: {');
      should(codeByLine.indexOf('[getThing.key]: getThing')).eql(
        firstIndex + 1
      );
      should(codeByLine[firstIndex + 2]).eql('}');
    });
  });
});
