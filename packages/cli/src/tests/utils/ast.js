const should = require('should');
const { createRootRequire, addKeyToPropertyOnApp } = require('../../utils/ast');

const {
  sampleExportVarIndex,
  sampleExportObjectIndex,
  sampleLegacyAppIndex,
} = require('./astFixtures');

/**
 * counts the numbers of times `subStr` occurs in `str`
 */
const countOcurrances = (str, subStr) =>
  (str.match(new RegExp(subStr, 'g')) || []).length;

describe('ast', () => {
  describe('adding require statements', () => {
    it('should add a new require statement at root', () => {
      // new nodes use a generic pretty printer, hence the ; and "
      // it should be inserted after other top-level imports
      const result = createRootRequire(
        sampleExportVarIndex,
        'getThing',
        './a/b/c'
      );
      should(
        result.includes(
          'const BlahTrigger = require(\'./triggers/blah\')\nconst getThing = require("./a/b/c");'
        )
      ).be.true();
    });

    it('should add a new require even when there are none to find', () => {
      const result = createRootRequire(
        sampleExportVarIndex
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
      const result = createRootRequire(
        sampleExportVarIndex,
        'CryptoCreate',
        './a/b/c'
      );
      should(
        result.includes("const CryptoCreate = require('./a/b/c')")
      ).be.false();
    });

    it('should not skip sneaky duplicates', () => {
      const result = createRootRequire(
        sampleExportVarIndex,
        'Crypto',
        './a/b/c'
      );
      should(result.includes('const Crypto = require("./a/b/c");')).be.true();
    });
  });

  // these tests would be improved if we could `eval` the object and check that App.triggers.thing` exists, but i'm not sure we can easily do that with all the requiring that goes on.
  // the only risk we run is that it puts the new object in the wrong spot, but that feels unlikely. we'll also get some coverage in the smoke tests
  describe('adding object properties', () => {
    Object.entries({
      variable: sampleExportVarIndex,
      object: sampleExportObjectIndex,
    }).forEach(function ([exportType, codeStr]) {
      describe(`${exportType} export`, () => {
        it('should add a property to an existing action type', () => {
          const result = addKeyToPropertyOnApp(codeStr, 'triggers', 'getThing');
          should(countOcurrances(result, 'triggers:')).eql(1);
          should(countOcurrances(result, 'searches:')).eql(0);

          const codeByLine = result.split('\n').map((x) => x.trim());
          const firstIndex = codeByLine.indexOf('triggers: {');
          // assertions about what comes in the trigger property
          should(codeByLine.indexOf('[BlahTrigger.key]: BlahTrigger,')).eql(
            firstIndex + 1
          );
          should(codeByLine.indexOf('[getThing.key]: getThing')).eql(
            firstIndex + 2
          );
        });

        it('should add a new property if action type is missing', () => {
          const result = addKeyToPropertyOnApp(
            codeStr,
            'searches',
            'findThing'
          );
          should(countOcurrances(result, 'triggers:')).eql(1);
          should(countOcurrances(result, 'searches:')).eql(1);

          const codeByLine = result.split('\n').map((x) => x.trim());
          const firstIndex = codeByLine.indexOf('searches: {');
          // assertions about what comes in the trigger property
          should(codeByLine.indexOf('[findThing.key]: findThing')).eql(
            firstIndex + 1
          );
          should(codeByLine[firstIndex + 2]).eql('}');
        });
      });
    });

    describe('legacy apps', () => {
      it('should add a property to an existing action type', () => {
        const result = addKeyToPropertyOnApp(
          sampleLegacyAppIndex,
          'triggers',
          'getThing'
        );
        should(countOcurrances(result, 'triggers:')).eql(2);
        should(countOcurrances(result, 'searches:')).eql(2);

        const codeByLine = result.split('\n').map((x) => x.trim());

        // find the second occurance, the one that's not in the "legacy" property
        const operativeIndex = codeByLine.indexOf(
          'triggers: {',
          codeByLine.indexOf('triggers: {') + 1
        );

        should(
          codeByLine.indexOf('[businessTrigger.key]: businessTrigger,')
        ).eql(operativeIndex + 1);
        should(codeByLine.indexOf('[getThing.key]: getThing')).eql(
          operativeIndex + 2
        );
        should(codeByLine[operativeIndex + 3]).eql('},');
      });

      it('should add a property to an existing empty action type', () => {
        const result = addKeyToPropertyOnApp(
          sampleLegacyAppIndex,
          'searches',
          'findThing'
        );
        should(countOcurrances(result, 'searches:')).eql(2);

        const codeByLine = result.split('\n').map((x) => x.trim());
        // find the second occurance, the one that's not in the "legacy" property
        const operativeIndex = codeByLine.indexOf('searches: {');
        should(codeByLine.indexOf('[findThing.key]: findThing')).eql(
          operativeIndex + 1
        );
        should(codeByLine[operativeIndex + 2]).eql('},');
      });

      it('should add a new property if action type is missing', () => {
        const result = addKeyToPropertyOnApp(
          sampleLegacyAppIndex,
          'resources',
          'findThing'
        );
        should(countOcurrances(result, 'triggers:')).eql(2);
        should(countOcurrances(result, 'searches:')).eql(2);
        should(countOcurrances(result, 'resources:')).eql(1);

        const codeByLine = result.split('\n').map((x) => x.trim());
        const firstIndex = codeByLine.indexOf('resources: {');
        // assertions about what comes in the trigger property
        should(codeByLine.indexOf('[findThing.key]: findThing')).eql(
          firstIndex + 1
        );
        should(codeByLine[firstIndex + 2]).eql('}');
      });
    });
  });

  describe('error handling', () => {
    const errors = [
      {
        title: "error when there's no export",
        input: `const app = { very: 'cool', triggers: { key: 'cool' } }`,
        error: 'Nothing is exported',
      },
      {
        title: 'error for an unknown expression type',
        input: `module.exports = 3`,
        error: 'Invalid export type',
      },
      {
        title: 'error for an unknown expression type',
        input: `const app = { triggers: {} }; const exportedApp = app; module.exports = exportedApp;`,
        error: 'Unable to find object definition',
      },
      {
        title: 'error for an unknown expression type',
        input: `module.exports = {triggers: 4};`,
        error: "Tried to edit the triggers key, but the value wasn't an object",
      },
    ];

    errors.forEach(
      ({ title, input, error, prop = 'triggers', varName = 'newThing' }) => {
        it(`should ${title}`, () => {
          should(() => addKeyToPropertyOnApp(input, prop, varName)).throw(
            new RegExp(error)
          );
        });
      }
    );
  });
});
