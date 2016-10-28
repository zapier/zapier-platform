export const loadBabel = () => {
  process.env.BABEL_DISABLE_CACHE = 1;
  require('babel-core/register');
  try {
    require('babel-polyfill');
  } catch(err) {
    process.babelAlreadyLoaded = true;
  }
};
