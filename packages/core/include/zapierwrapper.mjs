// not intended to be loaded via require() - copied during build step
import { createRequire } from 'module';
import path from 'node:path';
import zapier from 'zapier-platform-core';

const require = createRequire(import.meta.url);
let appPath;

try {
    appPath = require.resolve(process.cwd());
} catch (e) {
    // if it failed, try to resolve the app path with self-referencing
    // in case index.js is not in the root directory
    try {
        appPath = require.resolve(path.basename(process.cwd()));
    } catch (e2) {
        throw new Error("Failed to resolve app path - make sure you have a package.json in the root directory");
    }
}

export { appPath };
export const handler = zapier.createAppHandler(appPath);
