'use strict';

const _ = require('lodash');

const envelope = require('./tools/envelope');
const ZapierPromise = require('./tools/promise');

/**
   Applies before and after middleware functions, returning
   a function that takes arguments and returns a promise that
   returns a result.

   A before middleware function looks like this:

   (input) => { Promise.resolve(input); }

   It takes a input object, and returns a promise that returns
   the new input object, to pass down to the next middleware in the
   chain. For an app middleware the input object would include
   the input event, and any other meta information or utility objects.
   For example here is a before middleware that adds a 'z'
   property to the input:

   (input) => {
   input.z = {};
   return Promise.resolve(input);
   };

   Before middleware can modify or clone the input input, and
   subsqeuent middlewares will receive the new input.

   After middleware takes a output object, which includes the results
   from previous after middlewares. The output object also include the
   input object returned by the before middlewares:

   (output) => Promise.resolve(output)

   options.skipEnvelope parameter controls whether or not the output object
   should have an wrapper envelope that includes the input, or just return the raw
   output. The default is false.
*/

const applyMiddleware = (befores, afters, app, options) => {
  options = _.defaults({}, options, {
    skipEnvelope: false,
    extraArgs: [],
  });

  const ensureEnvelope = (maybeEnvelope) => {
    if (!options.skipEnvelope) {
      // they returned just the results; put them back in the envelope
      return envelope.ensureOutputEnvelope(maybeEnvelope);
    }
    return maybeEnvelope;
  };

  return (input) => {
    const context = ZapierPromise.makeContext();
    const resolve = (val) => ZapierPromise.resolve(val).bind(context);

    const beforeMiddleware = (beforeInput) => {
      return befores.reduce((collector, func) => {
        return collector.then((newInput) => {
          newInput._addContext = context.addContext;
          const args = [newInput].concat(options.extraArgs);
          const result = func.apply(undefined, args);
          if (typeof result !== 'object') {
            throw new Error('Middleware should return an object.');
          }
          return result;
        });
      }, resolve(beforeInput));
    };

    const afterMiddleware = (output) => {
      return afters.reduce((collector, func) => {
        return collector.then((newOutput) => {
          newOutput._addContext = context.addContext;
          const args = [newOutput].concat(options.extraArgs);
          const maybePromise = func.apply(undefined, args);
          if (typeof maybePromise !== 'object') {
            throw new Error('Middleware should return an object.');
          }
          return resolve(maybePromise).then(ensureEnvelope);
        });
      }, resolve(output));
    };

    const promise = beforeMiddleware(input).then((newInput) => {
      return resolve(app(newInput))
        .then(ensureEnvelope)
        .then((output) => {
          output.input = newInput;
          return afterMiddleware(output);
        });
    });

    return promise;
  };
};

module.exports = applyMiddleware;
