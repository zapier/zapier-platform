// this is needed for the old help command so it can import new command info

module.exports = {
  init: require('./commands/init'),
  logout: require('./commands/logout'),
  login: require('./commands/login'),
  versions: require('./commands/versions')
};
