require('should');
const { promisify, promisifyAll } = require('../../utils/promisify');

describe('promisify', () => {
  const divide = (a, b, cb) => {
    process.nextTick(() => {
      if (b === 0) {
        return cb(new Error('divide by zero'));
      }
      return cb(null, a / b);
    });
  };

  const divideSync = (a, b) => {
    return a / b;
  };

  const asyncModule = {
    divide,
    divideSync,
  };

  it('should convert async func to promise', (done) => {
    const divideAsync = promisify(divide);

    divideAsync(6, 3)
      .then((result) => {
        result.should.equal(2);
        done();
      })
      .catch(done);
  });

  it('should reject on error', (done) => {
    const divideAsync = promisify(divide);

    divideAsync(6, 0)
      .then(() => {
        done('expected an error');
      })
      .catch((err) => {
        err.message.should.equal('divide by zero');
        done();
      });
  });

  it('should promisify all non-sync methods in module', (done) => {
    const promisified = promisifyAll(asyncModule);
    Object.keys(promisified)
      .sort()
      .should.eql(['divide', 'divideAsync', 'divideSync']);

    promisified
      .divideAsync(6, 3)
      .then((result) => {
        result.should.equal(2);
        done();
      })
      .catch(done);
  });

  it('should not promisify sync methods in a module', () => {
    const promisified = promisifyAll(asyncModule);
    promisified.divideSync(6, 3).should.equal(2);
  });
});
