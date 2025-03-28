'use strict';

require('should');

const errors = require('../../src/errors');
// const ZapierPromise = require('../../src/tools/promise');

describe('contextual promise', () => {
  // const contextifyErrorFn = (err) => {
  //   try {
  //     err.message = `${err.message} contextified!`;
  //   } catch (_err) {}
  // };

  it('should handle normal promises', (done) => {
    const promise = Promise.resolve({});

    promise
      .then(() => 0)
      .then(() => {
        return 'hello world';
      })
      .then((message) => {
        message.should.eql('hello world');
        done();
      })
      .catch(done);
  });

  it('should contextify errors raised in then handler', (done) => {
    // const promise = ZapierPromise.resolve({}).bind(
    //   ZapierPromise.makeContext(contextifyErrorFn),
    // );
    // TODO we need to pass contextify here somehow
    const promise = Promise.resolve({});

    promise
      .then(() => {
        throw new Error('whoops');
      })
      .catch((err) => {
        err.message.should.eql('whoops contextified!');

        // our new message should *not* be prefixed to the stack string
        const firstStackLine = err.stack.split('\n')[0];
        firstStackLine.should.match(/^Error: whoops$/);

        done();
      })
      .catch(done);
  });

  it('should not contextify errors that have opted out', (done) => {
    // const promise = ZapierPromise.resolve({}).bind(
    //   ZapierPromise.makeContext(contextifyErrorFn),
    // );
    // TODO we need to pass contextify here somehow
    const promise = Promise.resolve({});

    promise
      .then(() => {
        throw new errors.ResponseError({
          status: 400,
          headers: {
            get: () => {},
          },
          content: '',
          request: {
            url: '',
          },
        });
      })
      .catch((err) => {
        err.message.should.eql(
          '{"status":400,"headers":{},"content":"","request":{"url":""}}',
        );
        done();
      })
      .catch(done);
  });

  it.skip('should contextify errors thrown by promises returned from then handler', (done) => {
    const promise = Promise.resolve({});

    promise
      .then(() => {
        return new Promise(() => {
          throw new Error('whoops');
        });
      })
      .catch((err) => {
        err.message.should.eql('whoops contextified!');
        done();
      })
      .catch(done);
  });

  it.skip('should contextify errors rejected by promises returned from then handler', (done) => {
    const promise = Promise.resolve({});

    promise
      .then(() => {
        return new Promise((resolve, reject) => {
          reject(new Error('whoops'));
        });
      })
      .catch((err) => {
        err.message.should.eql('whoops contextified!');
        done();
      })
      .catch(done);
  });

  it.skip('should handle rejected outright promises', (done) => {
    const promise = new Promise((resolve, reject) => {
      reject(new Error('whoops'));
    });

    promise
      .catch((err) => {
        err.message.should.eql('whoops contextified!');
        done();
      })
      .catch(done);
  });

  it('should handle two arg .then calls', (done) => {
    // const promise = ZapierPromise.resolve({}).bind(
    //   ZapierPromise.makeContext(contextifyErrorFn),
    // );
    // TODO we need to pass contextify here somehow
    const promise = Promise.resolve({});

    promise
      .then(() => {
        throw new Error('whoops');
      })
      .then(
        () => {},
        (err) => {
          err.message.should.eql('whoops contextified!');
          done();
        },
      )
      .catch(done);
  });

  it('should inject context on chained promises', (done) => {
    // const promise = ZapierPromise.resolve({}).bind(
    //   ZapierPromise.makeContext(contextifyErrorFn),
    // );
    // TODO we need to pass contextify here somehow
    const promise = Promise.resolve({});

    promise
      .then(() => {
        return Promise.resolve({});
      })
      .then(() => {
        return Promise.resolve({});
      })
      .then(() => {
        throw new Error('whoops');
      })
      .catch((err) => {
        err.message.should.eql('whoops contextified!');
        done();
      })
      .catch(done);
  });
});
