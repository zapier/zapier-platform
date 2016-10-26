const createContext = ({command, args, argOpts} = {}) => {
  return {
    command, args, argOpts,
    line: (_line) => console.log(_line || '')
  };
};

module.exports = {
  createContext,
};
