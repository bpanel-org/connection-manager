import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Header, Text, Button } from '@bpanel/bpanel-ui';
import { getClient } from '@bpanel/bpanel-utils';
import { isEqual } from 'lodash';

import { FormField, JSONInput } from '.';

const initialState = {
  configs: { apiKey: '' },
  baseConfigs: {},
  error: null,
  customConfigs: {
    text: '',
    valid: true,
    data: undefined,
  },
};

export default class ConfigForm extends PureComponent {
  constructor(props) {
    super(props);
    this.state = initialState;
  }

  static get propTypes() {
    return {
      id: PropTypes.string,
      configs: PropTypes.object,
      type: PropTypes.oneOf(['update', 'new', 'delete']),
      updateClientInfo: PropTypes.func,
    };
  }

  updateValue(name, value) {
    this.setState({
      configs: {
        ...this.state.configs,
        [name]: value,
      },
      error: null,
    });
  }

  static getDerivedStateFromProps(props, state) {
    // if we have configs passed through and
    // our baseConfigs haven't been populated yet
    // OR the configs from the props don't match the baseConfigs
    // (which means the configs were updated via the store)
    // then update the state with the new props
    if (
      (props.configs && !Object.keys(state.baseConfigs).length) ||
      !isEqual(props.configs, state.baseConfigs)
    )
      return {
        configs: { ...props.configs, apiKey: '' },
        baseConfigs: { ...props.configs },
      };
    return null;
  }

  resetForm() {
    const { error, customConfigs } = initialState;
    this.setState({ error, customConfigs });
  }

  validateTextArea(e) {
    try {
      const data = JSON.parse(e.target.value);
      this.setState({
        customConfigs: {
          valid: true,
          text: e.target.value,
          data,
        },
      });
    } catch (error) {
      const valid = e.target.value.length === 0 || false;
      this.setState({
        customConfigs: {
          valid,
          data: undefined,
          text: undefined,
        },
      });
    }
  }

  async onSubmit(force = false) {
    const { id, type, updateClientInfo } = this.props;
    const client = getClient();
    const { configs, customConfigs } = this.state;

    // apiKey needs to default to empty string to keep React happy
    // but clients api will read empty string as an incorrect apiKey
    // so need to set to undefined here if not updating
    let apiKey = undefined;
    if (type === 'update') {
      try {
        if (configs.apiKey && configs.apiKey.length) apiKey = configs.apiKey;

        const options = { ...configs, apiKey, ...customConfigs.data };
        const result = await client.put(`/clients/${id}`, {
          options,
          force,
        });

        // connection failed
        if (result.failed) {
          this.setState({ error: result });
        } else {
          alert(`Successfully updated configs for ${id}`);

          // give some time for the server to update
          // and then reset the form information
          setTimeout(async () => {
            await updateClientInfo(id);
            this.resetForm();
          }, 1000);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('There was a problem with your request:', e);
      }
    }
  }

  render() {
    const { id } = this.props;
    const { error, customConfigs, configs } = this.state;
    return (
      <div>
        <Header type="h4">{id}</Header>
        <div className="form-fields">
          {Object.keys(configs)
            .sort((a, b) => {
              // keep id first and apiKey field last
              // otherwise, normal sort
              if (a === 'id') return -1;
              if (b === 'id') return 1;
              if (a === 'apiKey') return 1;
              if (b === 'apiKey') return -1;
              if (a < b) return -1;
              if (a > b) return 1;
              return 0;
            })
            .map((key, index) => (
              <FormField
                label={key}
                value={configs[key]}
                placeholder={`Enter value for ${key.replace('-', ' ')}`}
                key={index}
                name={key}
                onChange={e => this.updateValue(key, e.target.value)}
              />
            ))}
          <JSONInput
            valid={customConfigs.valid}
            validator={e => this.validateTextArea(e)}
            text={customConfigs.text}
          />
        </div>
        <Button type="action" onClick={() => this.onSubmit()}>
          Submit
        </Button>
        {error && (
          <div>
            <Header type="h4">The following connections failed:</Header>
            {error.failed.map(failed => (
              <Text type="p" key={failed}>
                {failed}: {error[failed].message}
              </Text>
            ))}
            <Text type="p">Would you like to use these options anyway?</Text>
            <Button onClick={() => this.resetForm()}>Cancel</Button>
            <Button type="action" onClick={() => this.onSubmit(true)}>
              Yes, use these options
            </Button>
          </div>
        )}
      </div>
    );
  }
}
