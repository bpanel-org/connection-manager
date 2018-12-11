import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { widgetCreator, Header, Text, TabMenu } from '@bpanel/bpanel-ui';

import { TabHeader, AddNew, ConfigForm } from '../components';
import { getClientsArray } from '../selectors';
import {
  addNewClient,
  hydrateClients,
  getClientInfo,
  deleteConfig,
} from '../actions';

class ConnectionManager extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentFormIndex: 0,
      newConnection: undefined,
      deletedConnection: undefined,
      hydrating: true,
    };
    props.hydrateClients();
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
      getClientInfo: PropTypes.func,
      addNewClient: PropTypes.func,
      deleteConfig: PropTypes.func,
    };
  }

  // async componentDidMount() {
  //   const { clients } = this.props;
  //   clients.forEach(({ id }) => this.updateClientInfo(id));
  // }
  componentDidUpdate() {
    const { clients } = this.props;
    if (clients && this.state.hydrating) {
      clients.forEach(({ id }) => this.updateClientInfo(id));
      this.setState({ hydrating: false });
    }
  }

  updateClientInfo(id) {
    const { clients, getClientInfo, addNewClient } = this.props;
    const index = clients.findIndex(client => client.id === id);

    // client exists so just need to refresh
    if (index > -1) {
      getClientInfo(id);
    } else {
      addNewClient(id);
      this.setState({ newConnection: id });
    }
  }

  async onDeleteConfig(id) {
    this.setState({ deletedConnection: id });
    await this.props.deleteConfig(id);
  }

  static getDerivedStateFromProps(props, state) {
    // need to do this because the state gets updated
    // asyncronously. Need to allow component to respond
    // when there's a change in props (i.e. the clients)
    if (state.newConnection) {
      // set index of config with given id
      const index = props.clients.findIndex(
        client => client.id === state.newConnection
      );
      if (index > -1)
        return {
          ...state,
          currentFormIndex: index,
          newConnection: undefined,
        };
    } else if (state.deletedConnection) {
      // confirm item is gone
      const index = props.clients.findIndex(
        client => client.id === state.deletedConnection
      );
      if (index === -1)
        return {
          ...state,
          currentFormIndex: props.clients.length,
          deletedConnection: undefined,
        };
    }
    return state;
  }

  async setCurrentForm(index = 0) {
    const { clients, getClientInfo } = this.props;
    this.setState({ currentFormIndex: index });
    if (clients[index]) {
      const { id } = clients[index];
      await getClientInfo(id);
    }
  }

  render() {
    const { clients = [] } = this.props;
    const tabs = clients.map(client => ({
      header: <TabHeader id={client.id} healthy={client.healthy} />,
      body: (
        <ConfigForm
          configs={client.configs}
          errors={client.errors}
          id={client.id}
          type="update"
          updateClientInfo={id => this.updateClientInfo(id)}
          deleteConfig={id => this.onDeleteConfig(id)}
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
    getClientInfo: id => {
      dispatch(getClientInfo(id));
    },
    deleteConfig: id => {
      dispatch(deleteConfig(id));
    },
  };
};

const ConnectionContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ConnectionManager);
export default widgetCreator(ConnectionContainer);
