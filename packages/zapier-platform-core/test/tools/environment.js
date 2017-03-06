require('should');
const mock = require('mock-fs');

const tools = require('../../src/tools/exported');
const fake_file = 'CITY="boulder"\nNAME="david"\nPIZZA="Blackjack"\n';

describe('read env', () => {
  beforeEach(() => {
    mock({
      '.environment': fake_file,
      'secrets': 'SECRET=very_secret_thing'
    });
  });

  it('should parse a config', (done) => {
    tools.env.inject();
    process.env.PIZZA.should.equal('Blackjack');
    done();
  });

  it('should parse a with filename', (done) => {
    tools.env.inject('secrets');
    process.env.SECRET.should.equal('very_secret_thing');
    done();
  });

  afterEach(() => {
    mock.restore();
  });
});


