const assert = require('bsert');
const helpers = require('./helpers');
const { createClientConfig, deleteConfig, getLogger } = helpers;

// middleware to add health query to all
// POST and PUT requests for a specific client
function queryHealthHandler(req, res, next) {
  if (req.method === 'PUT' || req.method === 'POST') req.query.health = true;
  next();
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
  const logger = getLogger(req);
  const error = deleteConfig(req.params.id, logger);
  if (!error) return res.status(200).json({ success: true });
  else if (error.code === 'ENOENT')
    return res.status(404).json({
      error: { message: `Config for '${req.params.id}' not found` },
    });
  else throw error;
}

async function updateOrAdd(req, res) {
  const logger = getLogger(req);
  const { clientHealth, params } = req;
  const { id } = params;
  try {
    const { options, force = false } = req.body;

    // coercing force to a boolean
    let forceBool = force;
    if (forceBool === 'true' || forceBool === true) forceBool = true;
    else if (forceBool === 'false' || forceBool === false) forceBool = false;
    else
      logger.warning('Expected either "true" or "false" for the force option');

    if (!clientHealth)
      logger.debug(`Didn't receive a client health property on the request object. \
It is recommended to test the config before adding or updating it`);

    const { healthy, errors } = clientHealth;
    assert(typeof force === 'boolean', 'The force argument must be a bool.');
    if (!healthy && forceBool) {
      logger.warning(
        'Configs for client "%s" not healthy:',
        id,
        errors.message
      );
      logger.warning('Creating config file anyway...');
    } else if (!healthy) {
      return res.status(200).send({ message: errors.message, ...errors });
    }

    const config = await createClientConfig(id, options, logger);
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
  addConfigHandler,
  deleteConfigHandler,
  updateConfigHandler,
  queryHealthHandler,
};
