require('should');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { getPackageManager } = require('../../utils/package-manager');

describe('package manager utils', () => {
  describe('getPackageManager', () => {
    let origCwd;
    let tmpRoot;
    let appDir;

    // getPackageManager() searches up to 5 directories upward from
    // process.cwd(). Nest the app dir deep enough that the whole search stays
    // inside the temp dir and can't pick up lock files from the real machine.
    beforeEach(() => {
      origCwd = process.cwd();
      tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zapier-pm-test-'));
      appDir = path.join(tmpRoot, 'a', 'b', 'c', 'app');
      fs.mkdirSync(appDir, { recursive: true });
      process.chdir(appDir);
    });

    afterEach(() => {
      process.chdir(origCwd);
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    });

    // Paths are relative to the app dir, so '../x' lands in its parent.
    const writeFiles = (files) => {
      for (const [name, content] of Object.entries(files)) {
        fs.writeFileSync(path.join(appDir, name), content);
      }
    };

    it('should identify npm correctly', async () => {
      writeFiles({
        'package-lock.json': '',
      });

      const man = await getPackageManager({
        yarn: false,
        pnpm: false,
      });

      man.should.containEql({
        executable: 'npm',
        useDoubleHyphenBeforeArgs: true,
      });
    });

    it('should identify yarn correctly', async () => {
      writeFiles({
        'yarn.lock': '',
      });

      const man = await getPackageManager({
        yarn: false,
        pnpm: false,
      });

      man.should.containEql({
        executable: 'yarn',
        useDoubleHyphenBeforeArgs: false,
      });
    });

    it('should identify pnpm correctly', async () => {
      writeFiles({
        'pnpm-lock.yaml': '',
      });

      const man = await getPackageManager({
        yarn: false,
        pnpm: false,
      });

      man.should.containEql({
        executable: 'pnpm',
        useDoubleHyphenBeforeArgs: true,
      });
    });

    it('should force yarn correctly', async () => {
      writeFiles({
        'package-lock.json': '',
      });

      const man = await getPackageManager({
        yarn: true,
        pnpm: false,
      });

      man.should.containEql({
        executable: 'yarn',
        useDoubleHyphenBeforeArgs: false,
      });
    });

    it('should force pnpm correctly', async () => {
      writeFiles({
        'package-lock.json': '',
      });

      const man = await getPackageManager({
        yarn: false,
        pnpm: true,
      });

      man.should.containEql({
        executable: 'pnpm',
        useDoubleHyphenBeforeArgs: true,
      });
    });

    it('should use npm by default', async () => {
      writeFiles({
        'actually-no-package-file.json': '',
      });

      const man = await getPackageManager({
        yarn: false,
        pnpm: false,
      });

      man.should.containEql({
        executable: 'npm',
        useDoubleHyphenBeforeArgs: true,
      });
    });

    it('should use package.json packageManager if defined', async () => {
      writeFiles({
        'package.json': JSON.stringify({ packageManager: 'pnpm@6.32.4' }),
      });

      const man = await getPackageManager({});

      man.should.containEql({
        executable: 'pnpm',
        useDoubleHyphenBeforeArgs: true,
      });
    });

    it('should fall back to lock file if packageManager is undefined', async () => {
      writeFiles({
        'package.json': JSON.stringify({ name: 'test-app' }),
        'yarn.lock': '',
      });

      const man = await getPackageManager({});

      man.should.containEql({
        executable: 'yarn',
        useDoubleHyphenBeforeArgs: false,
      });
    });

    it('should find pnpm lock file in parent directory', async () => {
      writeFiles({
        'package.json': JSON.stringify({ name: 'nested-app' }),
        '../pnpm-lock.yaml': '',
      });

      const man = await getPackageManager({});

      man.should.containEql({
        executable: 'pnpm',
      });
    });

    it('should find packageManager in parent package.json', async () => {
      writeFiles({
        'package.json': JSON.stringify({ name: 'nested-app' }),
        '../package.json': JSON.stringify({ packageManager: 'yarn@3.0.0' }),
      });

      const man = await getPackageManager({});

      man.should.containEql({
        executable: 'yarn',
      });
    });

    it('should prefer local packageManager over parent lock file', async () => {
      writeFiles({
        'package.json': JSON.stringify({
          name: 'nested-app',
          packageManager: 'yarn@3.0.0',
        }),
        '../pnpm-lock.yaml': '',
      });

      const man = await getPackageManager({});

      man.should.containEql({
        executable: 'yarn',
      });
    });

    it('should prefer local lock file over parent lock file', async () => {
      writeFiles({
        'package.json': JSON.stringify({ name: 'nested-app' }),
        'yarn.lock': '',
        '../package-lock.json': '',
      });

      const man = await getPackageManager({});

      man.should.containEql({
        executable: 'yarn',
      });
    });
  });
});
