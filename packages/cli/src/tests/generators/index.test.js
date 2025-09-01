const should = require('should');
const yeoman = require('yeoman-environment');

const {
  TEMPLATE_CHOICES,
  TS_SUPPORTED_TEMPLATES,
  ProjectGenerator,
} = require('../../generators/index.js');

describe('ProjectGenerator template filtering', () => {
  describe('prompting method template filtering', () => {
    let env;
    let generator;

    beforeEach(() => {
      env = yeoman.createEnv();
      // Create a minimal environment for the generator
      env.runLoop = { add: () => {} };
    });

    it('should filter templates to TypeScript-supported when language=typescript and no template specified', async () => {
      // Create generator instance with proper environment
      generator = Object.create(ProjectGenerator.prototype);
      generator.env = env;
      generator.options = {
        language: 'typescript',
        path: '/tmp/test',
        // template is undefined - this should trigger filtering
      };

      // Mock the prompt method to capture what choices are presented
      let capturedChoices = null;
      generator.prompt = async (prompts) => {
        const templatePrompt = prompts.find((p) => p.name === 'template');
        if (templatePrompt) {
          capturedChoices = templatePrompt.choices;
        }
        return { template: 'basic-auth' };
      };

      // Call the actual prompting method
      await generator.prompting();

      // Verify only TypeScript-supported templates were offered
      should(capturedChoices).be.ok();
      capturedChoices.should.deepEqual(TS_SUPPORTED_TEMPLATES);
      capturedChoices.should.not.deepEqual(TEMPLATE_CHOICES);
    });

    it('should show all templates when language=javascript and no template specified', async () => {
      generator = Object.create(ProjectGenerator.prototype);
      generator.env = env;
      generator.options = {
        language: 'javascript',
        path: '/tmp/test',
      };

      let capturedChoices = null;
      generator.prompt = async (prompts) => {
        const templatePrompt = prompts.find((p) => p.name === 'template');
        if (templatePrompt) {
          capturedChoices = templatePrompt.choices;
        }
        return { template: 'minimal' };
      };

      await generator.prompting();

      // Verify all templates were offered for JavaScript
      should(capturedChoices).be.ok();
      capturedChoices.should.deepEqual(TEMPLATE_CHOICES);
    });

    it('should show all templates when no language specified (defaults to javascript)', async () => {
      generator = Object.create(ProjectGenerator.prototype);
      generator.env = env;
      generator.options = {
        path: '/tmp/test',
        // language is undefined - should default to javascript behavior
      };

      let capturedChoices = null;
      generator.prompt = async (prompts) => {
        const templatePrompt = prompts.find((p) => p.name === 'template');
        if (templatePrompt) {
          capturedChoices = templatePrompt.choices;
        }
        return { template: 'minimal' };
      };

      await generator.prompting();

      // Verify all templates were offered (default behavior)
      should(capturedChoices).be.ok();
      capturedChoices.should.deepEqual(TEMPLATE_CHOICES);
    });

    it('should not prompt for template when template is already specified', async () => {
      generator = Object.create(ProjectGenerator.prototype);
      generator.env = env;
      generator.options = {
        language: 'typescript',
        template: 'basic-auth', // template is pre-specified
        path: '/tmp/test',
      };

      let promptWasCalled = false;
      generator.prompt = async () => {
        promptWasCalled = true;
        return {};
      };

      await generator.prompting();

      // Verify prompt was not called since template was already specified
      promptWasCalled.should.be.false();
      generator.options.template.should.equal('basic-auth');
    });
  });

  describe('template constants validation', () => {
    it('should have TypeScript templates as subset of all templates', () => {
      // Verify TypeScript templates are properly configured
      TS_SUPPORTED_TEMPLATES.forEach((template) => {
        TEMPLATE_CHOICES.should.containEql(template);
      });

      // Verify there are fewer TypeScript templates than total templates
      TS_SUPPORTED_TEMPLATES.length.should.be.lessThan(TEMPLATE_CHOICES.length);
    });

    it('should export required constants', () => {
      // Verify the constants are properly exported
      should(TEMPLATE_CHOICES).be.ok();
      should(TS_SUPPORTED_TEMPLATES).be.ok();
      TEMPLATE_CHOICES.should.be.an.Array();
      TS_SUPPORTED_TEMPLATES.should.be.an.Array();
    });
  });
});
