import React from 'react';
import PropTypes from 'prop-types';
import { Header, Text } from '@bpanel/bpanel-ui';

import { chains } from '&bpanel/pkg';
import { ConfigForm } from '.';

const formFields = [
  {
    label: 'id',
    placeholder: 'Enter name for your node here (case sensitive)',
  },
  {
    label: 'host',
    placeholder: 'e.g. 127.0.0.1',
    description:
      'Use `port` and `protocol` options or `url` option for additional specificity',
  },
  {
    label: 'network',
    placeholder: 'What network is your node connected to?',
    type: 'dropdown',
    options: ['main', 'testnet', 'simnet', 'regtest'],
  },
  {
    label: 'chain',
    placeholder: 'What blockchain is your node connected to?',
    type: 'dropdown',
    options: chains,
  },
  {
    label: 'api-key',
    placeholder: 'Enter api key for your node here',
  },
  {
    label: 'wallet-api-key',
    placeholder: 'Leave blank if same as node key above',
  },
];

export default function AddNew({ updateClientInfo }) {
  return (
    <div>
      <Header type="h5">Add a new connection configuration</Header>
      <Text type="p">Enter information below.</Text>
      <Text type="p">
        {`For configuration options specific to a wallet node, preface the option
          with 'wallet-'. Note that where applicable network defaults will be
          used, e.g. port, '8333' for Bitcoin mainnet`}
      </Text>
      <ConfigForm
        formFields={formFields}
        type="new"
        updateClientInfo={updateClientInfo}
      />
    </div>
  );
}

AddNew.propTypes = {
  updateClientInfo: PropTypes.func.isRequired,
};
