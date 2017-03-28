const readline = require('readline');

const {isWindows} = require('./misc');

// could we explore https://www.npmjs.com/package/columnify
// to simplify the columns/tables? the | - decoration is big
const Table = require('cli-table2');
const colors = require('colors/safe');
const stringLength = require('string-length');
const _ = require('lodash');
const read = require('read');

const notUndef = (s) => String(s === undefined ? '' : s).trim();

const unBacktick = (s) => s.replace(/\n?`+(bash)?/g, '');

const markdownLog = (str) => {
  // turn markdown into something with styles and stuff
  // https://blog.mariusschulz.com/content/images/sublime_markdown_with_syntax_highlighting.png
  console.log(unBacktick(str));
};

// Convert rows from keys to column labels.
const rewriteLabels = (rows, columnDefs) => {
  return rows.map((row) => {
    const consumptionRow = {};
    columnDefs.forEach((columnDef) => {
      const [label, key, _default] = columnDef;
      const val = _.get(row, key || label, _default);
      consumptionRow[label] = notUndef(val);
    });
    return consumptionRow;
  });
};

const makePlainSingle = (row) => {
  return _.map(row, (value, key) => {
    return (colors.grey('==') + ' ' + colors.bold(key) + '\n' + value).trim();
  }).join('\n');
};

// An easier way to print rows for copy paste accessibility.
const makePlain = (rows, columnDefs) => {
  return rewriteLabels(rows, columnDefs)
    .map(makePlainSingle)
    .join(colors.grey('\n\n - - - - - - - - - - - - - - - - - - \n\n')) + '\n';
};

const isTooWideForWindow = (str) => {
  const widestRow = str.split('\n').reduce((coll, row) => {
    if (stringLength(row) > coll) {
      return stringLength(row);
    } else {
      return coll;
    }
  }, 0);

  return widestRow > process.stdout.columns;
};

const ansiTrim = (s) => _.trim(s, [
  '\r',
  '\n',
  ' ',
  // '\u001b[39m',
  // '\u001b[90m',
]);

const CHARS = {
  // 'top': '', 'top-mid': '', 'top-left': '', 'top-right': '',
  // 'bottom': ' ', 'bottom-mid': ' ', 'bottom-left': ' ', 'bottom-right': ' '
};
// Wraps the cli-table2 library. Rows is an array of objects, columnDefs
// an ordered sub-array [[label, key, (optional_default)], ...].
const makeTable = (rows, columnDefs) => {
  const tableOptions = {
    head: columnDefs.map(([label]) => label),
    chars: CHARS,
    style: {
      compact: true,
      head: ['bold']
    }
  };
  const table = new Table(tableOptions);

  rows.forEach((row) => {
    const consumptionRow = [];
    columnDefs.forEach((columnDef) => {
      const [label, key, _default] = columnDef;
      const val = _.get(row, key || label, _default);
      consumptionRow.push(notUndef(val));
    });
    table.push(consumptionRow);
  });

  const strTable = ansiTrim(table.toString());

  if (isTooWideForWindow(strTable)) {
    return makeRowBasedTable(rows, columnDefs, {includeIndex: false});
  }

  return strTable;
};

// Similar to makeTable, but prints the column headings in the left-hand column
// and the values in the right-hand column, in rows
const makeRowBasedTable = (rows, columnDefs, {includeIndex = true} = {}) => {
  const tableOptions = {
    chars: CHARS,
    style: {
      compact: true
    }
  };
  const table = new Table(tableOptions);

  const maxLabelLength = _.reduce(columnDefs, (maxLength, columnDef) => {
    if (columnDef[0] && stringLength(columnDef[0]) > maxLength) {
      return stringLength(columnDef[0]);
    }
    return maxLength;
  }, 1);
  const widthForValue = process.stdout.columns - maxLabelLength - 15; // The last bit accounts for some padding and borders

  rows.forEach((row, index) => {
    if (includeIndex) {
      table.push([{colSpan: 2, content: colors.grey(`= ${index + 1} =`)}]);
    }

    columnDefs.forEach((columnDef) => {
      const consumptionRow = {};
      const [label, key, _default] = columnDef;
      let val = _.get(row, key || label, _default);
      val = notUndef(val);

      if (stringLength(val) > widthForValue) {
        try {
          val = prettyJSONstringify(JSON.parse(val));
        } catch(err) {
          // Wasn't JSON, so splice in newlines so that word wraping works properly
          let rest = val;
          val = '';
          while (stringLength(rest) > 0) {
            val += rest.slice(0, widthForValue);
            if (val.indexOf('\n') === -1) {
              val += '\n';
            }
            rest = rest.slice(widthForValue);
          }
        }
      }
      let colLabel = '    ' + colors.bold(label);
      if (!includeIndex) {
        colLabel = colors.bold(label) + '   ';
      }
      consumptionRow[colLabel] = val.trim();
      table.push(consumptionRow);
    });

    if (index < rows.length - 1) {
      table.push([{colSpan: 2, content: '  '}]);
    }
  });

  const strTable = ansiTrim(table.toString());

  if (isTooWideForWindow(strTable)) {
    return makePlain(rows, columnDefs);
  }

  return strTable;
};

const prettyJSONstringify = (obj) => JSON.stringify(obj, null, '  ');

const makeJSON = (rows, columnDefs) => prettyJSONstringify(rewriteLabels(rows, columnDefs));
const makeRawJSON = (rows) => prettyJSONstringify(rows);

const makeSmall = (rows) => {
  const longestRow = _.max(rows.map(r => r.name.length));
  let res = [];

  rows.forEach(row => {
    res.push(`  ${row.name}${' '.repeat(longestRow - row.name.length + 1)} # ${row.help}`);
  });

  return res.join('\n');
};

const DEFAULT_STYLE = 'table';
const formatStyles = {
  plain: makePlain,
  json: makeJSON,
  raw: makeRawJSON,
  row: makeRowBasedTable,
  table: makeTable,
  small: makeSmall
};

const printData = (rows, columnDefs, ifEmptyMessage = '', useRowBasedTable = false) => {
  const formatStyle = (global.argOpts || {}).format || (useRowBasedTable ? 'row-based' : DEFAULT_STYLE);
  const formatter = formatStyles[formatStyle] || formatStyles[DEFAULT_STYLE];
  if (rows && !rows.length) {
    console.log(ifEmptyMessage);
  } else {
    // console.log(JSON.stringify(formatter(rows, columnDefs)));
    console.log(formatter(rows, columnDefs));
  }
};

let spinner;
let currentIter = 0;
let spinSpeed;
let spinTransitions;

if (isWindows()) {
  spinSpeed = 240;
  spinTransitions = [
    '   ',
    '.  ',
    '.. ',
    '...',
  ];
} else {
  spinSpeed = 80;
  spinTransitions = [
    '⠃',
    '⠉',
    '⠘',
    '⠰',
    '⠤',
    '⠆',
  ];
}
const finalTransition = spinTransitions[0];

const clearSpinner = () => {
  process.stdout.write('\x1b[?25h'); // set cursor to white...
  clearInterval(spinner);
  spinner = undefined;
};

const writeNextSpinnerTick = (final = false, _finalTransition = finalTransition) => {
  readline.moveCursor(process.stdout, -spinTransitions[currentIter].length, 0);
  currentIter++;
  if (currentIter >= spinTransitions.length) { currentIter = 0; }
  process.stdout.write(final ? _finalTransition : spinTransitions[currentIter]);
};

const startSpinner = () => {
  process.stdout.write(spinTransitions[currentIter]);
  clearSpinner();
  process.stdout.write('\x1b[?25l'); // set cursor to black...
  spinner = setInterval(() => {
    writeNextSpinnerTick();
  }, spinSpeed);
};

const endSpinner = (_finalTransition) => {
  if (!spinner) { return; }
  clearSpinner();
  writeNextSpinnerTick(true, _finalTransition);
};

const printStarting = (msg) => {
  if (spinner) { return; }
  if (msg) {
    msg = '  ' + msg + ' ';
  } else {
    msg = '';
  }
  process.stdout.write(msg);
  startSpinner();
};

const printDone = (success = true, message) => {
  if (!spinner) { return; }
  endSpinner();

  if (message) {
    message = ` ${message}`;
  }

  const logMsg = success ?
    colors.green(message || ' done!') :
    colors.red(message || ' fail!');

  console.log(logMsg);
};

// Get input from a user.
const getInput = (question, {secret = false} = {}) => {
  return new Promise((resolve, reject) => {
    read({
      prompt: question,
      silent: secret,
      replace: secret ? '*' : undefined
    }, (err, result) => {
      if (err) { reject(err); }
      resolve(result);
    });
  });
};

module.exports = {
  markdownLog,
  makeTable,
  makeRowBasedTable,
  printData,
  prettyJSONstringify,
  clearSpinner,
  startSpinner,
  endSpinner,
  printStarting,
  printDone,
  getInput,
  formatStyles,
};
