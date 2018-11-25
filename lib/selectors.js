import { createSelector } from 'reselect';

const getClients = state => state.clients.clients;

export const getClientsArray = createSelector(
  getClients,
  clients => Object.keys(clients).map(id => ({ id, ...clients[id] }))
);
