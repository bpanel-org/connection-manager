import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { widgetCreator, Header, Text, TabMenu } from '@bpanel/bpanel-ui';

import { TabHeader, AddNew, ConfigForm } from '../components';
import { getClientsArray } from '../selectors';
import {
  hydrateClients,
  checkClientHealth,
  getClientConfigs,
} from '../actions';

class ConnectionManager extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentFormIndex: 0,
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
    };
  }

  async componentDidMount() {
    const { clients, hydrateClients } = this.props;
    await hydrateClients();
    clients.forEach(({ id }) => this.updateClientInfo(id));
  }

  updateClientInfo(id) {
    this.props.checkClientHealth(id);
    this.props.getClientConfigs(id);
  }

  async setCurrentForm(index) {
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
      body: <AddNew updateClientInfo={id => this.updateClientInfo(id)} />,
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
