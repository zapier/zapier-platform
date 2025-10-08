const path = require('path');

const { merge } = require('lodash');
const filter = require('gulp-filter');
const { createGeneratorClass } = require('../utils/esm-wrapper');
const prettier = require('gulp-prettier');

const { PACKAGE_VERSION, PLATFORM_PACKAGE } = require('../constants');
const authFilesCodegen = require('../utils/auth-files-codegen');
const PullGeneratorPromise = require('./pull');

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

const writeGenericTypeScriptPackageJson = (gen, packageJsonExtension) => {
  gen.fs.writeJSON(
    gen.destinationPath('package.json'),
    merge(
      {
        name: gen.options.packageName,
        version: '1.0.0',
        description: '',
        scripts: {
          test: 'npm run build && vitest --run',
          clean: 'rimraf ./dist ./build',
          build: 'npm run clean && tsc',
          dev: 'npm run build -- --watch',
          '_zapier-build': 'npm run build',
        },
        dependencies: {
          [PLATFORM_PACKAGE]: PACKAGE_VERSION,
        },
        devDependencies: {
          rimraf: '^5.0.10',
          typescript: '5.6.2',
          vitest: '^2.1.2',
        },
        private: true,
        exports: './dist/index.js',
        type: 'module',
      },
      packageJsonExtension,
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

const writeGenericTypescriptIndex = (gen) => {
  gen.fs.copyTpl(
    gen.templatePath('index.template.ts'),
    gen.destinationPath('src/index.ts'),
    { corePackageName: PLATFORM_PACKAGE },
  );
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
  const content = authFilesCodegen[authType](gen.options.language);
  const destPath = (key) =>
    gen.options.language === 'typescript' ? `src/${key}.ts` : `${key}.js`;

  Object.entries(content).forEach(([key, value]) => {
    gen.fs.write(gen.destinationPath(destPath(key)), value);
  });
};

const writeGenericAuthTest = (gen) => {
  const authType = authTypes[gen.options.template];
  const fileExtension = gen.options.language === 'typescript' ? 'ts' : 'js';
  const destPath = gen.options.language === 'typescript' ? 'src/test' : 'test';
  gen.fs.copyTpl(
    gen.templatePath(
      `authTests/${authType || 'generic'}.test.${fileExtension}`,
    ),
    gen.destinationPath(`${destPath}/authentication.test.${fileExtension}`),
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
  if (gen.options.language === 'typescript') {
    writeGenericTypescriptIndex(gen);
    writeGenericTypeScriptPackageJson(gen);
    gen.fs.copyTpl(
      gen.templatePath('tsconfig.template.json'),
      gen.destinationPath('tsconfig.json'),
    );
  } else {
    writeGenericIndex(gen, true);
    writeGenericPackageJson(gen);
  }
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
};

const ESM_SUPPORTED_TEMPLATES = ['minimal'];

// Which templates can be used with the --language typescript flag
const TS_SUPPORTED_TEMPLATES = [
  'basic-auth',
  'custom-auth',
  'digest-auth',
  'oauth1-trello',
  'oauth2',
  'session-auth',
];

const TEMPLATE_CHOICES = Object.keys(TEMPLATE_ROUTES);

const ProjectGeneratorPromise = createGeneratorClass((Generator) => {
  return class ProjectGenerator extends Generator {
    initializing() {
      this.sourceRoot(path.resolve(__dirname, 'templates'));
      this.destinationRoot(path.resolve(this.options.path));

      const jsFilter = filter(['*.js', '*.json', '*.ts'], { restore: true });
      this.queueTransformStream([
        { disabled: true },
        jsFilter,
        prettier({ singleQuote: true }),
        jsFilter.restore,
      ]);
    }

    async prompting() {
      if (!this.options.template) {
        // Filter template choices based on language and module type
        let templateChoices = TEMPLATE_CHOICES;
        let defaultTemplate = 'minimal';

        // TypeScript filtering takes precedence over ESM filtering
        if (this.options.language === 'typescript') {
          templateChoices = TS_SUPPORTED_TEMPLATES;
          defaultTemplate = 'basic-auth';
        } else if (this.options.module === 'esm') {
          templateChoices = ESM_SUPPORTED_TEMPLATES;
          defaultTemplate = 'minimal'; // minimal is the only ESM template
        }

        this.answers = await this.prompt([
          {
            type: 'list',
            name: 'template',
            choices: templateChoices,
            message: 'Choose a project template to start with:',
            default: defaultTemplate,
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

      if (this.options.language) {
        if (this.options.language === 'typescript') {
          // check if the template supports typescript
          if (!TS_SUPPORTED_TEMPLATES.includes(this.options.template)) {
            throw new Error(
              'Typescript is not supported for this template, please use a different template or set the language to javascript. Supported templates: ' +
                TS_SUPPORTED_TEMPLATES.join(', '),
            );
          }
          // if they try to combine typescript with commonjs, throw an error
          if (this.options.module === 'commonjs') {
            throw new Error('Typescript is not supported for commonjs');
          } // esm is supported for typescript templates
        }
      } else {
        // default to javascript for the language if it's not set
        this.options.language = 'javascript';
      }

      if (
        !ESM_SUPPORTED_TEMPLATES.includes(this.options.template) &&
        this.options.module === 'esm' &&
        this.options.language === 'javascript'
      ) {
        throw new Error(
          'ESM is not supported for this template, please use a different template, set the module to commonjs, or try setting the language to Typescript',
        );
      }
    }

    writing() {
      this.options.packageName = path.basename(this.options.path);

      const writeFunc = TEMPLATE_ROUTES[this.options.template];
      writeFunc(this);
    }
  };
});

module.exports = {
  TEMPLATE_CHOICES,
  ESM_SUPPORTED_TEMPLATES,
  TS_SUPPORTED_TEMPLATES,
  PullGenerator: PullGeneratorPromise,
  ProjectGenerator: ProjectGeneratorPromise,
};
