// this is needed for the old help command so it can import new command info

module.exports = {
  init: require('./commands/init'),
  versions: require('./commands/versions')
};
