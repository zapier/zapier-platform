require('should');

// Import the constants we need to test
const {
  TEMPLATE_CHOICES,
  TS_SUPPORTED_TEMPLATES,
} = require('../../generators/index.js');

describe('Template filtering logic', () => {
  describe('TypeScript template filtering', () => {
    it('should have different template choices for TypeScript vs all templates', () => {
      // Verify our constants are set up correctly
      TS_SUPPORTED_TEMPLATES.should.not.be.empty();
      TEMPLATE_CHOICES.should.not.be.empty();

      // TypeScript templates should be a subset of all templates
      TS_SUPPORTED_TEMPLATES.length.should.be.lessThan(TEMPLATE_CHOICES.length);

      // Each TypeScript template should be in the full template list
      TS_SUPPORTED_TEMPLATES.forEach((template) => {
        TEMPLATE_CHOICES.should.containEql(template);
      });
    });

    it('should exclude non-TypeScript templates from TypeScript supported list', () => {
      // These templates should NOT be in the TypeScript supported list
      const nonTsTemplates = [
        'minimal',
        'files',
        'dynamic-dropdown',
        'callback',
        'openai',
        'search-or-create',
      ];

      nonTsTemplates.forEach((template) => {
        TS_SUPPORTED_TEMPLATES.should.not.containEql(
          template,
          `Template '${template}' should not be in TS_SUPPORTED_TEMPLATES`,
        );
      });
    });

    it('should include expected TypeScript templates', () => {
      // These templates should be in the TypeScript supported list
      const expectedTsTemplates = [
        'basic-auth',
        'custom-auth',
        'digest-auth',
        'oauth1-trello',
        'oauth2',
        'session-auth',
      ];

      expectedTsTemplates.forEach((template) => {
        TS_SUPPORTED_TEMPLATES.should.containEql(
          template,
          `Template '${template}' should be in TS_SUPPORTED_TEMPLATES`,
        );
      });
    });
  });
});
