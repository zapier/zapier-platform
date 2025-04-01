'use strict';

const _ = require('lodash');

const envelope = require('./tools/envelope');

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

const enrichErrorMessages = (error, input) => {
  if (error.doNotContextify) {
    throw error;
  }
  if (input._zapier && input._zapier.whatHappened) {
    const details = input._zapier.whatHappened.map((f) => `  ${f}`).join('\n');
    error.message = `${error.message}\nWhat happened:\n${details}\n  ${error.message}`;
  }
  throw error;
};

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
    const beforeMiddleware = async (beforeInput) => {
      let newInput = beforeInput;
      for (const func of befores) {
        const args = [newInput].concat(options.extraArgs);
        const result = func.apply(undefined, args);
        if (typeof result !== 'object') {
          throw new Error('Middleware should return an object.');
        }
        newInput = result;
      }
      return newInput;
    };

    const afterMiddleware = async (output) => {
      for (const func of afters) {
        const args = [output].concat(options.extraArgs);
        const maybePromise = func.apply(undefined, args);
        if (typeof maybePromise !== 'object') {
          throw new Error('Middleware should return an object.');
        }
        output = await Promise.resolve(maybePromise);
        output = ensureEnvelope(output);
      }
      return output;
    };

    const promise = async (input) => {
      const newInput = await beforeMiddleware(input);
      try {
        let output = await app(newInput);
        output = await ensureEnvelope(output);
        output.input = newInput;
        return afterMiddleware(output);
      } catch (error) {
        return enrichErrorMessages(error, newInput);
      }
    };

    return promise(input);
  };
};

module.exports = applyMiddleware;
