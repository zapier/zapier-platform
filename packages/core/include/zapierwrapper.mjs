// not intended to be loaded via require() or import() - copied during build step
import zapier from 'zapier-platform-core';
import { promises as fs } from 'fs';
import path from 'node:path';

const packageJsonPath = path.resolve(process.cwd(), 'package.json');
const packageJson = JSON.parse(await fs.readFile(packageJsonPath, { encoding: 'utf8' }));
const packageName = packageJson.name;

// https://nodejs.org/docs/latest-v22.x/api/all.html#all_packages_self-referencing-a-package-using-its-name
const appRaw = (await import(packageName)).default;
export const handler = zapier.createAppHandler(appRaw);
