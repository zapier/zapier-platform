#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const _ = require('lodash');

const toc = require('markdown-toc');
const litdoc = require('litdoc');

const commands = require('../commands');

const block = (str) => '> ' + str.split('\n').join('\n> ');

const LAMBDA_VERSION = 'v4.3.2';

// Takes all the cmd.docs and puts them into a big md file.
const generateCliMarkdown = () => {
  return _.orderBy(Object.keys(commands))
    .filter((name) => !commands[name].hide)
    .map((name) => {
      const command = commands[name];
      return `\
  ## ${name}

  ${block(command.help)}

  **Usage:** \`${command.usage || command.example}\`

  ${command.docs}
  `.trim();
    }).join('\n\n\n');
};

// Writes out a big markdown file for the cli.
const writeCliDocs = ({ markdownPath } = {}) => {
  const docs = generateCliMarkdown();

  fs.writeFileSync(markdownPath, `\
# Zapier CLI Reference

These are the generated docs for all Zapier platform CLI commands.

You can install the CLI with \`npm install -g zapier-platform-cli\`.

${'```'}bash
$ npm install -g zapier-platform-cli
${'```'}

# Commands

${docs}
`);
};

// replaces line with file contents if line has [insert-file:xxx]
const maybeInsertSnippet = (line) => {
  const m = line.match(/\[insert-file:(.+)\]/);
  if (m) {
    const file = path.resolve(__dirname, '../..', m[1]);
    return fs.readFileSync(file, 'utf8');
  }
  return line;
};

const fillLambdaVersion = (line) => {
  return line.replace(/LAMBDA_VERSION/g, LAMBDA_VERSION);
};

// Inserts code snippets from README-source.md into README.md
const buildReadme = () => {
  const readmeSrc = path.resolve(__dirname, '../../README-source.md');
  const readmeDst = path.resolve(__dirname, '../../README.md');

  const lines = fs.readFileSync(readmeSrc, 'utf8').split('\n');
  const newLines = lines.map(maybeInsertSnippet).map(fillLambdaVersion).join('\n');
  fs.writeFileSync(readmeDst, toc.insert(newLines));
};

buildReadme();

writeCliDocs({
  markdownPath: './docs/cli.md'
});

litdoc({
  title: 'Zapier Platform CLI Documentation',
  markdownPath: path.join(__dirname, '../../README.md'),
  outputPath: path.join(__dirname, '../../docs/index.html')
});

// TODO: toc(../../docs/README.md) to ../../README.md

litdoc({
  title: 'Zapier Platform CLI Reference',
  markdownPath: path.join(__dirname, '../../docs/cli.md'),
  outputPath: path.join(__dirname, '../../docs/cli.html')
});
