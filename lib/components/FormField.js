import React from 'react';
import PropTypes from 'prop-types';
import { Label, Input } from '@bpanel/bpanel-ui';

export default function FormField({ label, onChange, ...otherProps }) {
  return (
    <Label text={label} stacked={false} className="mb-3" textClasses="col-2">
      <Input onChange={onChange} {...otherProps} style={{ width: '100%' }} />
    </Label>
  );
}

FormField.propTypes = {
  label: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};
