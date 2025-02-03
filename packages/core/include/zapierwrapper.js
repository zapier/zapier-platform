// not intended to be loaded via require() - copied during build step
import zapier from 'zapier-platform-core';

const appPath = process.cwd();

export const handler = zapier.createAppHandler(appPath);
