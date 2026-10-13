require('should');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const nock = require('nock');
const { captureOutput } = require('@oclif/test');

const { BASE_ENDPOINT } = require('../../constants');
const GetCommand = require('../../oclif/commands/domain-filter/get');
const SetCommand = require('../../oclif/commands/domain-filter/set');
const UnsetCommand = require('../../oclif/commands/domain-filter/unset');
const { appendHosts } = require('../../utils/domain-filter');

const APP_ROUTE = '/api/platform/cli/apps/42';
const VERSION_ROUTE = `${APP_ROUTE}/versions/1.0.0`;
const ROUTE = `${VERSION_ROUTE}/domain-filter`;

const mockApp = () =>
  nock(BASE_ENDPOINT)
    .get(APP_ROUTE)
    .reply(200, { id: 42, title: 'Test', all_versions: ['1.0.0'] });

const mockCurrent = (domainFilter) =>
  nock(BASE_ENDPOINT)
    .get(VERSION_ROUTE)
    .reply(200, { domain_filter: domainFilter });

const mockSet = (domainFilter) =>
  nock(BASE_ENDPOINT)
    .post(ROUTE, { domain_filter: domainFilter })
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

describe('domain-filter commands', () => {
  const origCwd = process.cwd();
  let workdir;

  // Other suites call nock.restore(), so make sure it's on and offline here.
  before(() => {
    if (!nock.isActive()) {
      nock.activate();
    }
    nock.disableNetConnect();
  });
  after(() => {
    nock.enableNetConnect();
  });
  beforeEach(() => {
    workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'domain-filter-'));
    fs.writeJsonSync(path.join(workdir, '.zapierapprc'), { id: 42 });
    process.chdir(workdir);
    process.env.ZAPIER_DEPLOY_KEY = 'fake-key';
  });
  afterEach(() => {
    process.chdir(origCwd);
    fs.removeSync(workdir);
    delete process.env.ZAPIER_DEPLOY_KEY;
    nock.cleanAll();
  });

  describe('get', () => {
    it('refuses a version the integration does not have', async () => {
      mockApp();
      const { error } = await captureOutput(() => GetCommand.run(['9.9.9']));
      error.message.should.containEql(
        `Version 9.9.9 doesn't exist on integration "Test"`,
      );
    });

    it('prints one host per row', async () => {
      mockApp();
      mockCurrent('api.example.com,*.example.org');
      const { stdout } = await captureOutput(() => GetCommand.run(['1.0.0']));
      stdout.should.match(
        /Host[\s\S]*api\.example\.com[\s\S]*\*\.example\.org/,
      );
    });

    it('prints JSON with --format json', async () => {
      mockApp();
      mockCurrent('api.example.com,*.example.org');
      const { stdout } = await captureOutput(() =>
        GetCommand.run(['1.0.0', '--format', 'json']),
      );
      JSON.parse(stdout).should.eql([
        { Host: 'api.example.com' },
        { Host: '*.example.org' },
      ]);
    });

    it('says when there is no filter', async () => {
      mockApp();
      mockCurrent(null);
      const { stdout } = await captureOutput(() => GetCommand.run(['1.0.0']));
      stdout.should.containEql('Version 1.0.0 has no domain filter');
    });
  });

  describe('set', () => {
    it('replaces the current filter by default', async () => {
      mockApp();
      mockCurrent('old.example.com');
      const save = mockSet('api.example.com');
      const { stdout } = await captureOutput(() =>
        SetCommand.run(['1.0.0', 'api.example.com']),
      );
      save.isDone().should.be.true();
      stdout.should.containEql('Previous domain filter: old.example.com');
    });

    it('lowercases hosts', async () => {
      mockApp();
      mockCurrent(null);
      const save = mockSet('api.example.com,*.example.org');
      await captureOutput(() =>
        SetCommand.run(['1.0.0', 'API.Example.COM', '*.Example.org']),
      );
      save.isDone().should.be.true();
    });

    it('appends with -a before the version, ignoring a -- separator', async () => {
      mockApp();
      mockCurrent('api.example.com');
      const save = mockSet(
        'api.example.com,auth.example.com,extra.example.com',
      );
      await captureOutput(() =>
        SetCommand.run([
          '-a',
          '1.0.0',
          'auth.example.com',
          '--',
          'extra.example.com',
        ]),
      );
      save.isDone().should.be.true();
    });

    it('requires at least one host', async () => {
      const { error } = await captureOutput(() => SetCommand.run(['1.0.0']));
      error.message.should.containEql('Must specify at least one host');
    });

    it('explains a 401 in plain words', async () => {
      mockApp();
      mockCurrent(null);
      nock(BASE_ENDPOINT)
        .post(ROUTE)
        .reply(401, { errors: ['Not authenticated'] });
      const { error } = await captureOutput(() =>
        SetCommand.run(['1.0.0', 'api.example.com']),
      );
      error.message.should.containEql('cannot set the domain filter yet');
    });

    it('shows server validation errors', async () => {
      mockApp();
      mockCurrent(null);
      nock(BASE_ENDPOINT)
        .post(ROUTE)
        .reply(400, { errors: ['Not allowed: **.com'] });
      const { error } = await captureOutput(() =>
        SetCommand.run(['1.0.0', '**.com']),
      );
      error.message.should.containEql('Not allowed: **.com');
    });

    it('shows a non-JSON server error instead of nothing', async () => {
      mockApp();
      mockCurrent(null);
      nock(BASE_ENDPOINT).post(ROUTE).reply(502, '<html>Bad Gateway</html>');
      const { error } = await captureOutput(() =>
        SetCommand.run(['1.0.0', 'api.example.com']),
      );
      error.message.should.match(/returned "502"/);
    });
  });

  describe('unset', () => {
    it('clears the filter and shows the old value', async () => {
      mockApp();
      mockCurrent('api.example.com');
      const save = mockSet('');
      const { stdout } = await captureOutput(() => UnsetCommand.run(['1.0.0']));
      save.isDone().should.be.true();
      stdout.should.containEql('(was: api.example.com)');
    });
  });
});
