/**
 * CommonJS wrapper for ESM-only modules
 * This allows us to use mem-fs, mem-fs-editor, @yeoman/conflicter, and update-notifier v7+ from CommonJS code without downgrading
 */

let memFs = null;
let memFsEditor = null;
let conflicter = null;
let updateNotifier = null;

/**
 * Lazy-load mem-fs using dynamic import
 * @returns {Promise<Object>} The mem-fs module
 */
async function getMemFs() {
  if (!memFs) {
    memFs = await import('mem-fs');
  }
  return memFs;
}

/**
 * Lazy-load mem-fs-editor using dynamic import
 * @returns {Promise<Object>} The mem-fs-editor module
 */
async function getMemFsEditor() {
  if (!memFsEditor) {
    memFsEditor = await import('mem-fs-editor');
  }
  return memFsEditor;
}

/**
 * Lazy-load @yeoman/conflicter using dynamic import
 * @returns {Promise<Object>} The @yeoman/conflicter module
 */
async function getConflicter() {
  if (!conflicter) {
    conflicter = await import('@yeoman/conflicter');
  }
  return conflicter;
}

/**
 * Lazy-load update-notifier using dynamic import
 * @returns {Promise<Object>} The update-notifier module
 */
async function getUpdateNotifier() {
  if (!updateNotifier) {
    updateNotifier = await import('update-notifier');
  }
  return updateNotifier;
}

/**
 * Create an in-memory file editor that writes nothing until it is committed
 * @returns {Promise<Object>} mem-fs-editor instance
 */
async function createFileEditor() {
  const [memFsModule, memFsEditorModule] = await Promise.all([
    getMemFs(),
    getMemFsEditor(),
  ]);
  return memFsEditorModule.create(memFsModule.create());
}

/**
 * Create a transform that asks before it overwrites a changed file
 * @param {Object} adapter - Provides prompt, separator, queue, and log
 * @returns {Promise<Object>} File transform stream
 */
async function createConflicterTransform(adapter) {
  const conflicterModule = await getConflicter();
  return conflicterModule.createConflicterTransform(adapter);
}

/**
 * Create a transform that skips files listed in a .yo-resolve file
 * @returns {Promise<Object>} File transform stream
 */
async function createYoResolveTransform() {
  const conflicterModule = await getConflicter();
  return conflicterModule.createYoResolveTransform();
}

/**
 * Create an update notifier (async version of require('update-notifier'))
 * @param {Object} options - Update notifier options (pkg, updateCheckInterval, etc.)
 * @returns {Promise<Object>} Update notifier instance
 */
async function createUpdateNotifier(options) {
  const updateNotifierModule = await getUpdateNotifier();
  return updateNotifierModule.default(options);
}

module.exports = {
  createConflicterTransform,
  createFileEditor,
  createUpdateNotifier,
  createYoResolveTransform,
};
