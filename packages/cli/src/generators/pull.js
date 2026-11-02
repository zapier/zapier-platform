const colors = require('colors/safe');
const debug = require('debug')('zapier:pull');
const inquirer = require('inquirer');
const path = require('path');

const { createFileEditor } = require('../utils/esm-wrapper');
const { commitFiles } = require('./commit-files');

const confirmOverwrite = async () => {
  const prompts = [
    {
      type: 'confirm',
      name: 'confirm',
      message: `Warning: You are about to overwrite existing files.

Before proceeding, please make sure you have saved your work. Consider creating a backup or saving your current state in a git branch.

If presented with a series of options ('ynadxreiH'), you may
press Enter to view more details about each option. For example, 'x' will abort the process.

Do you want to continue?`,
      default: false,
    },
  ];

  const answers = await inquirer.prompt(prompts);
  if (!answers.confirm) {
    console.log(colors.green('zapier pull cancelled'));
    process.exit(1);
  }
};

/**
 * Copies the pulled source files over the local integration files, asking
 * before it overwrites a file that has different contents.
 * @param {object} options
 * @param {string[]} options.sourceFiles paths relative to `srcDir`
 * @param {string} options.srcDir directory that holds the pulled source files
 * @param {string} options.dstDir directory of the local integration
 */
const pullFiles = async ({ sourceFiles, srcDir, dstDir }) => {
  debug('SRC', sourceFiles);

  await confirmOverwrite();

  const editor = await createFileEditor();
  for (const file of sourceFiles) {
    editor.copy(path.join(srcDir, file), path.join(dstDir, file));
  }
  await commitFiles(editor);

  console.log(colors.green('zapier pull completed successfully'));
};

module.exports = {
  pullFiles,
};
