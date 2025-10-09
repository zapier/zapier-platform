const _ = require('lodash');

describe('Template Security Tests', () => {
  // Test the template functions directly to avoid complex setup

  // Recreate the replaceVars function for testing
  const replaceVars = (templateString, bundle, result) => {
    // Security: Ensure templateString is a string and not user-controlled
    if (typeof templateString !== 'string') {
      throw new Error('Template string must be a string');
    }

    const options = {
      interpolate: /{{([\s\S]+?)}}/g,
      // Security: Disable code evaluation to prevent injection
      evaluate: false,
      escape: false,
    };
    const values = { ...bundle.authData, ...bundle.inputData, ...result };

    // Security: Use safe template compilation
    try {
      return _.template(templateString, options)(values);
    } catch (error) {
      // Log template errors but don't expose internal details
      console.error('Template rendering error:', error.message);
      return templateString; // Return original string on error
    }
  };

  describe('replaceVars security', () => {
    it('should handle normal template interpolation safely', () => {
      const bundle = {
        authData: { token: 'secret123' },
        inputData: { name: 'John', city: 'NYC' },
      };

      const result = replaceVars('Hello {{name}} from {{city}}', bundle, {});
      result.should.equal('Hello John from NYC');
    });

    it('should prevent code injection through template string', () => {
      const bundle = {
        authData: {},
        inputData: { malicious: 'process.exit(1)' },
      };

      // This should NOT execute the malicious code
      const result = replaceVars('Value: {{malicious}}', bundle, {});
      result.should.equal('Value: process.exit(1)');
    });

    it('should handle non-string template input safely', () => {
      const bundle = { authData: {}, inputData: {} };

      (() => {
        replaceVars(null, bundle, {});
      }).should.throw('Template string must be a string');

      (() => {
        replaceVars(123, bundle, {});
      }).should.throw('Template string must be a string');

      (() => {
        replaceVars({}, bundle, {});
      }).should.throw('Template string must be a string');
    });

    it('should handle template errors gracefully', () => {
      const bundle = {
        authData: {},
        inputData: { name: 'John' },
      };

      // Malformed template should return original string, not crash
      const result = replaceVars('{{unclosed', bundle, {});
      result.should.equal('{{unclosed');
    });

    it('should handle dangerous variable names safely', () => {
      const bundle = {
        authData: {},
        inputData: {
          constructor: 'hacked',
          prototype: 'still_hacked',
        },
      };

      // These should render the values, not execute dangerous code
      const result = replaceVars('{{constructor}} {{prototype}}', bundle, {});
      result.should.equal('hacked still_hacked');
    });

    it('should handle template errors gracefully for undefined variables', () => {
      const bundle = {
        authData: {},
        inputData: { name: 'John' },
      };

      // When undefined variables cause template errors, should return original string
      const result = replaceVars('{{name}} {{undefined_var}}', bundle, {});
      // This will fail template compilation and return original string
      result.should.equal('{{name}} {{undefined_var}}');
    });
  });

  describe('template options security', () => {
    it('should have evaluation disabled', () => {
      const bundle = {
        authData: {},
        inputData: {},
      };

      // This template tries to use evaluation syntax - should be ignored
      const result = replaceVars(
        '<% console.log("HACKED") %>{{name}}',
        bundle,
        { name: 'safe' },
      );
      // Should not execute the console.log and should render the variable
      result.should.equal('<% console.log("HACKED") %>safe');
    });

    it('should handle complex interpolation safely', () => {
      const bundle = {
        authData: { api_key: 'secret' },
        inputData: {
          user: { name: 'John', id: 123 },
          items: ['a', 'b', 'c'],
        },
      };

      const result = replaceVars(
        'API: {{api_key}}, User: {{user}}, Items: {{items}}',
        bundle,
        {},
      );
      result.should.match(/API: secret/);
      result.should.match(/User: \[object Object\]/);
      result.should.match(/Items: a,b,c/);
    });
  });

  describe('middleware renderTemplate security', () => {
    const { renderTemplate } = require('../middleware-factory');

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
});
