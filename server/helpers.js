const fs = require('bfile');
const { resolve, join } = require('path');
const assert = require('bsert');
const Config = require('bcfg');

let logger;

/*
 * Simple utility to set context for the logger
 * Works with blgr context
 * @param {Object} req - req object from express
 * @returns {Logger} blgr object
 */
function getLogger(req) {
  if (!logger && req.logger) return req.logger.context('connection-manager');
  return logger;
}

/*
 * Load up a bcfg object for a given module and set of options
 * @param {string} name - module name
 * @param {object} [options] - optional options object to inject into config
 * @returns {Config} - returns a bcfg object
 */
function loadConfig(name, options = {}) {
  assert(typeof name === 'string', 'Must pass a name to load config');
  const config = new Config(name);

  // load any custom configs being passed in
  config.inject(options);

  config.load({
    env: true,
  });

  if (name === 'bpanel') {
    config.load({
      argv: true,
    });
  }

  return config;
}

/*
 * Given a set of options as a base, return a bcfg config object
 * @param {Object|Config} options
 * @returns {Config}
 */
function getConfigFromOptions(_options) {
  let options = _options;
  if (!(options instanceof Config)) options = loadConfig(options.id, options);
  assert(options.str('id'), 'must pass an id to test config options');

  // making a copy from options and data properties
  // to avoid any mutations
  return loadConfig(options.str('id'), {
    ...options.options,
    ...options.data,
  });
}

/*
 * Retrieve a config from clients directory
 * @param {string} id - id of client to retrieve
 * @returns {bcfg.Config} - bcfg object of config
 */
function getConfig(id) {
  assert(typeof id === 'string', 'Client config must have an id');

  const appConfig = loadConfig('bpanel');
  const clientsDir = appConfig.str('clients-dir', 'clients');

  const clientsPath = resolve(appConfig.prefix, clientsDir);
  const config = loadConfig(id, { id, prefix: clientsPath });

  const path = resolve(clientsPath, `${id}.conf`);
  if (!fs.existsSync(path)) {
    const error = new Error(`File ${id}.conf not found`);
    error.code = 'ENOENT';
    throw error;
  }

  config.open(`${id}.conf`);
  return config;
}

/*
 * create client config
 * Note: This will actually create the file in your bpanel prefix location
 * @param {string} id - id for the client
 * @param {Object} options object for a bcoin/hsd client
 * @param {Logger} logger - blgr instance
 * @returns {bcfg.Config}
 */
async function createClientConfig(id, options = {}, logger) {
  assert(typeof id === 'string', 'Must pass an id as first paramater');
  assert(logger, 'Expected logger to be passed');
  let clientConfig = options;

  const appConfig = loadConfig('bpanel', options);
  const clientsDir = appConfig.str('clients-dir', 'clients');

  clientConfig = getConfigFromOptions({ id, ...options });

  // get full path to client configs relative to the project
  // prefix which defaults to `~/.bpanel`
  const clientsPath = resolve(appConfig.prefix, clientsDir);

  let configTxt = '';
  for (let key in clientConfig.options) {
    const configKey = key
      .replace('-', '')
      .replace('_', '')
      .toLowerCase();
    const text = `${configKey}: ${clientConfig.options[key]}\n`;
    configTxt = configTxt.concat(text);
  }
  if (!fs.existsSync(clientsPath)) {
    logger.warning(
      'Could not find requested client directory at %s. Creating new one...',
      clientsPath
    );
    fs.mkdirpSync(clientsPath);
  }

  const configPath = `${clientsPath}/${clientConfig.str('id')}.conf`;
  logger.debug('Adding config to path: %s', configPath);
  fs.writeFileSync(configPath, configTxt);
  return clientConfig;
}

/*
 * Simple utility that deletes a config
 * Does not throw errors if client is not found
 * NOTE: This does not confirm. Deletion is final!
 * @param {string} id
 * @returns {bool} - returns true when operation completed successfully
 */
function deleteConfig(id, logger) {
  assert(typeof id === 'string', 'Expected to get id of config to delete');
  try {
    const config = getConfig(id);
    const path = resolve(config.prefix, `${config.str('id')}.conf`);
    fs.unlinkSync(path);
    return null;
  } catch (e) {
    logger.error('Problem removing config:', e);
    return e;
  }
}

module.exports = {
  loadConfig,
  createClientConfig,
  deleteConfig,
  getConfig,
  getLogger,
};
