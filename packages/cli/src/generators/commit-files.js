const colors = require('colors/safe');
const inquirer = require('inquirer');

const {
  createConflicterTransform,
  createYoResolveTransform,
} = require('../utils/esm-wrapper');

const STATUS_COLORS = {
  conflict: colors.red,
  create: colors.green,
  force: colors.yellow,
  identical: colors.cyan,
  info: colors.gray,
  skip: colors.yellow,
};

const DIFF_COLORS = {
  added: (text) => colors.bgGreen(colors.black(text)),
  removed: colors.bgRed,
};

// Pad every status to the width of the longest one, 'identical', so the file
// paths line up.
const STATUS_WIDTH = 'identical'.length;

const createLog = () => {
  const log = {
    writeln: (message = '') => console.log(message),
    // Prints the lines of a diff, where each part names its color
    colored: (parts) => {
      const text = parts
        .map(({ color, message }) =>
          color ? DIFF_COLORS[color](message) : message,
        )
        .join('');
      process.stdout.write(text);
    },
  };

  Object.entries(STATUS_COLORS).forEach(([status, color]) => {
    log[status] = (message) => {
      console.log(`${color(status.padStart(STATUS_WIDTH))} ${message}`);
    };
  });

  return log;
};

/**
 * Creates the adapter that @yeoman/conflicter uses to talk to the user.
 * @param {Function} prompt an `inquirer.prompt` compatible function
 */
const createAdapter = (prompt) => {
  let lastTask = Promise.resolve();

  const adapter = {
    log: createLog(),
    prompt,
    separator: () => new inquirer.Separator(),
    // The conflicter checks files concurrently. Ask about one file at a time.
    queue: (task) => {
      const result = lastTask.then(() => task(adapter));
      // Keep the queue going after a failed task. The caller still gets the
      // error from `result`.
      lastTask = result.catch(() => {});
      return result;
    },
  };

  return adapter;
};

/**
 * Writes the editor's pending files to disk. For each file that already exists
 * with different contents, the user picks overwrite, skip, diff, and so on.
 * @param {object} editor a mem-fs-editor instance
 * @param {object} [options]
 * @param {Array} [options.transforms] file transforms to run before the
 * conflict check, such as a formatter
 * @param {Function} [options.prompt] an `inquirer.prompt` compatible function
 */
const commitFiles = async (
  editor,
  { transforms = [], prompt = inquirer.prompt } = {},
) => {
  const adapter = createAdapter(prompt);
  await editor.commit(
    ...transforms,
    await createYoResolveTransform(),
    await createConflicterTransform(adapter),
  );
};

module.exports = {
  commitFiles,
};
