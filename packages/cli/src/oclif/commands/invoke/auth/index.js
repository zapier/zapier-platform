module.exports = {
  startAuth: require('./start').startAuth,
  testAuth: require('./test').testAuth,
  getAuthLabel: require('./label').getAuthLabel,
  refreshAuth: require('./refresh').refreshAuth,
};
