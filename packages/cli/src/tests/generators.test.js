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
     * Helper function to test template filtering by running through Yeoman environment
     */
    async function testTemplateFiltering(options = {}, testName = 'test') {
      const env = yeoman.createEnv();

      const testResult = {
        promptChoices: undefined,
        promptDefault: undefined,
        promptCalled: false,
      };

      // Create a unique generator class name for proper isolation
      const generatorName = `TestProjectGenerator_${testName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create a custom generator class that captures prompt calls
      const TestGeneratorClass = class extends ProjectGenerator {
        async prompt(questions) {
          testResult.promptCalled = true;

          // Capture template-related prompts
          if (
            questions &&
            questions.length > 0 &&
            questions[0].name === 'template'
          ) {
            testResult.promptChoices = questions[0].choices;
            testResult.promptDefault = questions[0].default;
          }

          // Return appropriate response
          if (questions && questions.length > 0) {
            if (questions[0].name === 'template') {
              const templateChoice = testResult.promptChoices
                ? testResult.promptChoices[0]
                : 'minimal';
              return { template: templateChoice };
            } else if (questions[0].name === 'module') {
              return { module: 'esm' };
            }
          }

          return {};
        }

        // Skip the rest of the generator lifecycle to make tests faster
        writing() {
          // Do nothing - we only care about prompting
        }
      };

      env.registerStub(TestGeneratorClass, generatorName);

      // Run the generator through the environment
      await env.run(generatorName, options);

      return testResult;
    }

    it('should filter template choices to ESM-supported templates when module=esm', async () => {
      const result = await testTemplateFiltering(
        {
          path: '/tmp/test',
          module: 'esm',
        },
        'esm_filter',
      );

      // Verify that only ESM-supported templates are shown
      expect(result.promptChoices).to.deep.equal(ESM_SUPPORTED_TEMPLATES);
      expect(result.promptDefault).to.equal('minimal');
      expect(result.promptChoices).to.not.include('oauth2');
      expect(result.promptChoices).to.not.include('basic-auth');
      expect(result.promptCalled).to.equal(true);
    });

    it('should show all template choices when no module is specified', async () => {
      const result = await testTemplateFiltering(
        {
          path: '/tmp/test',
        },
        'no_module',
      );

      // Verify that all templates are shown
      expect(result.promptChoices).to.deep.equal(TEMPLATE_CHOICES);
      expect(result.promptDefault).to.equal('minimal');
      expect(result.promptChoices).to.include('minimal');
      expect(result.promptChoices).to.include('oauth2');
      expect(result.promptChoices).to.include('basic-auth');
      expect(result.promptCalled).to.equal(true);
    });

    it('should show all template choices when module=commonjs', async () => {
      const result = await testTemplateFiltering(
        {
          path: '/tmp/test',
          module: 'commonjs',
        },
        'commonjs',
      );

      // Verify that all templates are shown
      expect(result.promptChoices).to.deep.equal(TEMPLATE_CHOICES);
      expect(result.promptDefault).to.equal('minimal');
      expect(result.promptCalled).to.equal(true);
    });

    it('should not prompt for template when template is already specified', async () => {
      const result = await testTemplateFiltering(
        {
          path: '/tmp/test',
          module: 'esm',
          template: 'minimal',
        },
        'no_prompt',
      );

      // Verify that prompt was not called for template selection
      expect(result.promptCalled).to.equal(false);
    });

    it('should prioritize TypeScript filtering over ESM filtering when both are specified', async () => {
      const result = await testTemplateFiltering(
        {
          path: '/tmp/test',
          language: 'typescript',
          module: 'esm', // This should be ignored in favor of TypeScript filtering
        },
        'typescript_priority',
      );

      // Should show TypeScript templates, not ESM templates
      expect(result.promptChoices).to.deep.equal(TS_SUPPORTED_TEMPLATES);
      expect(result.promptDefault).to.equal('basic-auth');
      expect(result.promptChoices).to.not.deep.equal(ESM_SUPPORTED_TEMPLATES);
      expect(result.promptCalled).to.equal(true);
    });

    it('should use ESM filtering when language is JavaScript and module is ESM', async () => {
      const result = await testTemplateFiltering(
        {
          path: '/tmp/test',
          language: 'javascript', // explicit JavaScript
          module: 'esm',
        },
        'javascript_esm',
      );

      // Should show ESM templates for JavaScript
      expect(result.promptChoices).to.deep.equal(ESM_SUPPORTED_TEMPLATES);
      expect(result.promptDefault).to.equal('minimal');
      expect(result.promptCalled).to.equal(true);
    });
  });
});
