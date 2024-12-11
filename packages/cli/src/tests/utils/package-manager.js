require('should');
const mock = require('mock-fs');
const { getPackageManager } = require('../../utils/package-manager');

describe('package manager utils', () => {
  describe('getPackageManager', () => {
    it('should identify npm correctly', async () => {
      mock(
        {
          'package-lock.json': '',
        },
        {
          createCwd: true,
          createTmp: true,
        },
      );

      const man = await getPackageManager({
        yarn: false,
        pnpm: false,
      });

      man.should.containEql({
        executable: 'npm',
        useDoubleHyphenBeforeArgs: true,
      });

      mock.restore();
    });

    it('should identify yarn correctly', async () => {
      mock(
        {
          'yarn.lock': '',
        },
        {
          createCwd: true,
          createTmp: true,
        },
      );

      const man = await getPackageManager({
        yarn: false,
        pnpm: false,
      });

      man.should.containEql({
        executable: 'yarn',
        useDoubleHyphenBeforeArgs: false,
      });

      mock.restore();
    });

    it('should identify pnpm correctly', async () => {
      mock(
        {
          'pnpm-lock.yaml': '',
        },
        {
          createCwd: true,
          createTmp: true,
        },
      );

      const man = await getPackageManager({
        yarn: false,
        pnpm: false,
      });

      man.should.containEql({
        executable: 'pnpm',
        useDoubleHyphenBeforeArgs: true,
      });

      mock.restore();
    });

    it('should force yarn correctly', async () => {
      mock(
        {
          'package-lock.json': '',
        },
        {
          createCwd: true,
          createTmp: true,
        },
      );

      const man = await getPackageManager({
        yarn: true,
        pnpm: false,
      });

      man.should.containEql({
        executable: 'yarn',
        useDoubleHyphenBeforeArgs: false,
      });

      mock.restore();
    });

    it('should force pnpm correctly', async () => {
      mock(
        {
          'package-lock.json': '',
        },
        {
          createCwd: true,
          createTmp: true,
        },
      );

      const man = await getPackageManager({
        yarn: false,
        pnpm: true,
      });

      man.should.containEql({
        executable: 'pnpm',
        useDoubleHyphenBeforeArgs: true,
      });

      mock.restore();
    });

    it('should use npm by default', async () => {
      mock(
        {
          'actually-no-package-file.json': '',
        },
        {
          createCwd: true,
          createTmp: true,
        },
      );

      const man = await getPackageManager({
        yarn: false,
        pnpm: false,
      });

      man.should.containEql({
        executable: 'npm',
        useDoubleHyphenBeforeArgs: true,
      });

      mock.restore();
    });
  });
});
