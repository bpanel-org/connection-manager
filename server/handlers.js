const { configHelpers } = require('../utils');
const {
  createClientConfig,
  testConfigOptions,
  deleteConfig,
  getConfig,
} = configHelpers;

async function getConfigHandler(req, res) {
  const { logger } = req;
  let configurations;
  try {
    configurations = await getConfig(req.params.id);
  } catch (e) {
    logger.error(e);
    if (e.code === 'ENOENT')
      return res.status(404).json({
        error: {
          message: `Config for '${req.params.id}' not found`,
          code: 404,
        },
      });
    else
      return res.status(500).json({
        error: {
          message: `There was a problem with your request.`,
          code: 500,
        },
      });
  }

  const info = {
    configs: configurations.data,
  };

  if (req.query.health) {
    try {
      logger.info(`Checking status of client "${req.params.id}"...`);
      const [err, clientErrors] = await testConfigOptions(configurations);
      if (!err) info.healthy = true;
      else {
        info.failed = clientErrors.failed;
        info.healthy = false;
      }
    } catch (e) {
      return res.status(500).send(e);
    }
  }

  // scrub apiKeys and tokens
  for (let key in configurations.data) {
    if (key.includes('api') || key.includes('token'))
      configurations.data[key] = undefined;
  }

  res.status(200).json(info);
}

function addConfigHandler(req, res) {
  const { clients } = req;
  const id = req.params.id;

  if (clients.get(id))
    return res
      .status(409)
      .send({ message: `A client with the id '${id}' already exists` });

  return updateOrAdd(req, res);
}

function updateConfigHandler(req, res) {
  return updateOrAdd(req, res);
}

function deleteConfigHandler(req, res) {
  const error = deleteConfig(req.params.id);
  if (!error) return res.status(200).json({ success: true });
  else if (error.code === 'ENOENT')
    return res.status(404).json({
      error: { message: `Config for '${req.params.id}' not found` },
    });
  else throw error;
}

async function updateOrAdd(req, res) {
  const { logger } = req;
  const id = req.params.id;
  try {
    const { options, force = false } = req.body;

    // coercing force to a boolean
    let forceBool = force;
    if (forceBool === 'true' || forceBool === true) forceBool = true;
    else if (forceBool === 'false' || forceBool === false) forceBool = false;
    else logger.warn('Expected either "true" or "false" for the force option');

    const config = await createClientConfig(id, options, forceBool);
    return res.status(200).send({
      configs: config.options,
    });
  } catch (error) {
    logger.error('Problem creating config: ', error.message);
    return res
      .status(400)
      .send({ error: { message: error.message, ...error } });
  }
}

module.exports = {
  getConfigHandler,
  addConfigHandler,
  updateConfigHandler,
  deleteConfigHandler,
};
