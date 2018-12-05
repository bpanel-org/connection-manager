const {
  addConfigHandler,
  deleteConfigHandler,
  updateConfigHandler,
  queryHealthHandler,
} = require('./handlers');

const base = '/clients/:id';

exports.beforeCoreMiddleware = [
  {
    method: 'USE',
    path: base,
    handler: queryHealthHandler,
  },
];

exports.afterCoreMiddleware = [
  {
    method: 'POST',
    path: base,
    handler: addConfigHandler,
  },
  {
    method: 'PUT',
    path: base,
    handler: updateConfigHandler,
  },
  {
    method: 'DELETE',
    path: base,
    handler: deleteConfigHandler,
  },
];
