import assert from 'bsert';
import { getClient } from '@bpanel/bpanel-utils';

import {
  ADD_CLIENT,
  REMOVE_CLIENT,
  SET_CLIENTS,
  UPDATE_CLIENT,
  SET_CURRENT_CLIENT,
} from './constants';

function setClients(clients) {
  return {
    type: SET_CLIENTS,
    payload: clients,
  };
}

function setClientInfo(id, info) {
  return {
    type: UPDATE_CLIENT,
    payload: {
      id,
      info,
    },
  };
}

function setCurrentClient(id, info) {
  return {
    type: SET_CURRENT_CLIENT,
    payload: info,
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

function removeClientConfig(id) {
  return {
    type: REMOVE_CLIENT,
    payload: { id },
  };
}

export function deleteConfig(id) {
  return async dispatch => {
    assert(
      typeof id === 'string',
      'Must pass an id of type string to delete client'
    );
    const client = getClient();
    await client.del(`/clients/${id}`);
    dispatch(removeClientConfig(id));
  };
}

export function addNewClient(id) {
  return async (dispatch, getState) => {
    assert(
      typeof id === 'string',
      'Must pass an id of type string to add new client'
    );
    const client = getClient();
    const info = await client.getClientInfo(id, true);
    dispatch(setNewClient(id, info));

    // if there is no currentClient
    // then we want to set it with our newly added client info
    const { currentClient } = getState().clients;
    if (!currentClient.id) dispatch(setCurrentClient(id, info));
  };
}

export function getClientInfo(id, checkHealth = true) {
  return async dispatch => {
    const client = getClient();
    const info = await client.getClientInfo(id, checkHealth);
    dispatch(setClientInfo(id, info));
  };
}

export function hydrateClients() {
  return async dispatch => {
    const client = getClient();
    const clients = await client.getClients();
    dispatch(setClients(clients));
  };
}
