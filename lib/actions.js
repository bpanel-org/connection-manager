import assert from 'bsert';
import { getClient } from '@bpanel/bpanel-utils';

import { ADD_CLIENT, SET_CLIENTS, UPDATE_CLIENT } from './constants';

function setClients(clients) {
  return {
    type: SET_CLIENTS,
    payload: clients,
  };
}

function setClientHealth(id, healthy) {
  return {
    type: UPDATE_CLIENT,
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
    type: UPDATE_CLIENT,
    payload: {
      id,
      info: {
        configs,
      },
    },
  };
}

function setNewClient(id, info) {
  return {
    type: ADD_CLIENT,
    payload: {
      id,
      info,
    },
  };
}

export function addNewClient(id) {
  return async dispatch => {
    assert(
      typeof id === 'string',
      'Must pass an id of type string to add new client'
    );
    const client = getClient();
    const connections = await client.getClients();
    dispatch(setNewClient(id, connections[id]));
    await dispatch(getClientConfigs(id));
    dispatch(checkClientHealth(id));
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
