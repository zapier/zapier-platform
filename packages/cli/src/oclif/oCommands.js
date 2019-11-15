// this is needed for the old help command so it can import new command info

module.exports = {
  analytics: require('./commands/analytics'),
  apps: require('./commands/apps'),
  deprecate: require('./commands/deprecate'),
  env: require('./commands/env/get'), // oclif actually routes, just need to import something valid here
  history: require('./commands/history'),
  init: require('./commands/init'),
  login: require('./commands/login'),
  logout: require('./commands/logout'),
  migrate: require('./commands/migrate'),
  promote: require('./commands/promote'),
  scaffold: require('./commands/scaffold'),
  test: require('./commands/test'),
  validate: require('./commands/validate'),
  versions: require('./commands/versions')
};
