import React from 'react';

const StatusBadge = ({ status }) => {
  const statusConfig = {
    in_transit: {
      label: 'In Transit',
      classes: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    picked_up: {
      label: 'Picked Up',
      classes: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    },
    in_progress: {
      label: 'In Progress',
      classes: 'bg-orange-100 text-orange-800 border-orange-200'
    },
    forwarded: {
      label: 'Forwarded',
      classes: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    completed: {
      label: 'Completed',
      classes: 'bg-green-100 text-green-800 border-green-200'
    }
  };

  const config = statusConfig[status] || { label: status, classes: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${config.classes}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
