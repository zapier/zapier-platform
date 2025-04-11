#!/usr/bin/env node
'use strict';

const fs = require('fs');

const commands = require('../src/oclif/oCommands');

// Takes all the cmd.docs and puts them into a big md file.
const generateCliMarkdown = () => {
  return (
    Object.keys(commands)
      .sort()
      // topics (such as `env` are listed as "true" in the commands so aliases play nice, but they don't need to be in docs
      .filter((name) => commands[name] !== true)
      .filter((name) => !commands[name].hide)
      .map((name) => {
        return commands[name].markdownHelp(name);
      })
      .join('\n\n\n')
  );
};

// Writes out a big markdown file for the cli.
const writeCliDocs = ({ markdownPath } = {}) => {
  const docs = generateCliMarkdown();

  fs.writeFileSync(
    markdownPath,
    `\
# Zapier CLI Command Reference

These are the generated docs for all Zapier platform CLI commands.

You can install the CLI with \`npm install -g zapier-platform-cli\`.

${'```'}bash
$ npm install -g zapier-platform-cli
${'```'}

# Commands

${docs}
`,
  );
};

writeCliDocs({
  markdownPath: './docs/cli.md',
});
