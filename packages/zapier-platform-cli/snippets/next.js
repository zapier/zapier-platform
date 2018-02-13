// this file should use code that doesn't exist in the LBAMDA_VERSION
// it'll need to be updated as the lambda version changes and more features are allowed
// see: http://node.green/

const cube = n => {
  return n ** 3;
};

console.log('3 cubed is', cube(3));
console.log(typeof Atomics);
