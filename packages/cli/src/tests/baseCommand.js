const BaseCommand = require('../oclif/ZapierBaseCommand');
const { Args, Flags } = require('@oclif/core');
const { buildFlags } = require('../oclif/buildFlags');
const { captureOutput } = require('@oclif/test');

const should = require('should');

const MESSAGE = 'Here is a very cool message';
const ROWS = [
  { id: 123, title: 'hello' },
  { id: 456, title: 'world' },
];
const ROW_HEADERS = [
  ['Contact ID', 'id'],
  ['Neat Title', 'title'],
];

class TestBaseCommand extends BaseCommand {
  throwForInvalidAppInstall() {}

  _recordAnalytics() {
    return Promise.resolve();
  }
}

class WithArgsCommand extends TestBaseCommand {
  async perform() {
    this.log(MESSAGE);
  }
}
WithArgsCommand.args = {
  name: Args.string({
    description: 'name is a required argument',
    required: true,
  }),
  number: Args.string({
    description: 'number is an optional argument',
  }),
};

class WithFlagsCommand extends TestBaseCommand {
  async perform() {
    if (this.flags.force) {
      this.log('--force is set');
    }
    if (this.flags.file) {
      this.log(`--file is: ${this.flags.file}`);
    }
  }
}
WithFlagsCommand.flags = buildFlags({
  commandFlags: {
    force: Flags.boolean({ char: 'f' }),
    file: Flags.string(),
  },
});

// logs both text and a table, which behave differently based on the format flag
class LogCommand extends TestBaseCommand {
  async perform() {
    this.log(MESSAGE);
    if (!this.flags.skipTable) {
      this.logTable({ rows: ROWS, headers: ROW_HEADERS });
    }
  }
}
LogCommand.flags = buildFlags({
  opts: { format: true },
  commandFlags: {
    skipTable: Flags.boolean({ char: 's' }),
  },
});

// logs and doesn't populate the `format` flag
class NoFormatCommand extends TestBaseCommand {
  async perform() {
    this.log(MESSAGE);
  }
}
NoFormatCommand.flags = buildFlags();

describe('BaseCommand', () => {
  describe('WithArgsCommand', () => {
    it('should error out with missing args', async () => {
      const { error } = await captureOutput(async () =>
        WithArgsCommand.run([]),
      );
      should(error.message).containEql(
        'Missing 1 required arg:\nname  name is a required argument\nSee more help with --help',
      );
    });

    it('should not error out without missing args', async () => {
      const { stdout, error } = await captureOutput(async () =>
        WithArgsCommand.run(['a']),
      );
      should(error).equal(undefined);
      should(stdout).startWith(MESSAGE);
    });

    it('should not error out with full args', async () => {
      const { stdout, error } = await captureOutput(async () =>
        WithArgsCommand.run(['a', 'b']),
      );
      should(error).equal(undefined);
      should(stdout).startWith(MESSAGE);
    });
  });

  describe('WithFlagsCommand', () => {
    it('should detect flags', async () => {
      const { stdout } = await captureOutput(async () =>
        WithFlagsCommand.run(['--force', '--file', 'path/to/file']),
      );
      should(stdout).containEql('--force is set\n--file is: path/to/file\n');
    });
  });

  describe('LogCommand', () => {
    it('should normally log', async () => {
      const { stdout } = await captureOutput(async () => LogCommand.run([]));
      should(stdout).startWith(MESSAGE);
    });

    it('should not log in json mode', async () => {
      const { stdout } = await captureOutput(async () =>
        LogCommand.run(['--format', 'json', '--skipTable']),
      );
      should(stdout).equal('');
    });

    it('should print a table', async () => {
      const { stdout } = await captureOutput(async () => LogCommand.run([]));

      should(stdout).containEql('Contact ID');
      should(stdout).containEql('123');
      should(stdout).containEql('Here');
      should(stdout).containEql('┌');

      const p = () => JSON.parse(stdout);
      p.should.throw();
    });

    it('should print a plain table', async () => {
      const { stdout } = await captureOutput(async () =>
        LogCommand.run(['--format', 'plain']),
      );

      should(stdout).containEql('Contact ID');
      should(stdout).containEql('123');
      should(stdout).containEql('Here');
      should(stdout).containEql('==');
      should(stdout).not.containEql('┌');

      const p = () => JSON.parse(stdout);
      p.should.throw();
    });

    it('should print a row table', async () => {
      const { stdout } = await captureOutput(async () =>
        LogCommand.run(['--format', 'row']),
      );

      should(stdout).containEql('Contact ID');
      should(stdout).containEql('123');
      should(stdout).containEql('Here');
      should(stdout).containEql('= 1 =');
      should(stdout).containEql('│');
      should(stdout).containEql('┌');

      const p = () => JSON.parse(stdout);
      p.should.throw();
    });

    it('should print valid transformed json', async () => {
      const { stdout } = await captureOutput(async () =>
        LogCommand.run(['--format', 'json']),
      );

      should(stdout).containEql('Contact ID');
      should(stdout).containEql('123');
      should(stdout).not.containEql('Here');

      const rows = JSON.parse(stdout); // shouldn't throw
      rows.length.should.eql(2);
      rows[0]['Contact ID'].should.eql('123');
      rows[0]['Neat Title'].should.eql('hello');
    });

    it('should print valid raw json', async () => {
      const { stdout } = await captureOutput(async () =>
        LogCommand.run(['--format', 'raw']),
      );

      should(stdout).not.containEql('Contact ID');
      should(stdout).containEql('id');
      should(stdout).containEql('123');
      should(stdout).not.containEql('Here');

      const rows = JSON.parse(stdout); // shouldn't throw
      rows.length.should.eql(2);
      rows[0].id.should.eql(123);
      rows[0].title.should.eql('hello');
    });
  });

  describe('NoFormatCommand', () => {
    it('should log without format flags', async () => {
      const { stdout } = await captureOutput(async () =>
        NoFormatCommand.run([]),
      );
      should(stdout).startWith(MESSAGE);
    });
  });
});
