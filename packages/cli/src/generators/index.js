const path = require('path');

const prettier = require('gulp-prettier');

const {
  NODE_VERSION,
  PACKAGE_VERSION,
  PLATFORM_PACKAGE
} = require('../constants');

const Generator = require('yeoman-generator');

const writeGenericReadme = gen => {
  gen.fs.copyTpl(
    gen.templatePath('README.template.md'),
    gen.destinationPath('README.md'),
    { name: gen.options.packageName }
  );
};

const writeGenericPackageJson = gen => {
  gen.fs.writeJSON('package.json', {
    name: gen.options.packageName,
    version: '1.0.0',
    description: '',
    main: 'index.js',
    scripts: {
      test: 'mocha --recursive -t 10000 test'
    },
    engines: {
      node: `>=${NODE_VERSION}`,
      npm: '>=5.6.0'
    },
    dependencies: {
      [PLATFORM_PACKAGE]: PACKAGE_VERSION
    },
    devDependencies: {
      mocha: '^5.2.0',
      should: '^13.2.0'
    },
    private: true
  });
};

const writeGenericIndex = gen => {
  gen.fs.copyTpl(
    gen.templatePath('index.template.js'),
    gen.destinationPath('index.js'),
    { corePackageName: PLATFORM_PACKAGE }
  );
};

const writeGenericAuth = gen => {
  gen.fs.write('authentication.js', '// TODO\n');
};

const writeGenericAuthTest = gen => {
  gen.fs.write(path.join('test', 'authentication.js'), '// TODO\n');
};

// Write files for templates that demonstrate an auth type
const writeForAuthTemplate = gen => {
  writeGenericReadme(gen);
  writeGenericPackageJson(gen);
  writeGenericIndex(gen);
  writeGenericAuth(gen);
  writeGenericAuthTest(gen);
};

// Write files for "standalone" templates, which essentially just copies an
// example directory
const writeForStandaloneTemplate = gen => {
  gen.fs.copy(
    gen.templatePath(gen.options.template, '**', '*.{js,json,md,ts}'),
    gen.destinationPath()
  );
  if (!gen.fs.exists(gen.destinationPath('README.md'))) {
    writeGenericReadme(gen);
  }
  if (!gen.fs.exists(gen.destinationPath('package.json'))) {
    writeGenericPackageJson(gen);
  }
};

const TEMPLATE_ROUTES = {
  'basic-auth': writeForAuthTemplate,
  'custom-auth': writeForAuthTemplate,
  'digest-auth': writeForAuthTemplate,
  'dynamic-dropdown': writeForStandaloneTemplate,
  files: writeForStandaloneTemplate,
  minimal: null,
  'oauth1-trello': writeForAuthTemplate,
  oauth2: writeForAuthTemplate,
  'search-or-create': writeForStandaloneTemplate,
  'session-auth': writeForAuthTemplate,
  typescript: writeForStandaloneTemplate
};

const TEMPLATE_CHOICES = Object.keys(TEMPLATE_ROUTES);

class ProjectGenerator extends Generator {
  initializing() {
    this.sourceRoot(path.resolve(__dirname, 'templates'));
    this.destinationRoot(path.resolve(this.options.path));

    this.registerTransformStream(prettier({ singleQuote: true }));
  }

  async prompting() {
    if (!this.options.template) {
      this.answers = await this.prompt([
        {
          type: 'list',
          name: 'template',
          choices: TEMPLATE_CHOICES,
          message: 'Choose a project template to start with:',
          default: 'minimal'
        }
      ]);
      this.options.template = this.answers.template;
    }
  }

  writing() {
    this.options.packageName = path.basename(this.options.path);

    const writeFunc = TEMPLATE_ROUTES[this.options.template];
    writeFunc(this);
  }
}

module.exports = {
  TEMPLATE_CHOICES,
  ProjectGenerator
};
