import { getClient } from '@bpanel/bpanel-utils';
import { SET_CLIENTS } from './constants';

function setClients(clients) {
  return {
    type: SET_CLIENTS,
    payload: clients,
  };
}

function setClientHealth(id, healthy) {
  return {
    type: 'UPDATE_CLIENT',
    payload: {
      id,
      info: {
        healthy,
      },
    },
  };
}

function setClientConfigs(id, configs) {
  return {
    type: 'UPDATE_CLIENT',
    payload: {
      id,
      info: {
        configs,
      },
    },
  };
}

export function getClientConfigs(id) {
  return async dispatch => {
    const client = getClient();
    const { configs } = await client.getInfo(id);
    dispatch(setClientConfigs(id, configs));
  };
}

export function checkClientHealth(id) {
  return async dispatch => {
    const client = getClient();
    const { healthy } = await client.getInfo(id, true);
    dispatch(setClientHealth(id, healthy));
  };
}

export function hydrateClients() {
  return async dispatch => {
    const client = getClient();
    const clients = await client.getClients();
    dispatch(setClients(clients));
  };
}
