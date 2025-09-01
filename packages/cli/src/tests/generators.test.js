const { expect } = require('chai');
const { ProjectGenerator, TEMPLATE_CHOICES, ESM_SUPPORTED_TEMPLATES } = require('../generators');

describe('ProjectGenerator', () => {
  describe('ESM template filtering', () => {
    it('should filter template choices to ESM-supported templates when module=esm', async () => {
      const generator = new ProjectGenerator([], {
        path: '/tmp/test',
        module: 'esm',
      });

      // Mock the prompt method to capture the choices passed to it
      let promptChoices, promptDefault;
      generator.prompt = async (questions) => {
        promptChoices = questions[0].choices;
        promptDefault = questions[0].default;
        return { template: 'minimal' };
      };

      // Call the prompting method
      await generator.prompting();

      // Verify that only ESM-supported templates are shown
      expect(promptChoices).to.deep.equal(ESM_SUPPORTED_TEMPLATES);
      expect(promptDefault).to.equal('minimal');
      expect(promptChoices).to.not.include('oauth2');
      expect(promptChoices).to.not.include('basic-auth');
    });

    it('should show all template choices when no module is specified', async () => {
      const generator = new ProjectGenerator([], {
        path: '/tmp/test',
      });

      // Mock the prompt method to capture the choices passed to it
      let promptChoices, promptDefault;
      generator.prompt = async (questions) => {
        promptChoices = questions[0].choices;
        promptDefault = questions[0].default;
        return { template: 'minimal' };
      };

      // Call the prompting method
      await generator.prompting();

      // Verify that all templates are shown
      expect(promptChoices).to.deep.equal(TEMPLATE_CHOICES);
      expect(promptDefault).to.equal('minimal');
      expect(promptChoices).to.include('minimal');
      expect(promptChoices).to.include('oauth2');
      expect(promptChoices).to.include('basic-auth');
    });

    it('should show all template choices when module=commonjs', async () => {
      const generator = new ProjectGenerator([], {
        path: '/tmp/test',
        module: 'commonjs',
      });

      // Mock the prompt method to capture the choices passed to it
      let promptChoices, promptDefault;
      generator.prompt = async (questions) => {
        promptChoices = questions[0].choices;
        promptDefault = questions[0].default;
        return { template: 'minimal' };
      };

      // Call the prompting method
      await generator.prompting();

      // Verify that all templates are shown
      expect(promptChoices).to.deep.equal(TEMPLATE_CHOICES);
      expect(promptDefault).to.equal('minimal');
    });

    it('should not prompt for template when template is already specified', async () => {
      const generator = new ProjectGenerator([], {
        path: '/tmp/test',
        module: 'esm',
        template: 'minimal',
      });

      let promptCalled = false;
      generator.prompt = async () => {
        promptCalled = true;
        return {};
      };

      await generator.prompting();

      // Verify that prompt was not called for template selection
      expect(promptCalled).to.be.false;
      expect(generator.options.template).to.equal('minimal');
    });

    // Test the interaction between language and module filtering
    it('should prioritize TypeScript filtering over ESM filtering when both are specified', async () => {
      // Mock TS_SUPPORTED_TEMPLATES for this test
      const originalTSTemplates = require('../generators').TS_SUPPORTED_TEMPLATES || [
        'basic-auth', 'custom-auth', 'digest-auth', 'oauth1-trello', 'oauth2', 'session-auth'
      ];
      
      const generator = new ProjectGenerator([], {
        path: '/tmp/test',
        language: 'typescript',
        module: 'esm', // This should be ignored in favor of TypeScript filtering
      });

      let promptChoices, promptDefault;
      generator.prompt = async (questions) => {
        promptChoices = questions[0].choices;
        promptDefault = questions[0].default;
        return { template: 'basic-auth' };
      };

      await generator.prompting();

      // Should show TypeScript templates, not ESM templates
      expect(promptChoices).to.deep.equal(originalTSTemplates);
      expect(promptDefault).to.equal('basic-auth');
      expect(promptChoices).to.not.deep.equal(ESM_SUPPORTED_TEMPLATES);
    });

    it('should use ESM filtering when language is JavaScript and module is ESM', async () => {
      const generator = new ProjectGenerator([], {
        path: '/tmp/test',
        language: 'javascript', // explicit JavaScript
        module: 'esm',
      });

      let promptChoices, promptDefault;
      generator.prompt = async (questions) => {
        promptChoices = questions[0].choices;
        promptDefault = questions[0].default;
        return { template: 'minimal' };
      };

      await generator.prompting();

      // Should show ESM templates for JavaScript
      expect(promptChoices).to.deep.equal(ESM_SUPPORTED_TEMPLATES);
      expect(promptDefault).to.equal('minimal');
    });
  });
});