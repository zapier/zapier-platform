const colors = require('colors/safe');
const debug = require('debug')('zapier:pull');
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

  writing() {
    maybeOverwriteFiles(this);
  }

  end() {
    this.log(colors.green('zapier pull completed successfully'));
  }
};
