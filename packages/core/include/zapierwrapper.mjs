// not intended to be loaded via require() or import() - copied during build step
import zapier from 'zapier-platform-core';

const appRaw = (await import('esmodule-app')).default;
export const handler = zapier.createAppHandler(appRaw);
