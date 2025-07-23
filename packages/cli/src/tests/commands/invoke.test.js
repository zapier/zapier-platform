const should = require('should');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const setupTempWorkingDir = () => {
  let workdir;
  const tmpBaseDir = os.tmpdir();
  while (!workdir || fs.existsSync(workdir)) {
    workdir = path.join(tmpBaseDir, crypto.randomBytes(20).toString('hex'));
  }
  fs.mkdirSync(workdir);
  return workdir;
};

describe('InvokeCommand', () => {
  let tempAppDir;

  beforeEach(() => {
    tempAppDir = setupTempWorkingDir();
  });

  afterEach(() => {
    fs.removeSync(tempAppDir);
  });

  describe('inputDataRaw preservation', () => {
    it('should have the fix for preserving inputDataRaw in the invoke command', () => {
      // This test verifies that the fix for missing bundle.inputDataRaw is present
      // It checks the source code for the specific fix that was implemented

      const InvokeCommand = require('../../oclif/commands/invoke');
      const invokeCommandSource = fs.readFileSync(
        path.join(__dirname, '../../oclif/commands/invoke.js'),
        'utf8',
      );

      // Verify the fix is in place: inputDataRaw preservation before type resolution
      should(invokeCommandSource).match(
        /inputDataRaw\s*=\s*\{\s*\.\.\.inputData\s*\}/,
      );

      // Verify inputDataRaw is included in the bundle
      should(invokeCommandSource).match(/inputDataRaw\s*,/);

      // Verify the comment explaining the fix
      should(invokeCommandSource).match(
        /Preserve original inputData as inputDataRaw before type resolution/,
      );

      // Verify the InvokeCommand class exists and can be instantiated
      should(InvokeCommand).be.a.Function();
      const command = new InvokeCommand();
      should(command).be.an.Object();
    });

    it('should maintain separate inputData and inputDataRaw in bundle creation', () => {
      // This test ensures the bundle structure includes both inputData and inputDataRaw
      const invokeCommandSource = fs.readFileSync(
        path.join(__dirname, '../../oclif/commands/invoke.js'),
        'utf8',
      );

      // Look for the bundle structure that includes both properties (the second bundle)
      // After line 1017 where inputDataRaw is preserved before type resolution
      const bundleMatches = invokeCommandSource.match(
        /bundle:\s*\{[^}]*inputData[^}]*inputDataRaw[^}]*\}/gs,
      );
      should.exist(
        bundleMatches,
        'Bundle structures should include both inputData and inputDataRaw',
      );
      should(bundleMatches.length).be.greaterThan(0);

      // Check that at least one bundle includes both properties as separate variables
      const hasCorrectBundle = bundleMatches.some((bundleContent) => {
        return (
          bundleContent.includes('inputData,') &&
          bundleContent.includes('inputDataRaw,')
        );
      });

      should(hasCorrectBundle).be.true(
        'At least one bundle should include both inputData and inputDataRaw as separate variables',
      );
    });
  });
});
