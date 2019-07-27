const { Command, flags: Flags } = require('@oclif/command');

class ZapierBaseCommand extends Command {
  _version() {
    return 'blah blah ok'; // this should overwrite the version string, but doesn't?
  }

  async run() {
    console.log('running in base');
  }

  // log(message) {}
}

ZapierBaseCommand.flags = {
  format: Flags.string({
    char: 'f',
    options: ['a', 'b', 'c', 'raw'],
    default: 'b'
  })
};

ZapierBaseCommand.buildFlags = childFlags =>
  Object.assign({}, childFlags, ZapierBaseCommand.flags);

module.exports = ZapierBaseCommand;
