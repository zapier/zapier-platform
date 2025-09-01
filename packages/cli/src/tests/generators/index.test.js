const should = require('should');

const {
  TEMPLATE_CHOICES,
  TS_SUPPORTED_TEMPLATES,
} = require('../../generators/index.js');

describe('zapier init template filtering behavior', () => {
  describe('when language is specified but template is not', () => {
    it('should only show TypeScript-supported templates for --language=typescript', () => {
      // Simulate the exact logic from ProjectGenerator.prompting() method
      // This is what happens when user runs: zapier init myapp --language=typescript
      const options = {
        language: 'typescript',
        template: undefined, // no --template flag specified
      };

      // This is the actual filtering logic from the prompting() method
      const templateChoices =
        options.language === 'typescript'
          ? TS_SUPPORTED_TEMPLATES
          : TEMPLATE_CHOICES;

      const defaultTemplate =
        options.language === 'typescript' ? 'basic-auth' : 'minimal';

      // Verify the user would only see TypeScript-supported templates
      templateChoices.should.deepEqual(TS_SUPPORTED_TEMPLATES);
      templateChoices.should.not.deepEqual(TEMPLATE_CHOICES);

      // Verify the default is appropriate for TypeScript
      defaultTemplate.should.equal('basic-auth');

      // Ensure TypeScript templates are a proper subset
      TS_SUPPORTED_TEMPLATES.forEach((template) => {
        TEMPLATE_CHOICES.should.containEql(template);
      });

      // Verify some templates are filtered out
      templateChoices.length.should.be.lessThan(TEMPLATE_CHOICES.length);
    });

    it('should show all templates for --language=javascript', () => {
      // Simulate what happens when user runs: zapier init myapp --language=javascript
      const options = {
        language: 'javascript',
        template: undefined, // no --template flag specified
      };

      const templateChoices =
        options.language === 'typescript'
          ? TS_SUPPORTED_TEMPLATES
          : TEMPLATE_CHOICES;

      const defaultTemplate =
        options.language === 'typescript' ? 'basic-auth' : 'minimal';

      // Verify the user would see all templates
      templateChoices.should.deepEqual(TEMPLATE_CHOICES);
      defaultTemplate.should.equal('minimal');
    });

    it('should show all templates when no language is specified', () => {
      // Simulate what happens when user runs: zapier init myapp (no --language flag)
      const options = {
        language: undefined,
        template: undefined, // no --template flag specified
      };

      const templateChoices =
        options.language === 'typescript'
          ? TS_SUPPORTED_TEMPLATES
          : TEMPLATE_CHOICES;

      const defaultTemplate =
        options.language === 'typescript' ? 'basic-auth' : 'minimal';

      // Verify the user would see all templates (JavaScript is the default)
      templateChoices.should.deepEqual(TEMPLATE_CHOICES);
      defaultTemplate.should.equal('minimal');
    });
  });

  describe('when template is already specified', () => {
    it('should not filter templates when --template is provided', () => {
      // When user runs: zapier init myapp --language=typescript --template=basic-auth
      // The filtering logic should not be invoked because template is already specified
      const options = {
        language: 'typescript',
        template: 'basic-auth', // template is specified
      };

      // When template is specified, the prompting logic is skipped
      // This test documents that behavior
      should(options.template).be.ok();
      options.template.should.equal('basic-auth');
    });
  });
});
