// Entry point for your plugin
// This should expose your plugin's modules/* START IMPORTS */
import modules from './plugins';
import connectionWidget from './containers/ConnectionManager';

/* END IMPORTS */

const plugins = Object.values(modules);
/* START EXPORTS */

export const metadata = {
  name: '@bpanel/connection-manager',
  displayName: 'Connection Manager',
  author: 'bpanel-devs',
  description:
    'Manage different node connections that your bPanel server can communicate with.',
  version: require('../package.json').version,
};

export const pluginConfig = { plugins };

function decorateSettings(SettingsDashboard, { React, PropTypes }) {
  return class extends React.PureComponent {
    constructor(props) {
      super(props);
      this.ConnectionManager = connectionWidget();
    }

    static get displayName() {
      const wrappedName =
        SettingsDashboard.displayName || SettingsDashboard.name || 'Component';
      return `ConnectionManager-${wrappedName}`;
    }

    static get propTypes() {
      return {
        settingsTabs: PropTypes.arrayOf(
          PropTypes.shape({
            header: PropTypes.string,
            body: PropTypes.function,
          })
        ),
      };
    }

    render() {
      const { settingsTabs = [] } = this.props;
      settingsTabs.unshift({
        header: 'Connections',
        body: <this.ConnectionManager />,
      });
      return <SettingsDashboard {...this.props} settingsTabs={settingsTabs} />;
    }
  };
}

export const decoratePlugin = { '@bpanel/settings': decorateSettings };

/* END EXPORTS */
