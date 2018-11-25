import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Header, Label, Text, Input, Button } from '@bpanel/bpanel-ui';
import { getClient } from '@bpanel/bpanel-utils';

const FormField = ({ label, onChange, ...otherProps }) => (
  <Label text={label} stacked={false} className="mb-3" textClasses="col-2">
    <Input onChange={onChange} {...otherProps} style={{ width: '100%' }} />
  </Label>
);

FormField.propTypes = {
  label: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

export default class ConfigForm extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      configs: {},
      error: null,
    };
  }

  static get propTypes() {
    return {
      id: PropTypes.string,
      configs: PropTypes.object,
      type: PropTypes.oneOf(['update', 'new', 'delete']),
      checkClientHealth: PropTypes.func,
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
    if (props.configs && !Object.keys(state.configs).length)
      return { configs: { ...props.configs, apiKey: '' } };
    return null;
  }

  resetForm() {
    this.setState({
      configs: {
        ...this.props.configs,
        apiKey: '',
      },
      error: null,
    });
  }

  async onSubmit(force = false) {
    const { id, type, checkClientHealth } = this.props;
    const client = getClient();
    const { configs } = this.state;

    // apiKey needs to default to empty string to keep React happy
    // but clients api will read empty string as an incorrect apiKey
    // so need to set to undefined here if not updating
    let apiKey = undefined;
    if (type === 'update') {
      try {
        if (configs.apiKey.length) apiKey = configs.apiKey;
        const result = await client.put(`/clients/${id}`, {
          options: { ...configs, apiKey },
          force,
        });

        // connection failed
        if (result.failed) {
          this.setState({ error: result });
        } else {
          alert(`Successfully updated configs for ${id}`);
          checkClientHealth(id);
          this.resetForm();
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('There was a problem with your request:', e);
      }
    }
  }

  render() {
    const { id, configs = {} } = this.props;
    const { error } = this.state;

    return (
      <div>
        <Header type="h4">{id}</Header>
        <div className="form-fields">
          {Object.keys(this.state.configs).map((key, index) => (
            <FormField
              label={key}
              value={this.state.configs[key]}
              placeholder={
                configs[key] || `Enter value for ${key.replace('-', ' ')}`
              }
              key={index}
              name={key}
              onChange={e => this.updateValue(key, e.target.value)}
            />
          ))}
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
