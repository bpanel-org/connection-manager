import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { widgetCreator, Header, Text, TabMenu } from '@bpanel/bpanel-ui';

import { TabHeader, AddNew, ConfigForm } from '../components';
import { getClientsArray } from '../selectors';
import {
  addNewClient,
  hydrateClients,
  checkClientHealth,
  getClientConfigs,
} from '../actions';

class ConnectionManager extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentFormIndex: 0,
      newConnection: undefined,
    };
  }

  static get propTypes() {
    return {
      clients: PropTypes.array,
      currentClient: PropTypes.shape({
        id: PropTypes.string,
        chain: PropTypes.string,
        services: PropTypes.object,
      }),
      hydrateClients: PropTypes.func,
      checkClientHealth: PropTypes.func,
      getClientConfigs: PropTypes.func,
      addNewClient: PropTypes.func,
    };
  }

  async componentDidMount() {
    const { clients, hydrateClients } = this.props;
    await hydrateClients();
    clients.forEach(({ id }) => this.updateClientInfo(id));
  }

  updateClientInfo(id) {
    const {
      clients,
      getClientConfigs,
      checkClientHealth,
      addNewClient,
    } = this.props;
    const index = clients.findIndex(client => client.id === id);

    // client exists so just need to refresh
    if (index > -1) {
      getClientConfigs(id);
      checkClientHealth(id);
    } else {
      addNewClient(id);
      this.setState({ newConnection: id });
    }
  }

  static getDerivedStateFromProps(props, state) {
    if (state.newConnection) {
      // set index of config with given id
      const index = props.clients.findIndex(
        client => client.id === state.newConnection
      );
      if (index > -1)
        return {
          currentFormIndex: index,
          newConnection: undefined,
        };
      return state;
    }
    return state;
  }

  async setCurrentForm(index = 0) {
    const { clients, getClientConfigs } = this.props;
    this.setState({ currentFormIndex: index });
    if (clients[index]) {
      const { id } = clients[index];
      await getClientConfigs(id);
    }
  }

  render() {
    const { clients = [] } = this.props;
    const tabs = clients.map(client => ({
      header: <TabHeader id={client.id} healthy={client.healthy} />,
      body: (
        <ConfigForm
          configs={client.configs}
          id={client.id}
          type="update"
          updateClientInfo={id => this.updateClientInfo(id)}
        />
      ),
    }));
    tabs.push({
      header: <TabHeader id="Add New" />,
      body: (
        <AddNew
          updateClientInfo={id => this.updateClientInfo(id)}
          onAddNew={id => this.onAddNew(id)}
        />
      ),
    });
    return (
      <div>
        <Header type="h4">Manage your Connections</Header>
        <Text type="p">
          Update, add, and delete the configurations for your available node
          connections here
        </Text>
        <TabMenu
          tabs={tabs}
          orientation={'vertical'}
          navColCount={2}
          selectedIndex={this.state.currentFormIndex}
          onTabClick={index => this.setCurrentForm(index)}
        />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  clients: getClientsArray(state),
  currentClient: state.clients.currentClient,
});

const mapDispatchToProps = dispatch => {
  return {
    addNewClient: id => {
      dispatch(addNewClient(id));
    },
    hydrateClients: () => {
      dispatch(hydrateClients());
    },
    checkClientHealth: id => {
      dispatch(checkClientHealth(id));
    },
    getClientConfigs: id => {
      dispatch(getClientConfigs(id));
    },
  };
};

const ConnectionContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ConnectionManager);
export default widgetCreator(ConnectionContainer);
