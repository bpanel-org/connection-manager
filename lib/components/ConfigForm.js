import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Header, Text, Button } from '@bpanel/bpanel-ui';
import { getClient } from '@bpanel/bpanel-utils';
import { isEqual, cloneDeep } from 'lodash';

import { FormField, JSONInput } from '.';

const initialState = {
  configs: { apiKey: '' },
  baseConfigs: {},
  error: null,
  fields: [],
  customConfigs: {
    text: '',
    valid: true,
    data: undefined,
  },
};

// simple utility for taking configs object
// sorting it and turning it into a list
// that can be used as a form field
const getFieldsFromConfigs = configs =>
  Object.keys(configs)
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
    .map(key => ({
      label: key,
      placeholder: `Enter value for ${key.replace('-', ' ')}`,
      disabled: key === 'id', // disable editing for id for now
    }));

export default class ConfigForm extends PureComponent {
  constructor(props) {
    super(props);
    this.state = cloneDeep(initialState);
    this.fields = [];
    // need to initialize the state from formFields
    // if they were passed
    if (props.formFields) {
      const configs = props.formFields.reduce(
        (acc, curr) => ({ ...acc, [curr.label]: '' }),
        {}
      );
      this.state.configs = { ...this.state.configs, ...configs };
      this.state.fields = props.formFields;
    }
  }

  static get propTypes() {
    return {
      id: PropTypes.string,
      configs: PropTypes.object,
      updateClientInfo: PropTypes.func.isRequired,
      deleteConfig: PropTypes.func,
      type: PropTypes.string.isRequired,
      formFields: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          placeholder: PropTypes.string.isRequired,
          description: PropTypes.string,
        })
      ),
    };
  }

  updateValue(name, e) {
    let value;
    if (e.target) {
      value = e.target.value;
    } else if (e.value && typeof e.value === 'string') {
      value = e.value;
    } else {
      value = undefined;
    }

    const configs = { ...this.state.configs, [name]: value };
    this.setState({
      configs,
      error: null,
    });
  }

  static getDerivedStateFromProps(props, state) {
    // make sure to let the state update if using custom formFields
    if (props.formFields && props.formFields.length) return state;

    // if we have configs passed through and
    // our baseConfigs haven't been populated yet
    // OR the configs from the props don't match the baseConfigs
    // (which means the configs were updated via the store)
    // then update the state with the new props
    if (
      (props.configs && !Object.keys(state.baseConfigs).length) ||
      !isEqual(props.configs, state.baseConfigs)
    ) {
      const configs = { ...props.configs, ...initialState.configs };
      return {
        configs,
        fields: getFieldsFromConfigs(configs),
        baseConfigs: { ...props.configs },
      };
    }

    return null;
  }

  resetForm() {
    const { error, customConfigs } = initialState;
    const { type, formFields } = this.props;
    if (type === 'new') initialState.fields = formFields;
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

  onDeleteConfig() {
    const { id, deleteConfig } = this.props;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the connection for "${id}"?
WARNING: This action CAN NOT be undone.`
    );
    if (confirmDelete) deleteConfig(id);
  }

  async onSubmit(force = false) {
    const { id, updateClientInfo, type } = this.props;
    const client = getClient();
    const { configs, customConfigs } = this.state;

    // apiKey needs to default to empty string to keep React happy
    // but clients api will read empty string as an incorrect apiKey
    // so need to set to undefined here if not updating
    let apiKey = undefined;
    try {
      if (configs.apiKey && configs.apiKey.length) apiKey = configs.apiKey;

      const options = { ...configs, apiKey, ...customConfigs.data };

      // different endpoints for forms to update and add new config
      let result;
      if (type === 'update')
        result = await client.put(`/clients/${id}`, { options, force });
      else if (type === 'new')
        result = await client.post(`/clients/${options.id}`, {
          options,
          force,
        });
      else throw new Error(`Unknown config form type "${type}"`);

      // connection failed with specific node errors
      // these return as 200 because bcurl sanitizes out the specific
      // non-standard failure messages
      if (result.failed) {
        this.setState({ error: result });
      } else {
        alert(`Successfully updated configs for ${options.id}`);

        // Hydrate client store with new information
        // need to use options.id because a new config won't
        // have an id passed from props
        await updateClientInfo(options.id);
        this.resetForm();
      }
    } catch (e) {
      this.setState({ error: e.message });
      // eslint-disable-next-line no-console
      console.error('There was a problem with your request:', e);
    }
  }

  render() {
    const { id, type = 'update' } = this.props;
    const { error, customConfigs, configs, fields } = this.state;

    return (
      <div>
        <Header type="h4">{id}</Header>
        <div className="form-fields">
          {fields.map((field, index) => (
            <FormField
              {...field}
              value={configs[field.label]}
              key={index}
              name={field.label}
              onChange={e => this.updateValue(field.label, e)}
            />
          ))}
          <JSONInput
            valid={customConfigs.valid}
            validator={e => this.validateTextArea(e)}
            text={customConfigs.text}
          />
          <div
            className="row mt-sm-3 justify-content-end"
            style={{ width: '100%' }}
          >
            <Button
              type="action"
              className="col-lg-3 order-last"
              onClick={() => this.onSubmit()}
            >
              Submit
            </Button>
            {type === 'update' && (
              <Button
                className="col-lg-3 mr-lg-3"
                onClick={() => this.onDeleteConfig()}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
        {error && error.failed && (
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
        {error && !error.failed ? (
          <Text type="p">There was an error: {error}</Text>
        ) : (
          ''
        )}
      </div>
    );
  }
}
