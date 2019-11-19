// this is needed for the old help command so it can import new command info

module.exports = {
  analytics: require('./commands/analytics'),
  apps: require('./commands/apps'),
  build: require('./commands/build'),
  deprecate: require('./commands/deprecate'),
  history: require('./commands/history'),
  init: require('./commands/init'),
  login: require('./commands/login'),
  logout: require('./commands/logout'),
  migrate: require('./commands/migrate'),
  promote: require('./commands/promote'),
  push: require('./commands/push'),
  scaffold: require('./commands/scaffold'),
  test: require('./commands/test'),
  upload: require('./commands/upload'),
  users: require('./commands/users/get'),
  validate: require('./commands/validate'),
  versions: require('./commands/versions')
};
