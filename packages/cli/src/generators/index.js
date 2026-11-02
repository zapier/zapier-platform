const path = require('path');

const inquirer = require('inquirer');
const { merge } = require('lodash');
const filter = require('gulp-filter');
const prettier = require('gulp-prettier');

const { PACKAGE_VERSION, PLATFORM_PACKAGE } = require('../constants');
const authFilesCodegen = require('../utils/auth-files-codegen');
const { createFileEditor } = require('../utils/esm-wrapper');
const { commitFiles } = require('./commit-files');

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
          test: 'rimraf ./dist ./build && tsc && vitest --run',
          clean: 'rimraf ./dist ./build',
          build: 'rimraf ./dist ./build && tsc',
          dev: 'rimraf ./dist ./build && tsc --watch',
          '_zapier-build': 'rimraf ./dist ./build && tsc',
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
  'line-items': writeForStandaloneTemplate,
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

/**
 * Asks for the template and the module type when they weren't passed in, and
 * checks that the options work together.
 * @param {object} options `path`, `template`, `module`, and `language`
 * @param {Function} [prompt] an `inquirer.prompt` compatible function
 * @returns {Promise<object>} the options, with the answers filled in
 */
const getProjectOptions = async (options, prompt = inquirer.prompt) => {
  const projectOptions = { ...options };

  if (!projectOptions.template) {
    // Filter template choices based on language and module type
    let templateChoices = TEMPLATE_CHOICES;
    let defaultTemplate = 'minimal';

    // TypeScript filtering takes precedence over ESM filtering
    if (projectOptions.language === 'typescript') {
      templateChoices = TS_SUPPORTED_TEMPLATES;
      defaultTemplate = 'basic-auth';
    } else if (projectOptions.module === 'esm') {
      templateChoices = ESM_SUPPORTED_TEMPLATES;
      defaultTemplate = 'minimal'; // minimal is the only ESM template
    }

    const answers = await prompt([
      {
        type: 'list',
        name: 'template',
        choices: templateChoices,
        message: 'Choose a project template to start with:',
        default: defaultTemplate,
      },
    ]);
    projectOptions.template = answers.template;
  }

  if (
    ESM_SUPPORTED_TEMPLATES.includes(projectOptions.template) &&
    !projectOptions.module
  ) {
    const answers = await prompt([
      {
        type: 'list',
        name: 'module',
        choices: ['esm', 'commonjs'],
        message: 'Choose module type:',
        default: 'esm',
      },
    ]);
    projectOptions.module = answers.module;
  }

  if (projectOptions.language) {
    if (projectOptions.language === 'typescript') {
      // check if the template supports typescript
      if (!TS_SUPPORTED_TEMPLATES.includes(projectOptions.template)) {
        throw new Error(
          'Typescript is not supported for this template, please use a different template or set the language to javascript. Supported templates: ' +
            TS_SUPPORTED_TEMPLATES.join(', '),
        );
      }
      // if they try to combine typescript with commonjs, throw an error
      if (projectOptions.module === 'commonjs') {
        throw new Error('Typescript is not supported for commonjs');
      } // esm is supported for typescript templates
    }
  } else {
    // default to javascript for the language if it's not set
    projectOptions.language = 'javascript';
  }

  if (
    !ESM_SUPPORTED_TEMPLATES.includes(projectOptions.template) &&
    projectOptions.module === 'esm' &&
    projectOptions.language === 'javascript'
  ) {
    throw new Error(
      'ESM is not supported for this template, please use a different template, set the module to commonjs, or try setting the language to Typescript',
    );
  }

  return projectOptions;
};

/**
 * Creates a new integration from a project template.
 * @param {object} options the result of `getProjectOptions`
 */
const generateProject = async (options) => {
  const sourceRoot = path.resolve(__dirname, 'templates');
  const destinationRoot = path.resolve(options.path);

  // The template writers above use this object to read templates and to
  // stage files in memory
  const gen = {
    options: { ...options, packageName: path.basename(options.path) },
    fs: await createFileEditor(),
    templatePath: (...paths) => path.join(sourceRoot, ...paths),
    destinationPath: (...paths) => path.join(destinationRoot, ...paths),
  };

  const writeFunc = TEMPLATE_ROUTES[gen.options.template];
  writeFunc(gen);

  const jsFilter = filter(['*.js', '*.json', '*.ts'], { restore: true });
  await commitFiles(gen.fs, {
    transforms: [jsFilter, prettier({ singleQuote: true }), jsFilter.restore],
  });
};

module.exports = {
  TEMPLATE_CHOICES,
  ESM_SUPPORTED_TEMPLATES,
  TS_SUPPORTED_TEMPLATES,
  generateProject,
  getProjectOptions,
};
