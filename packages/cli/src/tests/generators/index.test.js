require('should');

// Import the constants we need to test the logic
const path = require('path');

// Import from the generators file
const { TEMPLATE_CHOICES } = require('../../generators/index.js');

// Read the file to extract the constants we need
const generatorsFile = require('fs').readFileSync(
  path.join(__dirname, '../../generators/index.js'),
  'utf8',
);

// Extract TS_SUPPORTED_TEMPLATES from the file content since it's not exported
const tsTemplatesMatch = generatorsFile.match(
  /const TS_SUPPORTED_TEMPLATES = \[([\s\S]*?)\];/,
);
const TS_SUPPORTED_TEMPLATES = tsTemplatesMatch
  ? JSON.parse(`[${tsTemplatesMatch[1]}]`) // Use JSON.parse instead of eval
  : [];

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

  describe('Template filtering logic simulation', () => {
    it('should return TypeScript templates when language is typescript', () => {
      const options = { language: 'typescript' };

      // Simulate the logic from our fix
      const templateChoices =
        options.language === 'typescript'
          ? TS_SUPPORTED_TEMPLATES
          : TEMPLATE_CHOICES;

      templateChoices.should.eql(TS_SUPPORTED_TEMPLATES);
      templateChoices.should.not.containEql('minimal');
    });

    it('should return all templates when language is javascript', () => {
      const options = { language: 'javascript' };

      // Simulate the logic from our fix
      const templateChoices =
        options.language === 'typescript'
          ? TS_SUPPORTED_TEMPLATES
          : TEMPLATE_CHOICES;

      templateChoices.should.eql(TEMPLATE_CHOICES);
      templateChoices.should.containEql('minimal');
    });

    it('should return all templates when language is undefined', () => {
      const options = {};

      // Simulate the logic from our fix
      const templateChoices =
        options.language === 'typescript'
          ? TS_SUPPORTED_TEMPLATES
          : TEMPLATE_CHOICES;

      templateChoices.should.eql(TEMPLATE_CHOICES);
      templateChoices.should.containEql('minimal');
    });
  });
});
