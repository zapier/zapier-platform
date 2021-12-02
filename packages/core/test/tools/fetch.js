const nock = require('nock');
const should = require('should');

const fetch = require('../../src/tools/fetch');
const FormData = require('form-data');

const { HTTPBIN_URL } = require('../constants');

describe('node-fetch patch', () => {
  it('should not hang due to backpressure', async () => {
    nock('https://fake.zapier.com')
      .put('/upload')
      .reply(200, (uri, responseBody) => {
        return {
          length: Buffer.from(responseBody, 'hex').length,
        };
      });

    const downloadResponse = await fetch(`${HTTPBIN_URL}/stream-bytes/35000`);
    const uploadResponse = await fetch('https://fake.zapier.com/upload', {
      method: 'PUT',
      body: downloadResponse.body,
    });

    const result = await uploadResponse.json();
    should(result).eql({ length: 35000 });
  });

  it('should upload form data', async () => {
    const downloadResponse = await fetch(`${HTTPBIN_URL}/stream-bytes/100`);

    const form = new FormData();
    form.append('name', 'hello');
    form.append('data', downloadResponse.body);

    const uploadResponse = await fetch(`${HTTPBIN_URL}/post`, {
      method: 'POST',
      body: form,
    });

    const result = await uploadResponse.json();
    should(result.form.name).eql(['hello']);
  });
});
