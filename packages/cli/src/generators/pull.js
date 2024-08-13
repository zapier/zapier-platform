const colors = require('colors/safe');
const debug = require('debug')('zapier:pull');
const inquirer = require('inquirer');
const path = require('path');
const Generator = require('yeoman-generator');

const maybeOverwriteFiles = async (gen) => {
  const existingFileSet = new Set(gen.options.deletableFiles);
  const delDir = gen.options.delDir;
  const srcDir = gen.options.srcDir;
  for (const file of gen.options.sourceFiles) {
    // File not in source, we don't have to worry about it
    if (!existingFileSet.has(file)) {
      continue;
    }
    gen.fs.copyTpl(
      gen.templatePath(path.join(srcDir, file)),
      gen.destinationPath(path.join(delDir, file)),
      gen.options
    );
  }
};

module.exports = class PullGenerator extends Generator {
  initializing() {
    debug('SRC', this.options.sourceFiles);
    debug('DEL', this.options.deletableFiles);
  }

  prompting() {
    const prompts = [
      {
        type: 'confirm',
        name: 'confirm',
        message: `Warning: You are about to overwrite existing files.

Before proceeding, please make sure you have saved your work. Consider creating a backup or saving your current state in a git branch. During the process, you may abort anytime by pressing 'a'. 

Do you want to continue?`,
        default: false,
      },
    ];

    return inquirer.prompt(prompts).then((answers) => {
      if (!answers.confirm) {
        this.log(colors.green('zapier pull cancelled'));
        process.exit(1);
      }
    });
  }

  writing() {
    maybeOverwriteFiles(this);
  }

  end() {
    this.log(colors.green('zapier pull completed successfully'));
  }
};
