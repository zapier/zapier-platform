const assert = require('node:assert/strict');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const {
  mkdtemp,
  rm,
  writeFile,
  readFile,
  copyFile,
  mkdir,
  realpath,
} = require('node:fs/promises');

describe('zapierwrapper.js in CommonJS', () => {
  let tempDir;
  beforeEach(async () => {
    // realpath is needed to resolve symlinks. Not sure why macOS returns a
    // symlink /var instead of /private/var for tmpdir()
    tempDir = await realpath(await mkdtemp(join(tmpdir(), 'zapier-test-')));

    await writeFile(join(tempDir, 'index.js'), `module.exports = {} }`);

    const wrapperPath = resolve(__dirname, '../include/zapierwrapper.js');
    await copyFile(wrapperPath, join(tempDir, 'zapierwrapper.js'));

    // Make a fake zapier-platform-core
    const coreDir = join(tempDir, 'node_modules', 'zapier-platform-core');
    await mkdir(coreDir, { recursive: true });
    await writeFile(
      join(coreDir, 'package.json'),
      JSON.stringify({
        name: 'zapier-platform-core',
        version: '1.0.0',
        main: 'index.js',
      }),
    );
    // This fake Lambda handler just returns a function that returns the input
    await writeFile(
      join(coreDir, 'index.js'),
      'module.exports = { createAppHandler: (appPath) => function() { return appPath; } };',
    );
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it('should load index.js without `main` or `exports` in package.json', async () => {
    await writeFile(
      join(tempDir, 'package.json'),
      JSON.stringify({
        name: 'test-app',
        version: '1.0.0',
      }),
    );

    const wrapper = require(join(tempDir, 'zapierwrapper.js'));
    assert.equal(wrapper.handler(), join(tempDir, 'index.js'));
  });

  it('should load always index.js, ignoring `main` in package.json', async () => {
    await writeFile(
      join(tempDir, 'package.json'),
      JSON.stringify({
        name: 'test-app',
        version: '1.0.0',
        // Maybe someday we'll want to respect `main` for CommonJS
        main: 'app.js',
      }),
    );

    const wrapper = require(join(tempDir, 'zapierwrapper.js'));
    assert.equal(wrapper.handler(), join(tempDir, 'index.js'));
  });
});

describe('zapierwrapper.mjs in ESM', () => {
  let tempDir;
  beforeEach(async () => {
    // realpath is needed to resolve symlinks. Not sure why macOS returns a
    // symlink /var instead of /private/var for tmpdir()
    tempDir = await realpath(await mkdtemp(join(tmpdir(), 'zapier-test-')));

    const wrapperPath = resolve(__dirname, '../include/zapierwrapper.mjs');
    const wrapperText = (await readFile(wrapperPath, 'utf8')).replaceAll(
      '{REPLACE_ME_PACKAGE_NAME}',
      'test-app',
    );
    await writeFile(join(tempDir, 'zapierwrapper.js'), wrapperText);

    // Make a fake zapier-platform-core
    const coreDir = join(tempDir, 'node_modules', 'zapier-platform-core');
    await mkdir(coreDir, { recursive: true });
    await writeFile(
      join(coreDir, 'package.json'),
      JSON.stringify({
        name: 'zapier-platform-core',
        version: '1.0.0',
        main: 'index.js',
      }),
    );
    // This fake Lambda handler just returns a function that returns the input
    await writeFile(
      join(coreDir, 'index.js'),
      'module.exports = { createAppHandler: (appRaw) => function() { return appRaw; } };',
    );
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it('should error if no `exports` in package.json', async () => {
    await writeFile(
      join(tempDir, 'package.json'),
      JSON.stringify({
        name: 'test-app',
        version: '1.0.0',
        main: 'index.js',
        type: 'module',
      }),
    );

    await assert.rejects(async () => {
      await import(join(tempDir, 'zapierwrapper.js'));
    }, /specify a valid entry point using `exports`/);
  });

  it('should load default export', async () => {
    await writeFile(
      join(tempDir, 'package.json'),
      JSON.stringify({
        name: 'test-app',
        version: '1.0.0',
        exports: './index.js',
        type: 'module',
      }),
    );
    await writeFile(
      join(tempDir, 'index.js'),
      "export default { name: 'i-am-index' };",
    );

    const wrapper = await import(join(tempDir, 'zapierwrapper.js'));
    assert.deepEqual(wrapper.handler(), { name: 'i-am-index' });
  });

  it('should load named exports', async () => {
    await writeFile(
      join(tempDir, 'package.json'),
      JSON.stringify({
        name: 'test-app',
        version: '1.0.0',
        exports: './index.js',
        type: 'module',
      }),
    );
    await writeFile(
      join(tempDir, 'index.js'),
      "export const name = 'i-am-index';\n" +
        "export const platformVersion = '1.2.3';",
    );

    const wrapper = await import(join(tempDir, 'zapierwrapper.js'));
    const exported = wrapper.handler();
    assert.equal(exported.name, 'i-am-index');
    assert.equal(exported.platformVersion, '1.2.3');
  });

  it('should load conditional exports', async () => {
    await writeFile(
      join(tempDir, 'package.json'),
      JSON.stringify({
        name: 'test-app',
        version: '1.0.0',
        exports: {
          require: './app.cjs',
          import: './app.mjs',
        },
        type: 'module',
      }),
    );
    await writeFile(
      join(tempDir, 'app.mjs'),
      "export default { name: 'i-am-app-mjs' };",
    );

    const wrapper = await import(join(tempDir, 'zapierwrapper.js'));
    assert.deepEqual(wrapper.handler(), { name: 'i-am-app-mjs' });
  });
});
