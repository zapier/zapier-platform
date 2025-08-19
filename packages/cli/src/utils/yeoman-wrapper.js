/**
 * CommonJS wrapper for yeoman ESM modules
 * This allows us to use yeoman-environment v4+ and yeoman-generator v7+ from CommonJS code without downgrading
 */

let yeomanEnvironment = null;
let yeomanGenerator = null;

/**
 * Lazy-load yeoman-environment using dynamic import
 * @returns {Promise<Object>} The yeoman-environment module
 */
async function getYeomanEnvironment() {
  if (!yeomanEnvironment) {
    yeomanEnvironment = await import('yeoman-environment');
  }
  return yeomanEnvironment;
}

/**
 * Lazy-load yeoman-generator using dynamic import
 * @returns {Promise<Object>} The yeoman-generator module
 */
async function getYeomanGenerator() {
  if (!yeomanGenerator) {
    yeomanGenerator = await import('yeoman-generator');
  }
  return yeomanGenerator;
}

/**
 * Create a yeoman environment (async version of yeoman.createEnv())
 * @param {Object} options - Environment options
 * @returns {Promise<Object>} Environment instance
 */
async function createEnv(options) {
  const yeoman = await getYeomanEnvironment();
  return yeoman.createEnv(options);
}

/**
 * Get the Generator class (async version of require('yeoman-generator'))
 * @returns {Promise<Function>} The Generator class
 */
async function getGenerator() {
  const yeomanGen = await getYeomanGenerator();
  return yeomanGen.default;
}

/**
 * Create a generator class factory that extends the yeoman Generator
 * @param {Function} generatorFactory - A function that takes Generator class and returns a class extending it
 * @returns {Promise<Function>} The generated class
 */
async function createGeneratorClass(generatorFactory) {
  const Generator = await getGenerator();
  return generatorFactory(Generator);
}

module.exports = {
  createEnv,
  getGenerator,
  createGeneratorClass,
  getYeomanEnvironment,
  getYeomanGenerator,
};
