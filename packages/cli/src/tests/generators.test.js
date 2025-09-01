const { expect } = require('chai');
const { ProjectGenerator, TEMPLATE_CHOICES } = require('../generators');

describe('ProjectGenerator', () => {
  describe('ESM template filtering', () => {
    it('should filter template choices to ESM-supported templates when module=esm', async () => {
      const generator = new ProjectGenerator([], {
        path: '/tmp/test',
        module: 'esm',
      });

      // Mock the prompt method to capture the choices passed to it
      let promptChoices;
      generator.prompt = async (questions) => {
        promptChoices = questions[0].choices;
        return { template: 'minimal' };
      };

      // Call the prompting method
      await generator.prompting();

      // Verify that only ESM-supported templates are shown
      expect(promptChoices).to.deep.equal(['minimal']);
      expect(promptChoices).to.not.include('oauth2');
      expect(promptChoices).to.not.include('basic-auth');
    });

    it('should show all template choices when no module is specified', async () => {
      const generator = new ProjectGenerator([], {
        path: '/tmp/test',
      });

      // Mock the prompt method to capture the choices passed to it
      let promptChoices;
      generator.prompt = async (questions) => {
        promptChoices = questions[0].choices;
        return { template: 'minimal' };
      };

      // Call the prompting method
      await generator.prompting();

      // Verify that all templates are shown
      expect(promptChoices).to.deep.equal(TEMPLATE_CHOICES);
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
      let promptChoices;
      generator.prompt = async (questions) => {
        promptChoices = questions[0].choices;
        return { template: 'minimal' };
      };

      // Call the prompting method
      await generator.prompting();

      // Verify that all templates are shown
      expect(promptChoices).to.deep.equal(TEMPLATE_CHOICES);
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
  });
});