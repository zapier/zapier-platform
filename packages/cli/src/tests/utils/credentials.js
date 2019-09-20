const { isSamlEmail } = require('../../utils/credentials');

describe('SAML checking', () => {
  it('should throw for bad emails', async () => {
    await isSamlEmail('asdf').should.be.rejectedWith('Invalid email');
  });

  it('should be false for non-saml emails', async () => {
    const res = await isSamlEmail('bruce@wayneenterprises.com');
    res.should.be.false();
  });

  // TODO: need an actual saml email for this to work. They probably don't want their email in a test.
  it.skip('should work for saml emails', async () => {
    const res = await isSamlEmail('alfred@wayneenterprises.com');
    res.should.be.true();
  });
});
