import React from 'react';
import PropTypes from 'prop-types';
import { Text } from '@bpanel/bpanel-ui';

function TabHeader({ id, healthy }) {
  let icon;
  if (id === 'Add New') icon = 'plus-circle';
  else if (healthy === undefined) icon = 'ellipsis-h';
  else if (healthy === true) icon = 'check-circle';
  else icon = 'times-circle';

  return (
    <div className="row no-gutters align-items-center">
      <i className={`fa fa-${icon} mr-2`} />
      <Text className="col text-truncate">{id}</Text>
    </div>
  );
}

TabHeader.propTypes = {
  id: PropTypes.string.isRequired,
  healthy: PropTypes.bool,
};

export default TabHeader;
