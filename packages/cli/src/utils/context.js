const createContext = ({ command, args, argOpts } = {}) => {
  return {
    command,
    args,
    argOpts,
    line: _line => {
      // json-like formats should only print json output, not text
      if (!['json', 'raw'].includes(argOpts.format)) {
        console.log(_line || '');
      }
    }
  };
};

module.exports = {
  createContext
};
