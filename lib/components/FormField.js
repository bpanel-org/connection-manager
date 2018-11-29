import React from 'react';
import PropTypes from 'prop-types';
import { Label, Input } from '@bpanel/bpanel-ui';

export default function FormField({ label, onChange, ...otherProps }) {
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
      <Input onChange={onChange} name={label} {...otherProps} style={style} />
    </Label>
  );
}

FormField.propTypes = {
  label: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};
