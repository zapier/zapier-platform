// This module provides convenience functions for working with Generators:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator

// Filters an iterable using a predicate function. Example:
//
// const isEven = (x) => x % 2 === 0;
// function* generateNumbers() {
//   for (let i = 0; i < 100; i++) {
//     yield i;
//   }
// }
// const generateEvenNumbers = iterfilter(isEven, generateNumbers());
function* iterfilter(predicate, iterable) {
  for (const item of iterable) {
    if (predicate(item)) {
      yield item;
    }
  }
}

// Maps an iterable using a function, like Array.prototype.map. Example:
//
//  const double = (x) => x * 2;
//  function* generateNumbers() {
//    for (let i = 0; i < 100; i++) {
//      yield i;
//    }
//  }
//  const generateDoubledNumbers = itermap(double, generateNumbers());
function* itermap(fn, iterable) {
  for (const item of iterable) {
    yield fn(item);
  }
}

module.exports = {
  iterfilter,
  itermap,
};
