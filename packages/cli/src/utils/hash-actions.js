const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Keep big deps external (hash lockfile separately to account for dep changes)
const EXTERNAL = ['zapier-platform-core'];

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/**
 * Discovers action entry points from an app's index.js
 *
 * Strategy:
 * 1. Load the app's index.js using require()
 * 2. Extract actions from triggers, searches, creates objects
 * 3. Use Node's module cache to find the source file for each action
 *
 * @param {string} appDir Path to app directory containing index.js
 * @returns {Array<{key: string, file: string, type: string}>} Array of action metadata
 */
function discoverActions(appDir) {
  const indexPath = path.join(appDir, 'index.js');

  if (!fs.existsSync(indexPath)) {
    throw new Error(`No index.js found in ${appDir}`);
  }

  // Clear require cache for this app to get fresh module info
  const appModules = Object.keys(require.cache).filter((mod) =>
    mod.startsWith(appDir),
  );
  appModules.forEach((mod) => delete require.cache[mod]);

  // Load the app
  let app;
  try {
    app = require(indexPath);
  } catch (error) {
    throw new Error(`Failed to load index.js: ${error.message}`);
  }

  const actions = [];

  // Helper to find the source file for an action object
  const findSourceFile = (actionObj) => {
    // Search module cache for modules that export this action
    for (const [filename, module] of Object.entries(require.cache)) {
      if (!filename.startsWith(appDir)) continue;
      if (filename === indexPath) continue; // Skip index.js itself

      // Check if this module's exports match the action object
      if (module.exports === actionObj) {
        return filename;
      }
    }
    return null;
  };

  // Extract triggers
  if (app.triggers) {
    for (const [key, trigger] of Object.entries(app.triggers)) {
      const file = findSourceFile(trigger);
      if (file) {
        actions.push({ key, file, type: 'trigger' });
      }
    }
  }

  // Extract searches
  if (app.searches) {
    for (const [key, search] of Object.entries(app.searches)) {
      const file = findSourceFile(search);
      if (file) {
        actions.push({ key, file, type: 'search' });
      }
    }
  }

  // Extract creates
  if (app.creates) {
    for (const [key, create] of Object.entries(app.creates)) {
      const file = findSourceFile(create);
      if (file) {
        actions.push({ key, file, type: 'create' });
      }
    }
  }

  // Extract resources (which can contain nested triggers/searches/creates)
  if (app.resources) {
    for (const [key, resource] of Object.entries(app.resources)) {
      const file = findSourceFile(resource);
      if (file) {
        actions.push({ key, file, type: 'resource' });
      }
    }
  }

  return actions;
}

/**
 * Bundle and hash a single action file
 *
 * @param {string} entryFile Absolute path to action file
 * @returns {Promise<{outputHash: string, inputs: string[]}>}
 */
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

/**
 * Hash the lockfile to detect dependency changes
 *
 * @param {string} appDir Path to app directory
 * @returns {string|null} Hash of lockfile or null if not found
 */
function lockfileHash(appDir) {
  const lockfile = ['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock']
    .map((f) => path.resolve(appDir, f))
    .find(fs.existsSync);

  if (!lockfile) return null;
  return sha256(fs.readFileSync(lockfile));
}

/**
 * Generate action hashes for an entire app
 *
 * @param {string} appDir Path to app directory
 * @returns {Promise<Object>} Hash manifest with depHash, actions (organized by type), and createdAt
 */
async function generateActionHashes(appDir) {
  const actions = discoverActions(appDir);

  if (actions.length === 0) {
    throw new Error('No actions found to hash');
  }

  const byType = {
    triggers: {},
    searches: {},
    creates: {},
    resources: {},
  };

  const typeMap = {
    trigger: 'triggers',
    search: 'searches',
    create: 'creates',
    resource: 'resources',
  };

  for (const { key, file, type } of actions) {
    const { outputHash, inputs } = await hashAction(file);
    const typePlural = typeMap[type];
    byType[typePlural][key] = {
      hash: outputHash,
      entry: path.relative(appDir, file),
      inputs,
    };
  }

  return {
    depHash: lockfileHash(appDir),
    actions: byType,
    createdAt: new Date().toISOString(),
  };
}

module.exports = {
  generateActionHashes,
  discoverActions,
  hashAction,
  lockfileHash,
};
