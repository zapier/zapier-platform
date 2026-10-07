require('should');
const nock = require('nock');

const { BASE_ENDPOINT } = require('../../constants');
const { writeDomainFilter } = require('../../utils/domain-filter');

const ROUTE = '/api/platform/cli/apps/42/versions/1.0.0/domain-filter';

const fakeCommand = () => ({
  throwForInvalidVersion: () => {},
  getWritableApp: async () => ({
    id: 42,
    title: 'Test',
    all_versions: ['1.0.0'],
  }),
  error: (message) => {
    throw new Error(message);
  },
});

describe('writeDomainFilter', () => {
  beforeEach(() => {
    process.env.ZAPIER_DEPLOY_KEY = 'fake-key';
  });
  afterEach(() => {
    delete process.env.ZAPIER_DEPLOY_KEY;
    nock.cleanAll();
  });

  it('posts the filter and returns what was stored', async () => {
    nock(BASE_ENDPOINT)
      .post(ROUTE, { domain_filter: 'api.example.com,*.example.org' })
      .reply(200, { domain_filter: 'api.example.com,*.example.org' });

    const stored = await writeDomainFilter(
      fakeCommand(),
      '1.0.0',
      'api.example.com,*.example.org',
    );
    stored.should.equal('api.example.com,*.example.org');
  });

  it('explains a 401 in plain words', async () => {
    nock(BASE_ENDPOINT)
      .post(ROUTE)
      .reply(401, { errors: ['Not authenticated'] });

    await writeDomainFilter(
      fakeCommand(),
      '1.0.0',
      'api.example.com',
    ).should.be.rejectedWith(/cannot set the domain filter yet/);
  });

  it('passes server validation errors through', async () => {
    nock(BASE_ENDPOINT)
      .post(ROUTE)
      .reply(400, { errors: ['Not allowed: **.com'] });

    await writeDomainFilter(
      fakeCommand(),
      '1.0.0',
      '**.com',
    ).should.be.rejectedWith(/Not allowed: \*\*\.com/);
  });

  it('refuses a version the integration does not have', async () => {
    await writeDomainFilter(
      fakeCommand(),
      '9.9.9',
      'api.example.com',
    ).should.be.rejectedWith(/Version 9.9.9 doesn't exist/);
  });
});
