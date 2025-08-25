// @ts-check

const should = require('should');
const { remove, readFile, outputFile } = require('fs-extra');
const {
  plural,
  nounToKey,
  writeTemplateFile,
  createTemplateContext,
  updateEntryFile,
  isEsmJavaScript,
} = require('../../utils/scaffold');

const { getNewTempDirPath } = require('../_helpers');

// missing `creates` on purpose
const basicIndexJs = `
const App = {

  resources: {},

  triggers: {},

  searches: {},
};

module.exports = App;
`.trim();
const basicTriggerJs = 'module.exports = {key: "thing"}\n';

const basicIndexTs = `
export default {
  platformVersion,
  triggers: {},
  searches: {},
} satisfies App;
`.trim();
const basicTriggerTs = 'export default {key: "thing"} satisfies Trigger;\n';

// ESM JavaScript files use the same export syntax as TypeScript
const basicIndexJsEsm = `
import packageJson from './package.json' with { type: 'json' };
import zapier from 'zapier-platform-core';

export default {
  version: packageJson.version,
  platformVersion: zapier.version,
  triggers: {},
  searches: {},
  creates: {},
  resources: {},
};
`.trim();
const basicTriggerJsEsm = 'export default {key: "thing"};\n';

describe('scaffold', () => {
  describe('plural', () => {
    it('should work for expected cases', () => {
      plural('trigger').should.eql('triggers');
      plural('search').should.eql('searches');
      plural('create').should.eql('creates');
      plural('resource').should.eql('resources');
    });
    it('should not throw for unexpected input', () => {
      plural('whatever').should.eql('whatevers');
    });
  });

  describe('nounToKey', () => {
    it('should work for expected cases', () => {
      nounToKey('Cool Contact').should.eql('cool_contact');
      nounToKey('Cool Contact V2').should.eql('cool_contact_v2');
      nounToKey('Cool ContactV3').should.eql('cool_contact_v3');
      nounToKey('Cool Contact V 10').should.eql('cool_contact_v10');
    });
  });

  describe('isEsmJavaScript', () => {
    it('should detect ESM syntax', () => {
      isEsmJavaScript('export default {};').should.be.true();
      isEsmJavaScript('export default {\n  foo: "bar"\n};').should.be.true();
      isEsmJavaScript('\nexport default App;').should.be.true();
      isEsmJavaScript('  export default   {  };  ').should.be.true();
    });

    it('should not detect CommonJS as ESM', () => {
      isEsmJavaScript('module.exports = {};').should.be.false();
      isEsmJavaScript(
        'const App = {}; module.exports = App;',
      ).should.be.false();
    });

    it('should handle edge cases', () => {
      isEsmJavaScript('').should.be.false();
      isEsmJavaScript('// export default {}').should.be.false();
      isEsmJavaScript('/* export default {} */').should.be.false();
      isEsmJavaScript('const export_default = {};').should.be.false();
    });
  });

  describe('creating templates (JS)', () => {
    let tmpDir;
    beforeEach(async () => {
      tmpDir = await getNewTempDirPath();
    });

    const commonContext = createTemplateContext({
      actionType: 'trigger',
      noun: 'thing',
      includeIntroComments: true,
    });

    it('should create files without comments', async () => {
      const path = `${tmpDir}/triggers/thing.js`;
      await writeTemplateFile({
        destinationPath: path,
        templateType: 'trigger',
        language: 'js',
        preventOverwrite: true,
        templateContext: { ...commonContext, INCLUDE_INTRO_COMMENTS: false },
      });
      const newFile = await readFile(path, 'utf-8');
      should(newFile.includes('// Zapier will pass them in')).be.false();
    });

    it('should create files with comments', async () => {
      const path = `${tmpDir}/triggers/thing.js`;
      await writeTemplateFile({
        destinationPath: path,
        templateType: 'trigger',
        language: 'js',
        preventOverwrite: true,
        templateContext: commonContext,
      });
      const newFile = await readFile(path, 'utf-8');
      should(newFile.includes('// Zapier will pass them in')).be.true();
    });

    it('should not clobber files', async () => {
      const path = `${tmpDir}/triggers/thing.js`;

      await writeTemplateFile({
        destinationPath: path,
        templateType: 'trigger',
        language: 'js',
        preventOverwrite: true,
        templateContext: commonContext,
      });

      await writeTemplateFile({
        destinationPath: path,
        templateType: 'trigger',
        preventOverwrite: true,
        language: 'js',
        templateContext: commonContext,
        // @ts-ignore
      }).should.be.rejected();
    });

    it('should clobber files with an option', async () => {
      const path = `${tmpDir}/triggers/thing.js`;

      await writeTemplateFile({
        destinationPath: path,
        templateType: 'trigger',
        language: 'js',
        preventOverwrite: true,
        templateContext: createTemplateContext({
          actionType: 'trigger',
          noun: 'thing',
          includeIntroComments: true,
        }),
      });

      await writeTemplateFile({
        destinationPath: path,
        templateType: 'trigger',
        language: 'js',
        preventOverwrite: false,
        templateContext: createTemplateContext({
          actionType: 'trigger',
          noun: 'thing',
          includeIntroComments: true,
        }),
        // @ts-ignore
      }).should.not.be.rejected();
    });

    afterEach(async () => {
      await remove(tmpDir);
    });
  });

  describe('creating templates (TS)', () => {
    let tmpDir;
    beforeEach(async () => {
      tmpDir = await getNewTempDirPath();
    });

    const commonContext = createTemplateContext({
      actionType: 'trigger',
      noun: 'thing',
      includeIntroComments: true,
    });

    it('should create files without comments', async () => {
      const path = `${tmpDir}/src/triggers/thing.ts`;
      await writeTemplateFile({
        destinationPath: path,
        templateType: 'trigger',
        language: 'ts',
        preventOverwrite: true,
        templateContext: { ...commonContext, INCLUDE_INTRO_COMMENTS: false },
      });
      const newFile = await readFile(path, 'utf-8');
      should(newFile.includes('// Zapier will pass them in')).be.false();
    });

    it('should create files with comments', async () => {
      const path = `${tmpDir}/triggers/thing.ts`;
      await writeTemplateFile({
        destinationPath: path,
        templateType: 'trigger',
        language: 'ts',
        preventOverwrite: true,
        templateContext: commonContext,
      });
      const newFile = await readFile(path, 'utf-8');
      should(newFile.includes('// Zapier will pass them in')).be.true();
    });

    it('should not clobber files', async () => {
      const path = `${tmpDir}/triggers/thing.ts`;

      await writeTemplateFile({
        destinationPath: path,
        templateType: 'trigger',
        language: 'ts',
        preventOverwrite: true,
        templateContext: commonContext,
      });

      await writeTemplateFile({
        destinationPath: path,
        templateType: 'trigger',
        preventOverwrite: true,
        language: 'ts',
        templateContext: commonContext,
        // @ts-ignore
      }).should.be.rejected();
    });

    it('should clobber files with an option', async () => {
      const path = `${tmpDir}/triggers/thing.ts`;

      await writeTemplateFile({
        destinationPath: path,
        templateType: 'trigger',
        language: 'ts',
        preventOverwrite: true,
        templateContext: createTemplateContext({
          actionType: 'trigger',
          noun: 'thing',
          includeIntroComments: true,
        }),
      });

      await writeTemplateFile({
        destinationPath: path,
        templateType: 'trigger',
        language: 'ts',
        preventOverwrite: false,
        templateContext: createTemplateContext({
          actionType: 'trigger',
          noun: 'thing',
          includeIntroComments: true,
        }),
        // @ts-ignore
      }).should.not.be.rejected();
    });

    afterEach(async () => {
      await remove(tmpDir);
    });
  });

  describe('modifying entry file (JS)', () => {
    let tmpDir;
    beforeEach(async () => {
      tmpDir = await getNewTempDirPath();
    });

    it('should modify a file', async () => {
      // setup
      const indexPath = `${tmpDir}/index.js`;
      await outputFile(indexPath, basicIndexJs);
      await outputFile(`${tmpDir}/triggers/things.js`, basicTriggerJs);

      await updateEntryFile({
        language: 'js',
        indexFileResolved: indexPath,
        actionRelativeImportPath: `${tmpDir}/triggers/things.js`,
        actionImportName: 'thing',
        actionType: 'trigger',
      });

      const index = await readFile(indexPath, 'utf-8');

      should(index.includes('triggers: {')).be.true();
      should(index.includes('[thing.key]')).be.true();
    });

    afterEach(async () => {
      await remove(tmpDir);
    });
  });

  describe('modifying entry file (ESM JS)', () => {
    let tmpDir;
    beforeEach(async () => {
      tmpDir = await getNewTempDirPath();
    });

    it('should modify a file with ESM syntax', async () => {
      // setup
      const indexPath = `${tmpDir}/index.js`;
      await outputFile(indexPath, basicIndexJsEsm);
      await outputFile(`${tmpDir}/creates/things.js`, basicTriggerJsEsm);

      await updateEntryFile({
        language: 'js',
        indexFileResolved: indexPath,
        actionRelativeImportPath: './creates/things',
        actionImportName: 'thing',
        actionType: 'create',
      });

      const index = await readFile(indexPath, 'utf-8');

      // Should have import statement
      should(index.includes('import thing from')).be.true();
      // Should have creates section with computed property
      should(index.includes('creates: {')).be.true();
      should(index.includes('[thing.key]: thing')).be.true();
      // Should not have require statements (ESM doesn't use require)
      should(index.includes('require(')).be.false();
    });

    afterEach(async () => {
      await remove(tmpDir);
    });
  });

  describe('modifying entry file (TS)', () => {
    let tmpDir;
    beforeEach(async () => {
      tmpDir = await getNewTempDirPath();
    });

    it('should modify a file', async () => {
      // setup
      const indexPath = `${tmpDir}/src/index.ts`;
      await outputFile(indexPath, basicIndexTs);
      await outputFile(`${tmpDir}/src/triggers/things.ts`, basicTriggerTs);

      await updateEntryFile({
        language: 'ts',
        indexFileResolved: indexPath,
        actionRelativeImportPath: `${tmpDir}/src/triggers/things`,
        actionImportName: 'thing',
        actionType: 'trigger',
      });

      const index = await readFile(indexPath, 'utf-8');
      should(index.includes('triggers: {')).be.true();
      should(index.includes('[thing.key]')).be.true();
    });

    afterEach(async () => {
      await remove(tmpDir);
    });
  });
});
