'use strict';

/**
 * can call this multiple times safely
 */
const strLiteral = (input) =>
  !(input.startsWith("'") || input.startsWith('"')) ? `"${input}"` : input;

const interpLiteral = (input) => '`' + input + '`';

const block = (...statements) => statements.join('\n');

const RESPONSE_VAR = 'response';

// extra logic to handle inline comments
const obj = (...properties) =>
  `
    {${properties
      // if we don't join this with new lines, then prettier will minimize its height where possible
      // i was doing some trickery with ending comments with : to group things, but that wasn't working well
      // could probably do it if we took the block holistically and spaced things after the fact, but that's overkill for now.
      .map((p) => (p.startsWith('/') ? `\n\n${p}\n` : p + ','))
      .join('')}}
  `.trim();

// TypeScript version of obj that supports satisfies clause
const objTS = (type, ...properties) =>
  `
    {${properties
      .map((p) => (p.startsWith('/') ? `\n\n${p}\n` : p + ','))
      .join('')}}
  `.trim() + ` satisfies ${type}`;

const exportStatement = (obj, language) =>
  language === 'typescript'
    ? `export default ${obj}`
    : `module.exports = ${obj}`;

/**
 * @param {string} key could be a variable name or string value
 * @param {string | undefined} value can either be a variable or actual string. or could be missing, in which case the input is treated as a variable
 * @param {string | undefined} satisfiesType if provided, the property will be typed with the given type
 */
const objProperty = (key, value, satisfiesType) => {
  if (value === undefined) {
    return `${key}`;
  }
  // wrap key in quotes here in case the key isn't a valid property. prettier will remove if needed
  return `'${key}': ${value}${satisfiesType ? ` satisfies ${satisfiesType}` : ''}`;
};

const variableAssignmentDeclaration = (varName, value) =>
  `const ${varName} = ${value}`;

const fatArrowReturnFunctionDeclaration = (varname, args, statement) =>
  `const ${varname} = (${args.join(', ')}) => ${statement}`;

const functionDeclaration = (
  varName,
  { args = [], isAsync = false } = {},
  ...statements
) =>
  `
   const ${varName} = ${isAsync ? 'async ' : ''}(${args.join(', ')}) => {
    ${block(...statements)}
  }
`.trim();

/**
 * takes a bunch of object properties that get folded into z.request
 */
const zRequest = (url, ...requestOptions) => `
  z.request(${obj(objProperty('url', url), ...requestOptions)})
`;

// trim here is important because ASI adds a semi after a lonely return
const returnStatement = (statement) => `return ${statement.trim()}`;

const awaitStatement = (statement) => `await ${statement.trim()}`;

const arr = (...elements) => `[${elements.join(', ')}]`;

const zResponseErr = (message, type = strLiteral('AuthenticationError')) =>
  `
  throw new z.errors.Error(
    // This message is surfaced to the user
    ${message},
    ${type},
    ${RESPONSE_VAR}.status
  )
`.trim();

const ifStatement = (condition, ...results) => `
    if (${condition}) {
      ${block(...results)}
    }
`;

class CommentFormatter {
  constructor(comment) {
    this.words = comment.split(' ');
    this.currentLine = this.generateNewLine();
    this.lines = [];
    this.lineLimit = 80;
    this.splitComment();
  }

  generateNewLine() {
    return {
      words: [],
      sumWordsLength: 0,
    };
  }

  get currentLineLength() {
    return this.currentLine.sumWordsLength + this.currentLine.words.length;
  }

  resetLine() {
    this.lines.push(this.currentLine);
    this.currentLine = this.generateNewLine();
  }

  addWordToLine(word) {
    this.currentLine.words.push(word);
    this.currentLine.sumWordsLength += word.length;
  }

  splitComment() {
    this.words.forEach((word) => {
      if (word.includes('\n')) {
        const [endOfCurrent, firstOfNext] = word.split('\n');
        this.addWordToLine(endOfCurrent);
        this.resetLine();
        this.addWordToLine(firstOfNext);
        return;
      }

      // extra 1 because that's the space this word will "cost"
      if (this.currentLineLength + word.length + 1 > this.lineLimit) {
        // too long, start a new line
        this.resetLine();
      }
      this.addWordToLine(word);
    });
    // add the final (incomplete) line to the result
    this.resetLine();
  }

  toString() {
    return this.lines.map((line) => `// ${line.words.join(' ')}`).join('\n');
  }
}

const comment = (text, leadingNewlines = 0) =>
  `${'\n'.repeat(leadingNewlines)}${new CommentFormatter(text)}`;

const assignmentStatement = (variable, result) =>
  `
  ${variable} = ${result};
`.trim();

// files look more natural when each block is spaced a bit.
const file = (...statements) =>
  `
    'use strict'

    ${statements.join('\n\n')}
`.trim();

const fileTS = (typesToImport = [], ...statements) =>
  `
    import type { ${typesToImport.join(', ')} } from 'zapier-platform-core';

    ${statements.join('\n\n')}
`.trim();

module.exports = {
  arr,
  assignmentStatement,
  awaitStatement,
  block,
  comment,
  exportStatement,
  fatArrowReturnFunctionDeclaration,
  file,
  fileTS,
  functionDeclaration,
  ifStatement,
  interpLiteral,
  obj,
  objProperty,
  objTS,
  RESPONSE_VAR,
  returnStatement,
  strLiteral,
  variableAssignmentDeclaration,
  zRequest,
  zResponseErr,
};
