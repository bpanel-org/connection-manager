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
    const info = await client.getClientInfo(id, true);
    dispatch(setNewClient(id, info));
    // dispatch(getClientConfigs(id));
  };
}

export function getClientConfigs(id) {
  return async dispatch => {
    const client = getClient();
    const { configs } = await client.getClientInfo(id);
    dispatch(setClientConfigs(id, configs));
  };
}

export function checkClientHealth(id) {
  return async dispatch => {
    const client = getClient();
    const { healthy } = await client.getClientInfo(id, true);
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
