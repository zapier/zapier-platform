'use strict';

// Used by test/logger.js's "should let the process exit promptly" test.
// logger.end(timeoutToAbort) races the log server's response against a
// setTimeout(timeoutToAbort) to bound how long we wait before force-aborting
// a slow/hung connection. That timer is backed by a real Timeout handle that
// keeps the event loop - and so a Lambda execution environment - from going
// idle until it fires, unless it's explicitly cancelled once the race is
// decided. This has to be a real child process (not something run inside the
// test runner's own process) because what's being checked is whether the
// process goes idle promptly, not whether some in-process promise resolves
// quickly - those are different things, and the bug this guards against only
// shows up as the former.
const http = require('http');
const createLogger = require('../../src/tools/create-logger');

const server = http.createServer((req, res) => {
  req.resume();
  req.on('end', () => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{}');
  });
});

server.listen(0, async () => {
  const { port } = server.address();
  const logger = createLogger(
    {},
    { endpoint: `http://127.0.0.1:${port}/input`, token: 'fake-token' },
  );
  logger('hello', {});

  // The local server above responds near-instantly, well before this fires.
  // If logger.end() leaves the abort timer running instead of cancelling it
  // once the response wins the race, this process won't exit until it does.
  await logger.end(10000);

  server.close();
  // Deliberately no process.exit() call here: we want to observe whether
  // Node considers itself done on its own.
});
