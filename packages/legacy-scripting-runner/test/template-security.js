const { renderTemplate } = require('../middleware-factory');

describe('middleware renderTemplate security', () => {
  it('should handle normal template rendering', () => {
    const context = { clientId: 'test123', secret: 'mysecret' };
    const template = 'Client: {{clientId}}, Secret: {{secret}}';

    const result = renderTemplate(template, context);
    result.should.equal('Client: test123, Secret: mysecret');
  });

  it('should prevent code injection in middleware templates', () => {
    const context = {
      clientId: 'test123',
      malicious: 'process.exit(1)',
    };

    // This should NOT execute the malicious code
    const result = renderTemplate(
      'ID: {{clientId}}, Value: {{malicious}}',
      context,
    );
    result.should.equal('ID: test123, Value: process.exit(1)');
  });

  it('should handle non-string template input safely in middleware', () => {
    const context = { test: 'value' };

    (() => {
      renderTemplate(null, context);
    }).should.throw('Template string must be a string');

    (() => {
      renderTemplate(123, context);
    }).should.throw('Template string must be a string');
  });

  it('should handle template errors gracefully in middleware', () => {
    const context = { name: 'John' };

    // Malformed template should return original string, not crash
    const result = renderTemplate('{{unclosed', context);
    result.should.equal('{{unclosed');
  });

  it('should handle undefined variables with defaults', () => {
    const context = { name: 'John' };

    // renderTemplate sets undefined vars to empty string
    const result = renderTemplate('{{name}} {{undefined_var}}', context);
    result.should.equal('John ');
  });
});
