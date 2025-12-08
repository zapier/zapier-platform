// scripts/hash-actions.js
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ACTIONS_DIR = path.resolve(__dirname, './creates');
const ARTIFACT_DIR = path.resolve(__dirname, './artifact');

const timestamp = new Date().getTime().toString();
console.log(timestamp);
const OUTFILE = path.join(ARTIFACT_DIR, `${timestamp}-action-hashes.json`);

// Keep big deps external (hash lockfile separately to account for dep changes)
const EXTERNAL = ['zapier-platform-core'];

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function listActionFiles() {
  // naïve: all .js files in actions/ (works for most CLI apps)
  return fs
    .readdirSync(ACTIONS_DIR)
    .filter((f) => f.endsWith('.js'))
    .map((f) => path.join(ACTIONS_DIR, f));
}

async function hashAction(entryFile) {
  const result = await esbuild.build({
    entryPoints: [entryFile],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node22',
    write: false,
    metafile: true,
    legalComments: 'none',
    sourcemap: false,
    treeShaking: false,
    external: EXTERNAL,
  });

  const bundledBytes = result.outputFiles[0].contents;
  const outputHash = sha256(bundledBytes);

  // Normalize input paths to be stable across machines
  const inputs = Object.keys(result.metafile.inputs)
    .map((p) => path.relative(process.cwd(), path.resolve(p)))
    .sort();

  return { outputHash, inputs };
}

function lockfileHash() {
  const lockfile = ['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock']
    .map((f) => path.resolve(process.cwd(), f))
    .find(fs.existsSync);
  if (!lockfile) return null;
  return sha256(fs.readFileSync(lockfile));
}

(async () => {
  const files = listActionFiles();
  if (!files.length) {
    console.error('No action files found in ./actions');
    process.exit(1);
  }

  const byKey = {};
  for (const file of files) {
    // derive action key from module export if possible; fallback to filename
    const action = require(file);
    const actionKey = (action && action.key) || path.basename(file, '.js');

    const { outputHash, inputs } = await hashAction(file);
    byKey[actionKey] = {
      hash: outputHash,
      entry: path.relative(process.cwd(), file),
      inputs,
    };
  }

  const depHash = lockfileHash();
  const payload = {
    depHash,
    actions: byKey,
    createdAt: new Date().toISOString(),
  };

  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  fs.writeFileSync(OUTFILE, JSON.stringify(payload, null, 2));
  console.log(`Wrote ${path.relative(process.cwd(), OUTFILE)}`);
})();
