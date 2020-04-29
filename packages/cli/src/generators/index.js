const path = require('path');

const prettier = require('gulp-prettier');

const {
  NODE_VERSION,
  PACKAGE_VERSION,
  PLATFORM_PACKAGE
} = require('../constants');

const Generator = require('yeoman-generator');

const AUTH_TYPE_CHOICES = [
  {
    name: 'Basic',
    value: 'basic'
  },
  {
    name: 'Custom (API Key)',
    value: 'custom'
  },
  {
    name: 'Digest',
    value: 'digest'
  },
  {
    name: 'OAuth1',
    value: 'oauth1'
  },
  {
    name: 'OAuth2',
    value: 'oauth2'
  },
  {
    name: 'Session',
    value: 'session'
  }
];

class ProjectGenerator extends Generator {
  initializing() {
    this.sourceRoot(path.resolve(__dirname, 'templates'));
    this.destinationRoot(path.resolve(this.options.path));

    this.registerTransformStream(prettier({ singleQuote: true }));
  }

  async prompting() {
    if (!this.options.authType) {
      this.answers = await this.prompt([
        {
          type: 'list',
          name: 'authType',
          choices: AUTH_TYPE_CHOICES,
          message: "What's your authentication type?"
        }
      ]);
      this.options.authType = this.answers.authType;
    }
  }

  _writeReadme() {
    this.fs.copyTpl(
      this.templatePath('README.template.md'),
      this.destinationPath('README.md'),
      { name: this.options.packageName }
    );
  }

  _writePackageJson() {
    this.fs.writeJSON('package.json', {
      name: this.options.packageName,
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
  }

  _writeIndex() {
    this.fs.copyTpl(
      this.templatePath('index.template.js'),
      this.destinationPath('index.js'),
      { corePackageName: PLATFORM_PACKAGE }
    );
  }

  _writeAuth() {
    this.fs.write('authentication.js', `// TODO: ${this.options.authType}\n`);
  }

  _writeAuthTest() {
    this.fs.write(
      'test/authentication.js',
      `// TODO: ${this.options.authType}\n`
    );
  }

  writing() {
    this.options.packageName = path.basename(this.options.path);

    this._writeReadme();
    this._writePackageJson();
    this._writeIndex();
    this._writeAuth();
    this._writeAuthTest();
  }
}

module.exports = {
  AUTH_TYPE_CHOICES,
  ProjectGenerator
};
