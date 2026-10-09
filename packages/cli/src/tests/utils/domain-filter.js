require('should');
const nock = require('nock');

const { BASE_ENDPOINT } = require('../../constants');
const { appendHosts, writeDomainFilter } = require('../../utils/domain-filter');

const VERSION_ROUTE = '/api/platform/cli/apps/42/versions/1.0.0';
const ROUTE = `${VERSION_ROUTE}/domain-filter`;

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

const mockCurrent = (domainFilter) =>
  nock(BASE_ENDPOINT)
    .get(VERSION_ROUTE)
    .reply(200, { domain_filter: domainFilter });

describe('appendHosts', () => {
  it('adds new hosts after the current ones and skips duplicates', () => {
    appendHosts('api.example.com,*.example.org', [
      'auth.example.com',
      'api.example.com',
    ]).should.equal('api.example.com,*.example.org,auth.example.com');
  });

  it('works on an empty filter', () => {
    appendHosts('', ['api.example.com']).should.equal('api.example.com');
  });
});

describe('writeDomainFilter', () => {
  beforeEach(() => {
    process.env.ZAPIER_DEPLOY_KEY = 'fake-key';
  });
  afterEach(() => {
    delete process.env.ZAPIER_DEPLOY_KEY;
    nock.cleanAll();
  });

  it('posts the built filter and returns the previous and stored values', async () => {
    mockCurrent('api.example.com');
    nock(BASE_ENDPOINT)
      .post(ROUTE, { domain_filter: 'api.example.com,auth.example.com' })
      .reply(200, { domain_filter: 'api.example.com,auth.example.com' });

    const result = await writeDomainFilter(fakeCommand(), '1.0.0', (previous) =>
      appendHosts(previous, ['auth.example.com']),
    );
    result.should.eql({
      previous: 'api.example.com',
      stored: 'api.example.com,auth.example.com',
    });
  });

  it('explains a 401 in plain words', async () => {
    mockCurrent(null);
    nock(BASE_ENDPOINT)
      .post(ROUTE)
      .reply(401, { errors: ['Not authenticated'] });

    await writeDomainFilter(
      fakeCommand(),
      '1.0.0',
      () => 'api.example.com',
    ).should.be.rejectedWith(/cannot set the domain filter yet/);
  });

  it('passes server validation errors through', async () => {
    mockCurrent(null);
    nock(BASE_ENDPOINT)
      .post(ROUTE)
      .reply(400, { errors: ['Not allowed: **.com'] });

    await writeDomainFilter(
      fakeCommand(),
      '1.0.0',
      () => '**.com',
    ).should.be.rejectedWith(/Not allowed: \*\*\.com/);
  });

  it('explains a non-JSON error instead of printing nothing', async () => {
    mockCurrent(null);
    nock(BASE_ENDPOINT).post(ROUTE).reply(502, '<html>Bad Gateway</html>');

    await writeDomainFilter(
      fakeCommand(),
      '1.0.0',
      () => 'api.example.com',
    ).should.be.rejectedWith(/returned "502"/);
  });

  it('refuses a version the integration does not have', async () => {
    await writeDomainFilter(
      fakeCommand(),
      '9.9.9',
      () => 'api.example.com',
    ).should.be.rejectedWith(/Version 9.9.9 doesn't exist/);
  });
});
