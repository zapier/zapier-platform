const BaseCommand = require('../oclif/ZapierBaseCommand');
const { buildFlags } = require('../oclif/buildFlags');

const should = require('should');
const { stdout } = require('stdout-stderr');

const MESSAGE = 'very cool message';
const ROWS = [{ id: 123, title: 'helddddddlo' }, { id: 456, title: 'world' }];
const ROW_HEADERS = [['Contact ID', 'id'], ['Neat Title', 'title']];

class TestSampleCommand extends BaseCommand {
  async perform() {
    switch (this.args.data) {
      case 'table':
        this.log('Here is some data!');
        this.logTable({ rows: ROWS, headers: ROW_HEADERS });
        break;
      default:
        this.log(MESSAGE);
        break;
    }
  }
}
TestSampleCommand.args = [
  {
    name: 'data'
  }
];
TestSampleCommand.flags = buildFlags({ opts: { format: true } });

describe('BaseCommand', () => {
  describe('log', () => {
    beforeEach(() => {
      stdout.start();
    });

    it('should normally log', async () => {
      await TestSampleCommand.run([]);
      should(stdout.output).startWith(MESSAGE);
    });

    it('should not log in json mode', async () => {
      await TestSampleCommand.run(['--format', 'json']);
      should(stdout.output).equal('');
    });

    it('should print a table', async () => {
      await TestSampleCommand.run(['table']);

      should(stdout.output).containEql('Contact ID');
      should(stdout.output).containEql('123');
      should(stdout.output).containEql('Here');
      should(stdout.output).containEql('┌');

      const p = () => JSON.parse(stdout.output);
      p.should.throw();
    });

    it('should print a plain table', async () => {
      await TestSampleCommand.run(['table', '--format', 'plain']);

      should(stdout.output).containEql('Contact ID');
      should(stdout.output).containEql('123');
      should(stdout.output).containEql('Here');
      should(stdout.output).containEql('==');
      should(stdout.output).not.containEql('┌');

      const p = () => JSON.parse(stdout.output);
      p.should.throw();
    });

    it('should print a row table', async () => {
      await TestSampleCommand.run(['table', '--format', 'row']);

      should(stdout.output).containEql('Contact ID');
      should(stdout.output).containEql('123');
      should(stdout.output).containEql('Here');
      should(stdout.output).containEql('= 1 =');
      should(stdout.output).containEql('│');
      should(stdout.output).containEql('┌');

      const p = () => JSON.parse(stdout.output);
      p.should.throw();
    });

    it('should print valid transformed json', async () => {
      await TestSampleCommand.run(['table', '--format', 'json']);

      should(stdout.output).containEql('Contact ID');
      should(stdout.output).containEql('123');
      should(stdout.output).not.containEql('Here');

      JSON.parse(stdout.output); // shouldn't throw
    });

    it('should print valid raw json', async () => {
      await TestSampleCommand.run(['table', '--format', 'raw']);

      should(stdout.output).not.containEql('Contact ID');
      should(stdout.output).containEql('id');
      should(stdout.output).containEql('123');
      should(stdout.output).not.containEql('Here');

      JSON.parse(stdout.output); // shouldn't throw
    });

    afterEach(() => {
      stdout.stop();
    });
  });
});
