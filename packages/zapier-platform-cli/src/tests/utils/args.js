require('should');

require('../../entry'); // must import me to babel polyfill!

const argUtils = require('../../utils/args');

describe('args', () => {
  it('should parse some args', () => {
    const [args, argOpts] = argUtils.argParse(['hello', 'world', '--cat', '--lolz=hahaha']);
    args.should.eql(['hello', 'world']);
    argOpts.should.eql({cat: true, lolz: 'hahaha'});
  });

  it('should enforce some args', () => {
    let spec, args, argOpts, errors;
    spec = {
      argsSpec: [
        {name: 'firstGreeting', required: true},
        {name: 'secondGreeting'},
        {rest: true},
      ],
      argOptsSpec: {
        cat: {help: 'Is this a cat?', flag: true},
        lolz: {help: 'What kind of lolz do you have?', required: true}
      }
    };

    [args, argOpts] = argUtils.argParse([]);
    errors = argUtils.enforceArgSpec(spec, args, argOpts);
    errors.should.eql([
      'Missing required positional argument 1/firstGreeting',
      'Missing required keyword argument --lolz=value'
    ]);

    [args, argOpts] = argUtils.argParse(['hello']);
    errors = argUtils.enforceArgSpec(spec, args, argOpts);
    errors.should.eql([
      'Missing required keyword argument --lolz=value'
    ]);

    [args, argOpts] = argUtils.argParse(['hello', '--lolz=hahaha']);
    errors = argUtils.enforceArgSpec(spec, args, argOpts);
    errors.should.eql([]);

    [args, argOpts] = argUtils.argParse(['hello', 'world', 'lots', 'more', '--lolz=hahaha']);
    errors = argUtils.enforceArgSpec(spec, args, argOpts);
    errors.should.eql([]);

  });

  it('should enforce requiredWith args', () => {
    let spec, args, argOpts, errors;
    spec = {
      argsSpec: [
        {name: 'version', required: true},
        {name: 'key'},
        {name: 'value', requiredWith: ['key']},
      ]
    };

    [args, argOpts] = argUtils.argParse([]);
    errors = argUtils.enforceArgSpec(spec, args, argOpts);
    errors.should.eql([
      'Missing required positional argument 1/version',
    ]);

    [args, argOpts] = argUtils.argParse(['1.0.0']);
    errors = argUtils.enforceArgSpec(spec, args, argOpts);
    errors.should.eql([]);

    [args, argOpts] = argUtils.argParse(['1.0.0', 'some_key']);
    errors = argUtils.enforceArgSpec(spec, args, argOpts);
    errors.should.eql([
      'Missing required positional argument 3/value',
    ]);

    [args, argOpts] = argUtils.argParse(['1.0.0', 'some_key', 'some_value']);
    errors = argUtils.enforceArgSpec(spec, args, argOpts);
    errors.should.eql([]);
  });

  it('should enforce no args', () => {
    let spec, args, argOpts, errors;
    spec = {};

    [args, argOpts] = argUtils.argParse(['something']);
    errors = argUtils.enforceArgSpec(spec, args, argOpts);
    errors.should.eql([
      'Unexpected positional argument 1 of something',
    ]);

    [args, argOpts] = argUtils.argParse(['something', 'other']);
    errors = argUtils.enforceArgSpec(spec, args, argOpts);
    errors.should.eql([
      'Unexpected positional argument 1 of something',
      'Unexpected positional argument 2 of other',
    ]);

    [args, argOpts] = argUtils.argParse(['--color=blue']);
    errors = argUtils.enforceArgSpec(spec, args, argOpts);
    errors.should.eql([
      'Unexpected keyword argument --color=blue',
    ]);

    [args, argOpts] = argUtils.argParse(['--flaggy']);
    errors = argUtils.enforceArgSpec(spec, args, argOpts);
    errors.should.eql([
      'Unexpected keyword argument --flaggy',
    ]);
  });

  it('should enforce args choices', () => {
    let spec, args, argOpts, errors;
    spec = {
      argsSpec: [
        {name: 'color', choices: ['blue', 'red']},
      ],
      argOptsSpec: {
        color: {choices: ['blue', 'red']},
      }
    };

    [args, argOpts] = argUtils.argParse(['blue']);
    errors = argUtils.enforceArgSpec(spec, args, argOpts);
    errors.should.eql([]);

    [args, argOpts] = argUtils.argParse(['urple']);
    errors = argUtils.enforceArgSpec(spec, args, argOpts);
    errors.should.eql([
      'Unexpected positional argument 1/color of urple, must be one of {blue,red}',
    ]);

    [args, argOpts] = argUtils.argParse(['--color=urple']);
    errors = argUtils.enforceArgSpec(spec, args, argOpts);
    errors.should.eql([
      'Unexpected keyword argument --color=urple, must be one of {blue,red}',
    ]);

  });

});
