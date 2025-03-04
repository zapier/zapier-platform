// not intended to be loaded via require() or import() - copied during build step
import zapier from 'zapier-platform-core';

// TODO: Find the package name in package.json instead of hardcoding "esmodule-app"
// https://nodejs.org/docs/latest-v22.x/api/all.html#all_packages_self-referencing-a-package-using-its-name
const appRaw = (await import('esmodule-app')).default;
export const handler = zapier.createAppHandler(appRaw);
