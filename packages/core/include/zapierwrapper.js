// not intended to be loaded via require() - copied during build step
import path from 'node:path';
import zapier from 'zapier-platform-core';

const appPath = path.basename(process.cwd());

export const handler = zapier.createAppHandler(appPath);
