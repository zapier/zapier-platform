const should = require('should');
const { remove, readFile, outputFile } = require('fs-extra');
const {
  plural,
  nounToKey,
  writeTemplateFile,
  createTemplateContext,
  updateEntryFile,
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
const basicTrigger = 'module.exports = {key: "thing"}\n';

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

  describe('creating templates', () => {
    let tmpDir;
    beforeEach(async () => {
      tmpDir = await getNewTempDirPath();
    });

    it('should create files without comments', async () => {
      const path = `${tmpDir}/triggers/thing.js`;
      await writeTemplateFile(
        'trigger',
        createTemplateContext({ actionType: 'trigger', noun: 'thing' }),
        path
      );
      const newFile = await readFile(path, 'utf-8');
      should(newFile.includes('// Zapier will pass them in')).be.false();
    });

    it('should create files with comments', async () => {
      const path = `${tmpDir}/triggers/thing.js`;
      await writeTemplateFile(
        'trigger',
        createTemplateContext({
          actionType: 'trigger',
          noun: 'thing',
          includeIntroComments: true,
        }),
        path
      );
      const newFile = await readFile(path, 'utf-8');
      should(newFile.includes('// Zapier will pass them in')).be.true();
    });

    it('should not clobber files', async () => {
      const path = `${tmpDir}/triggers/thing.js`;
      await writeTemplateFile(
        'trigger',
        createTemplateContext({
          actionType: 'trigger',
          noun: 'thing',
          includeIntroComments: true,
        }),
        path
      );

      await writeTemplateFile(
        'trigger',
        createTemplateContext({
          actionType: 'trigger',
          noun: 'thing',
          includeIntroComments: true,
        }),
        path,
        true
      ).should.be.rejected();
    });

    it('should clobber files with an option', async () => {
      const path = `${tmpDir}/triggers/thing.js`;
      await writeTemplateFile(
        'trigger',
        createTemplateContext({
          actionType: 'trigger',
          noun: 'thing',
          includeIntroComments: true,
        }),
        path
      );

      await writeTemplateFile(
        'trigger',
        createTemplateContext({
          actionType: 'trigger',
          noun: 'thing',
          includeIntroComments: true,
        }),
        path
      ).should.not.be.rejected();
    });

    afterEach(async () => {
      await remove(tmpDir);
    });
  });

  describe('modifying entry file', () => {
    let tmpDir;
    beforeEach(async () => {
      tmpDir = await getNewTempDirPath();
    });

    it('should modify a file', async () => {
      // setup
      const indexPath = `${tmpDir}/index.js`;
      await outputFile(indexPath, basicIndexJs);
      await outputFile(`${tmpDir}/triggers/things.js`, basicTrigger);

      await updateEntryFile(
        indexPath,
        'getThing',
        `${tmpDir}/triggers/things`,
        'trigger',
        'thing'
      );

      // shouldn't throw
      await readFile(indexPath, 'utf-8');
    });

    afterEach(async () => {
      await remove(tmpDir);
    });
  });
});
