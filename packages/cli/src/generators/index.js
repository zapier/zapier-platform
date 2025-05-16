const path = require('path');

const { merge } = require('lodash');
const filter = require('gulp-filter');
const Generator = require('yeoman-generator');
const prettier = require('gulp-prettier');

const { PACKAGE_VERSION, PLATFORM_PACKAGE } = require('../constants');
const authFilesCodegen = require('../utils/auth-files-codegen');
const { PullGenerator } = require('./pull');

const writeGenericReadme = (gen) => {
  gen.fs.copyTpl(
    gen.templatePath('README.template.md'),
    gen.destinationPath('README.md'),
    { name: gen.options.packageName },
  );
};

const appendReadme = (gen) => {
  const content = gen.fs.read(
    gen.templatePath(gen.options.template, 'README.md'),
    { defaults: '' },
  );
  if (content) {
    gen.fs.append(gen.destinationPath('README.md'), '\n' + content);
  }
};

const writeGitignore = (gen) => {
  gen.fs.copy(gen.templatePath('gitignore'), gen.destinationPath('.gitignore'));
};

const writeGenericPackageJson = (gen, packageJsonExtension) => {
  const moduleExtension =
    gen.options.module === 'esm'
      ? {
          exports: './index.js',
          type: 'module',
        }
      : {
          main: 'index.js',
        };

  const fullExtension = merge(moduleExtension, packageJsonExtension);

  gen.fs.writeJSON(
    gen.destinationPath('package.json'),
    merge(
      {
        name: gen.options.packageName,
        version: '1.0.0',
        description: '',
        scripts: {
          test: 'jest --testTimeout 10000',
        },
        dependencies: {
          [PLATFORM_PACKAGE]: PACKAGE_VERSION,
        },
        devDependencies: {
          jest: '^29.6.0',
        },
        private: true,
      },
      fullExtension,
    ),
  );
};

const writeTypeScriptPackageJson = (gen, packageJsonExtension) => {
  const moduleExtension =
    gen.options.module === 'esm'
      ? {
          exports: './dist/index.js',
          type: 'module',
        }
      : {
          main: 'index.js',
        };

  const fullExtension = merge(moduleExtension, packageJsonExtension);

  gen.fs.writeJSON(
    gen.destinationPath('package.json'),
    merge(
      {
        name: gen.options.packageName,
        version: '1.0.0',
        description: '',
        scripts: {
          test: 'vitest',
        },
        dependencies: {
          [PLATFORM_PACKAGE]: PACKAGE_VERSION,
        },
        devDependencies: {
          vitest: '^2.1.2',
        },
        private: true,
      },
      fullExtension,
    ),
  );
};

const writeGenericIndex = (gen, hasAuth) => {
  const templatePath =
    gen.options.module === 'esm'
      ? 'index-esm.template.js'
      : 'index.template.js';
  gen.fs.copyTpl(
    gen.templatePath(templatePath),
    gen.destinationPath('index.js'),
    { corePackageName: PLATFORM_PACKAGE, hasAuth },
  );
};

const writeTypeScriptIndex = (gen) => {
  const templatePath =
    gen.options.module === 'esm'
      ? 'index-esm.template.ts'
      : 'index.template.ts';
  gen.fs.copyTpl(
    gen.templatePath(templatePath),
    gen.destinationPath('src/index.ts'),
  );

  // create root directory index.js if it's commonjs
  if (gen.options.module === 'commonjs') {
    const content = `module.exports = require('./dist').default;`;
    gen.fs.write(gen.destinationPath('index.js'), content);
  }
};

const authTypes = {
  'basic-auth': 'basic',
  'custom-auth': 'custom',
  'digest-auth': 'digest',
  'oauth1-trello': 'oauth1',
  oauth2: 'oauth2',
  'session-auth': 'session',
};

const writeGenericAuth = (gen) => {
  const authType = authTypes[gen.options.template];
  const content = authFilesCodegen[authType]();
  gen.fs.write(gen.destinationPath('authentication.js'), content);
};

const writeGenericAuthTest = (gen) => {
  const authType = authTypes[gen.options.template];
  gen.fs.copyTpl(
    gen.templatePath(`authTests/${authType || 'generic'}.test.js`),
    gen.destinationPath('test/authentication.test.js'),
  );
};

const writeGenericTest = (gen) => {
  gen.fs.copyTpl(
    gen.templatePath('authTests/generic.test.js'),
    gen.destinationPath('test/example.test.js'),
  );
};

// Write files for templates that demonstrate an auth type
const writeForAuthTemplate = (gen) => {
  writeGitignore(gen);
  writeGenericReadme(gen);
  writeGenericPackageJson(gen);
  writeGenericIndex(gen, true);
  writeGenericAuth(gen);
  writeGenericAuthTest(gen);
};

const writeForMinimalTemplate = (gen) => {
  writeGitignore(gen);
  writeGenericReadme(gen);
  writeGenericPackageJson(gen);
  writeGenericIndex(gen, false);
  writeGenericTest(gen);
};

// Write files for "standalone" templates, which essentially just copies an
// example directory
const writeForStandaloneTemplate = (gen) => {
  writeGitignore(gen);
  writeGenericReadme(gen);
  appendReadme(gen);

  const packageJsonExtension = {
    // Put template-specific package.json settings here, grouped by template
    // names. This is going to used to extend the generic package.json.
    files: {
      dependencies: {
        'form-data': '4.0.0',
      },
    },
  }[gen.options.template];

  writeGenericPackageJson(gen, packageJsonExtension);

  gen.fs.copy(
    gen.templatePath(gen.options.template, '**', '*.{js,json,ts}'),
    gen.destinationPath(),
  );
};

const writeForStandaloneTypeScriptTemplate = (gen) => {
  writeGitignore(gen);
  writeGenericReadme(gen);
  appendReadme(gen);

  const packageJsonExtension = {
    typescript: {
      scripts: {
        test: 'vitest --run',
        clean: 'rimraf ./dist ./build',
        build: 'npm run clean && tsc',
        '_zapier-build': 'npm run build',
      },
      devDependencies: {
        rimraf: '^5.0.10',
        typescript: '5.6.2',
        vitest: '^2.1.2',
      },
    },
  }[gen.options.template];

  writeTypeScriptPackageJson(gen, packageJsonExtension);

  gen.fs.copy(
    gen.templatePath(gen.options.template, '**', '*.{js,json,ts}'),
    gen.destinationPath(),
  );
  writeTypeScriptIndex(gen);
};

const TEMPLATE_ROUTES = {
  'basic-auth': writeForAuthTemplate,
  callback: writeForStandaloneTemplate,
  'custom-auth': writeForAuthTemplate,
  'digest-auth': writeForAuthTemplate,
  'dynamic-dropdown': writeForStandaloneTemplate,
  files: writeForStandaloneTemplate,
  minimal: writeForMinimalTemplate,
  'oauth1-trello': writeForAuthTemplate,
  oauth2: writeForAuthTemplate,
  openai: writeForStandaloneTemplate,
  'search-or-create': writeForStandaloneTemplate,
  'session-auth': writeForAuthTemplate,
  typescript: writeForStandaloneTypeScriptTemplate,
};

const ESM_SUPPORTED_TEMPLATES = ['minimal', 'typescript'];

const TEMPLATE_CHOICES = Object.keys(TEMPLATE_ROUTES);

class ProjectGenerator extends Generator {
  initializing() {
    this.sourceRoot(path.resolve(__dirname, 'templates'));
    this.destinationRoot(path.resolve(this.options.path));

    const jsFilter = filter(['*.js', '*.json'], { restore: true });
    this.queueTransformStream([
      jsFilter,
      prettier({ singleQuote: true }),
      jsFilter.restore,
    ]);
  }

  async prompting() {
    if (!this.options.template) {
      this.answers = await this.prompt([
        {
          type: 'list',
          name: 'template',
          choices: TEMPLATE_CHOICES,
          message: 'Choose a project template to start with:',
          default: 'minimal',
        },
      ]);
      this.options.template = this.answers.template;
    }

    if (
      ESM_SUPPORTED_TEMPLATES.includes(this.options.template) &&
      !this.options.module
    ) {
      this.answers = await this.prompt([
        {
          type: 'list',
          name: 'module',
          choices: ['esm', 'commonjs'],
          message: 'Choose module type:',
          default: 'esm',
        },
      ]);
      this.options.module = this.answers.module;
    }

    if (
      !ESM_SUPPORTED_TEMPLATES.includes(this.options.template) &&
      this.options.module === 'esm'
    ) {
      throw new Error(
        'ESM is not supported for this template, please use a different template or set the module to commonjs',
      );
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
  PullGenerator,
  ProjectGenerator,
};
