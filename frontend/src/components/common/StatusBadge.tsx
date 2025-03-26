import React from 'react';
import './StatusBadge.scss';

export type StatusBadgeType = 'success' | 'warning' | 'error' | 'info' | 'default';

interface StatusBadgeProps {
  type: StatusBadgeType;
  text: string;
  size?: 'small' | 'medium' | 'large';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ type, text, size = 'medium' }) => {
  return (
    <span className={`status-badge status-badge--${type} status-badge--${size}`}>
      {text}
    </span>
  );
};

export default StatusBadge; 