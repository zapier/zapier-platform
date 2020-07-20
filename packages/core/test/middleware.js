'use strict';

const should = require('should');
const applyMiddleware = require('../src/middleware');

describe('middleware', () => {
  it('should apply middlewares', (done) => {
    const before = (input) => {
      input.n = 1;
      return Promise.resolve(input);
    };

    const plusOne = (output) => {
      output.results = [output.input.n + 1];
      return Promise.resolve(output);
    };

    const app = applyMiddleware([before], [plusOne], () => Promise.resolve({}));

    app({})
      .then((envelope) => {
        envelope.results.should.eql([2]);
        done();
      })
      .catch(done);
  });

  it('should apply no middlewares', (done) => {
    const app = applyMiddleware([], [], () => Promise.resolve(undefined));

    app()
      .then((output) => {
        should(output.__type).eql('OutputEnvelope');
        should(output.input).eql(undefined);
        should(output.results).eql(undefined);
        done();
      })
      .catch(done);
  });
});
