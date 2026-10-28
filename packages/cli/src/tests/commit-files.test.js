const fs = require('fs-extra');
const os = require('os');
const path = require('path');

const { expect } = require('chai');
const prettier = require('gulp-prettier');

const { commitFiles } = require('../generators/commit-files');
const { createFileEditor } = require('../utils/esm-wrapper');

describe('commitFiles', () => {
  let tmpDir;
  let editor;

  const tmpPath = (fileName) => path.join(tmpDir, fileName);

  const readTmpFile = (fileName) => fs.readFileSync(tmpPath(fileName), 'utf8');

  // Returns a fake prompt that answers the overwrite question for each file
  // with the action given for it
  const answerWith = (actionsByFile) => async (questions) => {
    const fileName = questions[0].message.match(/^Overwrite (.+)\?$/)[1];
    return { action: actionsByFile[path.basename(fileName)] };
  };

  const neverAsk = async () => {
    throw new Error('Should not have prompted');
  };

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zapier-commit-files-'));
    editor = await createFileEditor();
  });

  afterEach(() => {
    fs.removeSync(tmpDir);
  });

  it('should create new files without asking', async () => {
    editor.write(tmpPath('src/index.js'), 'new');

    await commitFiles(editor, { prompt: neverAsk });

    expect(readTmpFile('src/index.js')).to.equal('new');
  });

  it('should not ask about files that already have the same contents', async () => {
    fs.writeFileSync(tmpPath('index.js'), 'same');
    editor.write(tmpPath('index.js'), 'same');

    await commitFiles(editor, { prompt: neverAsk });

    expect(readTmpFile('index.js')).to.equal('same');
  });

  it('should overwrite or keep each changed file as the user answers', async () => {
    fs.writeFileSync(tmpPath('a.js'), 'old a');
    fs.writeFileSync(tmpPath('b.js'), 'old b');
    editor.write(tmpPath('a.js'), 'new a');
    editor.write(tmpPath('b.js'), 'new b');

    await commitFiles(editor, {
      prompt: answerWith({ 'a.js': 'write', 'b.js': 'skip' }),
    });

    expect(readTmpFile('a.js')).to.equal('new a');
    expect(readTmpFile('b.js')).to.equal('old b');
  });

  it('should ask about one file at a time', async () => {
    fs.writeFileSync(tmpPath('a.js'), 'old a');
    fs.writeFileSync(tmpPath('b.js'), 'old b');
    editor.write(tmpPath('a.js'), 'new a');
    editor.write(tmpPath('b.js'), 'new b');

    let openPrompts = 0;
    let mostOpenPrompts = 0;
    const slowPrompt = async () => {
      openPrompts += 1;
      mostOpenPrompts = Math.max(mostOpenPrompts, openPrompts);
      await new Promise((resolve) => setTimeout(resolve, 20));
      openPrompts -= 1;
      return { action: 'write' };
    };

    await commitFiles(editor, { prompt: slowPrompt });

    expect(mostOpenPrompts).to.equal(1);
    expect(readTmpFile('a.js')).to.equal('new a');
    expect(readTmpFile('b.js')).to.equal('new b');
  });

  it('should stop with an error when the user aborts', async () => {
    fs.writeFileSync(tmpPath('a.js'), 'old a');
    editor.write(tmpPath('a.js'), 'new a');

    let error;
    try {
      await commitFiles(editor, { prompt: answerWith({ 'a.js': 'abort' }) });
    } catch (err) {
      error = err;
    }

    expect(error.message).to.equal('Process aborted by user');
    expect(readTmpFile('a.js')).to.equal('old a');
  });

  it('should run the given transforms before it checks for conflicts', async () => {
    fs.writeFileSync(tmpPath('index.js'), 'const a = 1;\n');
    editor.write(tmpPath('index.js'), 'const a=1');

    await commitFiles(editor, { transforms: [prettier()], prompt: neverAsk });

    expect(readTmpFile('index.js')).to.equal('const a = 1;\n');
  });
});
