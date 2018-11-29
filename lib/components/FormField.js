import React from 'react';
import PropTypes from 'prop-types';
import { Label, Input, Dropdown } from '@bpanel/bpanel-ui';

export default function FormField({ label, onChange, type, ...otherProps }) {
  const style = {
    width: '100%',
    cursor: otherProps.disabled ? 'not-allowed' : 'inherit',
  };

  return (
    <Label
      text={label}
      stacked={false}
      className="mb-3"
      textClasses="col-2"
      description={otherProps.description}
    >
      {type === 'dropdown' ? (
        <Dropdown onChange={onChange} {...otherProps} />
      ) : (
        <Input onChange={onChange} name={label} {...otherProps} style={style} />
      )}
    </Label>
  );
}

FormField.propTypes = {
  label: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  type: PropTypes.string,
};
