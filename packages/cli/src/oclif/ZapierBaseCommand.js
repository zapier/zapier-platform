const { Command } = require('@oclif/command');

class ZapierBaseCommand extends Command {
  run() {
    this.parseFlags();
    return this.perform();
  }

  parseFlags() {
    // normally this is called via `this.parse(SomeCommand)`, but that's error-prone and I got tired of typing it
    // .constructor is the static class
    const { flags, args } = this.parse(Object.getPrototypeOf(this).constructor);
    console.log('fff', flags);
    this.flags = flags;
    this.args = args;
  }

  perform() {
    throw new Error('subclass me');
  }

  log(...message) {
    if (!['json', 'raw'].includes(this.flags.format)) {
      super.log(...message);
    }
  }
}

module.exports = ZapierBaseCommand;
