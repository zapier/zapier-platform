const { expect } = require('chai');
const yeoman = require('yeoman-environment');
const {
  ProjectGenerator,
  TEMPLATE_CHOICES,
  ESM_SUPPORTED_TEMPLATES,
  TS_SUPPORTED_TEMPLATES,
} = require('../generators');

describe('ProjectGenerator', () => {
  describe('ESM template filtering', () => {
    /**
     * Helper function to test template filtering by running the actual generator
     */
    async function testTemplateFiltering(options = {}) {
      const testResult = {
        promptChoices: undefined,
        promptDefault: undefined,
        promptCalled: false,
        modulePromptChoices: undefined,
        modulePromptDefault: undefined,
        modulePromptCalled: false,
      };

      // Create a Yeoman environment
      const env = yeoman.createEnv();

      // Create a custom generator class that extends ProjectGenerator and captures prompt calls
      const TestProjectGenerator = class extends ProjectGenerator {
        // Override only the prompt method to capture what would be shown
        async prompt(questions) {
          if (questions && questions.length > 0) {
            if (questions[0].name === 'template') {
              testResult.promptChoices = questions[0].choices;
              testResult.promptDefault = questions[0].default;
              testResult.promptCalled = true;

              // Return the first choice to simulate user selection
              return { template: questions[0].choices[0] };
            } else if (questions[0].name === 'module') {
              testResult.modulePromptChoices = questions[0].choices;
              testResult.modulePromptDefault = questions[0].default;
              testResult.modulePromptCalled = true;

              // Return 'esm' to simulate user selection
              return { module: 'esm' };
            }
          }
          return {};
        }

        // Use this hook to ensure prompting is called
        async writing() {
          await this.prompting();
        }
      };

      // Register the test generator
      env.registerStub(TestProjectGenerator, 'test:project');

      // Run the generator through the environment
      await env.run('test:project', {
        path: '/tmp/test',
        ...options,
      });

      return testResult;
    }

    it('should filter template choices to ESM-supported templates when module=esm', async () => {
      const result = await testTemplateFiltering({
        module: 'esm',
      });

      // Verify that only ESM-supported templates are shown
      expect(result.promptChoices).to.deep.equal(ESM_SUPPORTED_TEMPLATES);
      expect(result.promptDefault).to.equal('minimal');
      expect(result.promptChoices).to.not.include('oauth2');
      expect(result.promptChoices).to.not.include('basic-auth');
      expect(result.promptCalled).to.equal(true);
    });

    it('should show all template choices when no module is specified', async () => {
      const result = await testTemplateFiltering({});

      // Verify that all templates are shown
      expect(result.promptChoices).to.deep.equal(TEMPLATE_CHOICES);
      expect(result.promptDefault).to.equal('minimal');
      expect(result.promptChoices).to.include('minimal');
      expect(result.promptChoices).to.include('oauth2');
      expect(result.promptChoices).to.include('basic-auth');
      expect(result.promptCalled).to.equal(true);
    });

    it('should show all template choices when module=commonjs', async () => {
      const result = await testTemplateFiltering({
        module: 'commonjs',
      });

      // Verify that all templates are shown
      expect(result.promptChoices).to.deep.equal(TEMPLATE_CHOICES);
      expect(result.promptDefault).to.equal('minimal');
      expect(result.promptCalled).to.equal(true);
    });

    it('should not prompt for template when template is already specified', async () => {
      const result = await testTemplateFiltering({
        module: 'esm',
        template: 'minimal',
      });

      // When template is specified, the generator should skip template prompting
      expect(result.promptCalled).to.equal(false);
    });

    it('should prioritize TypeScript filtering over ESM filtering when both are specified', async () => {
      const result = await testTemplateFiltering({
        language: 'typescript',
        module: 'esm', // This should be ignored in favor of TypeScript filtering
      });

      // Should show TypeScript templates, not ESM templates
      expect(result.promptChoices).to.deep.equal(TS_SUPPORTED_TEMPLATES);
      expect(result.promptDefault).to.equal('basic-auth');
      expect(result.promptChoices).to.not.deep.equal(ESM_SUPPORTED_TEMPLATES);
      expect(result.promptCalled).to.equal(true);
    });

    it('should use ESM filtering when language is JavaScript and module is ESM', async () => {
      const result = await testTemplateFiltering({
        language: 'javascript', // explicit JavaScript
        module: 'esm',
      });

      // Should show ESM templates for JavaScript
      expect(result.promptChoices).to.deep.equal(ESM_SUPPORTED_TEMPLATES);
      expect(result.promptDefault).to.equal('minimal');
      expect(result.promptCalled).to.equal(true);
    });

    it('should prompt for module when ESM template is selected without module', async () => {
      const result = await testTemplateFiltering({
        template: 'minimal', // minimal is an ESM template
        // module is not specified
      });

      // Should prompt for module choice
      expect(result.modulePromptChoices).to.deep.equal(['esm', 'commonjs']);
      expect(result.modulePromptDefault).to.equal('esm');
      expect(result.modulePromptCalled).to.equal(true);
    });

    it('should not prompt for module when non-ESM template is selected', async () => {
      const result = await testTemplateFiltering({
        template: 'oauth2', // oauth2 is not an ESM template
        // module is not specified
      });

      // Should not prompt for module choice
      expect(result.modulePromptCalled).to.equal(false);
    });

    it('should not prompt for module when module is already specified', async () => {
      const result = await testTemplateFiltering({
        template: 'minimal', // minimal is an ESM template
        module: 'esm', // module is already specified
      });

      // Should not prompt for module choice
      expect(result.modulePromptCalled).to.equal(false);
    });
  });
});
