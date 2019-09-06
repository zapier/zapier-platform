// const { flags } = require('@oclif/command');

const BaseCommand = require('../ZapierBaseCommand');
const { buildFlags } = require('../buildFlags');

class TestCommand extends BaseCommand {
  async perform() {
    this.log('test command');
  }
}

TestCommand.flags = buildFlags();

TestCommand.args = [];

TestCommand.examples = ['zapier test'];
TestCommand.description = 'Run tests.';

module.exports = TestCommand;
