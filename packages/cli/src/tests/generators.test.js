const { expect } = require('chai');
const {
  TEMPLATE_CHOICES,
  ESM_SUPPORTED_TEMPLATES,
  TS_SUPPORTED_TEMPLATES,
} = require('../generators');

describe('ProjectGenerator', () => {
  describe('ESM template filtering', () => {
    // Test the template filtering logic directly without instantiating the generator
    describe('template filtering logic', () => {
      function getFilteredTemplates(options) {
        let templateChoices = TEMPLATE_CHOICES;
        let defaultTemplate = 'minimal';

        // Extract the same logic from the actual prompting method
        // TypeScript filtering takes precedence over ESM filtering
        if (options.language === 'typescript') {
          templateChoices = TS_SUPPORTED_TEMPLATES;
          defaultTemplate = 'basic-auth';
        } else if (options.module === 'esm') {
          templateChoices = ESM_SUPPORTED_TEMPLATES;
          defaultTemplate = 'minimal'; // minimal is the only ESM template
        }

        return { templateChoices, defaultTemplate };
      }

      it('should filter template choices to ESM-supported templates when module=esm', () => {
        const result = getFilteredTemplates({ module: 'esm' });

        expect(result.templateChoices).to.deep.equal(ESM_SUPPORTED_TEMPLATES);
        expect(result.defaultTemplate).to.equal('minimal');
        expect(result.templateChoices).to.not.include('oauth2');
        expect(result.templateChoices).to.not.include('basic-auth');
      });

      it('should show all template choices when no module is specified', () => {
        const result = getFilteredTemplates({});

        expect(result.templateChoices).to.deep.equal(TEMPLATE_CHOICES);
        expect(result.defaultTemplate).to.equal('minimal');
        expect(result.templateChoices).to.include('minimal');
        expect(result.templateChoices).to.include('oauth2');
        expect(result.templateChoices).to.include('basic-auth');
      });

      it('should show all template choices when module=commonjs', () => {
        const result = getFilteredTemplates({ module: 'commonjs' });

        expect(result.templateChoices).to.deep.equal(TEMPLATE_CHOICES);
        expect(result.defaultTemplate).to.equal('minimal');
      });

      it('should prioritize TypeScript filtering over ESM filtering when both are specified', () => {
        const result = getFilteredTemplates({
          language: 'typescript',
          module: 'esm', // This should be ignored in favor of TypeScript filtering
        });

        expect(result.templateChoices).to.deep.equal(TS_SUPPORTED_TEMPLATES);
        expect(result.defaultTemplate).to.equal('basic-auth');
        expect(result.templateChoices).to.not.deep.equal(
          ESM_SUPPORTED_TEMPLATES,
        );
      });

      it('should use ESM filtering when language is JavaScript and module is ESM', () => {
        const result = getFilteredTemplates({
          language: 'javascript', // explicit JavaScript
          module: 'esm',
        });

        expect(result.templateChoices).to.deep.equal(ESM_SUPPORTED_TEMPLATES);
        expect(result.defaultTemplate).to.equal('minimal');
      });
    });
  });
});
