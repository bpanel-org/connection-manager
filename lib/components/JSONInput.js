import React from 'react';
import PropTypes from 'prop-types';
import { Header, Label, Text } from '@bpanel/bpanel-ui';

export default function JSONInput({ validator, valid = true, text }) {
  return (
    <div className="json-input">
      <Header type="h5" className="mt-3">
        Additional configurations below (will override above fields):
      </Header>
      <Label text="Custom Configs">
        <textarea
          id="additional-data"
          name="additional-data"
          style={{
            width: '100%',
            border: valid ? 'none' : '2px double darkred',
          }}
          rows={7}
          onChange={e => validator(e)}
          value={text}
          placeholder={`Add as JSON string: \n${JSON.stringify(
            {
              host: '127.0.0.1',
              port: 8333,
              chain: 'bitcoin',
              apiKey: 'my-key',
            },
            null,
            2
          )}`}
        />
      </Label>
      {!valid && (
        <Text type="p" style={{ color: 'darkred' }}>
          Invalid JSON string
        </Text>
      )}
    </div>
  );
}

JSONInput.propTypes = {
  validator: PropTypes.func,
  valid: PropTypes.bool,
  text: PropTypes.string,
};
