'use strict';

const stream = require('stream');
const Console = require('console').Console;

const createLoggerConsole = (input) => {
  const doWrite = (data, chunk, encoding, next) => {
    const promise = input._zapier.logger(chunk.toString(), data);

    // stash the promise in input, so we can wait on it later
    input._zapier.promises.push(promise);

    next();

    (console[data.log_type] || console.log)(chunk.toString());
  };

  const stdout = new stream.Writable({
    write: doWrite.bind(undefined, { log_type: 'console' }),
  });

  const stderr = new stream.Writable({
    write: doWrite.bind(undefined, { log_type: 'error' }),
  });

  return new Console(stdout, stderr);
};

module.exports = createLoggerConsole;
