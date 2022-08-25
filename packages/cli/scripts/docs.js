#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const toc = require('markdown-toc');
const litdoc = require('litdoc');
const commands = require('../src/oclif/oCommands');

const { LAMBDA_VERSION, PACKAGE_VERSION } = require('../src/constants');

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
# Zapier CLI Reference

These are the generated docs for all Zapier platform CLI commands.

You can install the CLI with \`npm install -g zapier-platform-cli\`.

${'```'}bash
$ npm install -g zapier-platform-cli
${'```'}

# Commands

${docs}
`
  );
};

// replaces line with file contents if line has [insert-file:xxx]
const maybeInsertSnippet = (line) => {
  const m = line.match(/\[insert-file:(.+)\]/);
  if (m) {
    const file = path.resolve(__dirname, '..', m[1]);
    return fs.readFileSync(file, 'utf8');
  }
  return line;
};

const fillLambdaVersion = (line) => {
  return line.replace(/LAMBDA_VERSION/g, LAMBDA_VERSION);
};

const fillPackageVersion = (line) => {
  return line.replace(/PACKAGE_VERSION/g, PACKAGE_VERSION);
};

// Inserts code snippets from README-source.md into README.md
const buildReadme = () => {
  const readmeSrc = path.resolve(__dirname, '../README-source.md');
  const readmeDst = path.resolve(__dirname, '../README.md');

  const lines = fs.readFileSync(readmeSrc, 'utf8').split('\n');
  const newLines = lines
    .map(maybeInsertSnippet)
    .map(fillLambdaVersion)
    .map(fillPackageVersion)
    .join('\n');
  const tocInstered = toc.insert(newLines);
  fs.writeFileSync(
    readmeDst,
    '<!-- GENERATED! ONLY EDIT `README-source.md` -->\n\n' + tocInstered
  );
};

buildReadme();

writeCliDocs({
  markdownPath: './docs/cli.md',
});

// The generated html is only for light theme. Let's just use the same image for
// both light and dark mode.
let markdownContent = fs.readFileSync(path.join(__dirname, '../README.md'), {
  encoding: 'utf8',
});
markdownContent = markdownContent.replace(
  '11069978ee4a9b1eeeeb62b11f541b7c.png', // <- logo for dark theme
  '2602734341239f1b82ef0ff4ca160430.png' // <- logo for light theme
);

litdoc({
  title: 'Zapier Platform CLI Documentation',
  markdown: markdownContent,
  outputPath: path.join(__dirname, '../docs/index.html'),
  templatePath: path.join(__dirname, '../docs/template.jst'),
});

// TODO: toc(../../docs/README.md) to ../../README.md

litdoc({
  title: 'Zapier Platform CLI Reference',
  markdownPath: path.join(__dirname, '../docs/cli.md'),
  outputPath: path.join(__dirname, '../docs/cli.html'),
  templatePath: path.join(__dirname, '../docs/template.jst'),
});
