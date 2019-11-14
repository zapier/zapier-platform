const BaseCommand = require('../oclif/ZapierBaseCommand');
const { flags } = require('@oclif/command');
const { buildFlags } = require('../oclif/buildFlags');

const should = require('should');
const { stdout } = require('stdout-stderr');

const MESSAGE = 'Here is a very cool message';
const ROWS = [{ id: 123, title: 'hello' }, { id: 456, title: 'world' }];
const ROW_HEADERS = [['Contact ID', 'id'], ['Neat Title', 'title']];

class TestBaseCommand extends BaseCommand {
  throwForInvalidAppInstall() {}

  _recordAnalytics() {
    return Promise.resolve();
  }
}
// logs both text and a table, which behave differently baed on the format flag
class TestSampleCommand extends TestBaseCommand {
  async perform() {
    this.log(MESSAGE);
    if (!this.flags.skipTable) {
      this.logTable({ rows: ROWS, headers: ROW_HEADERS });
    }
  }
}

TestSampleCommand.flags = buildFlags({
  opts: { format: true },
  commandFlags: {
    skipTable: flags.boolean({
      char: 's'
    })
  }
});

// logs and doesn't populate the `format` flag
class NoFormatCommand extends TestBaseCommand {
  async perform() {
    this.log(MESSAGE);
  }
}
NoFormatCommand.flags = buildFlags();

describe('BaseCommand', () => {
  describe('log', () => {
    beforeEach(() => {
      // stdout.print = true;
      stdout.start();
    });
    // this is annoying - with stdout mocked, mocha's success check doesn't get logged (since mock isn't restored
    //  until after the checkmark should have been printed). So we call this manually to get the nice printing.
    const customAfter = () => {
      stdout.stop();
    };

    it('should normally log', async () => {
      await TestSampleCommand.run([]);
      should(stdout.output).startWith(MESSAGE);
      customAfter();
    });

    it('should log without format flags', async () => {
      await NoFormatCommand.run([]);
      should(stdout.output).startWith(MESSAGE);

      customAfter();
    });

    it('should not log in json mode', async () => {
      await TestSampleCommand.run(['--format', 'json', '--skipTable']);
      should(stdout.output).equal('');

      customAfter();
    });

    it('should print a table', async () => {
      await TestSampleCommand.run([]);

      should(stdout.output).containEql('Contact ID');
      should(stdout.output).containEql('123');
      should(stdout.output).containEql('Here');
      should(stdout.output).containEql('┌');

      const p = () => JSON.parse(stdout.output);
      p.should.throw();

      customAfter();
    });

    it('should print a plain table', async () => {
      await TestSampleCommand.run(['--format', 'plain']);

      should(stdout.output).containEql('Contact ID');
      should(stdout.output).containEql('123');
      should(stdout.output).containEql('Here');
      should(stdout.output).containEql('==');
      should(stdout.output).not.containEql('┌');

      const p = () => JSON.parse(stdout.output);
      p.should.throw();

      customAfter();
    });

    it('should print a row table', async () => {
      await TestSampleCommand.run(['--format', 'row']);

      should(stdout.output).containEql('Contact ID');
      should(stdout.output).containEql('123');
      should(stdout.output).containEql('Here');
      should(stdout.output).containEql('= 1 =');
      should(stdout.output).containEql('│');
      should(stdout.output).containEql('┌');

      const p = () => JSON.parse(stdout.output);
      p.should.throw();

      customAfter();
    });

    it('should print valid transformed json', async () => {
      await TestSampleCommand.run(['--format', 'json']);

      should(stdout.output).containEql('Contact ID');
      should(stdout.output).containEql('123');
      should(stdout.output).not.containEql('Here');

      const rows = JSON.parse(stdout.output); // shouldn't throw
      rows.length.should.eql(2);
      rows[0]['Contact ID'].should.eql('123');
      rows[0]['Neat Title'].should.eql('hello');

      customAfter();
    });

    it('should print valid raw json', async () => {
      await TestSampleCommand.run(['--format', 'raw']);

      should(stdout.output).not.containEql('Contact ID');
      should(stdout.output).containEql('id');
      should(stdout.output).containEql('123');
      should(stdout.output).not.containEql('Here');

      const rows = JSON.parse(stdout.output); // shouldn't throw
      rows.length.should.eql(2);
      rows[0].id.should.eql(123);
      rows[0].title.should.eql('hello');

      customAfter();
    });

    afterEach(() => {
      stdout.stop();
    });
  });
});
