import React from 'react';
import './Loader.scss';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  fullscreen?: boolean;
  text?: string;
}

/**
 * Loader component for displaying loading states
 */
const Loader: React.FC<LoaderProps> = ({
  size = 'medium',
  color = 'primary',
  fullscreen = false,
  text
}) => {
  const sizeClass = {
    small: 'loader-sm',
    medium: 'loader-md',
    large: 'loader-lg'
  }[size];

  const colorClass = {
    primary: 'loader-primary',
    secondary: 'loader-secondary',
    success: 'loader-success',
    danger: 'loader-danger',
    warning: 'loader-warning',
    info: 'loader-info'
  }[color];

  const containerClass = fullscreen ? 'loader-fullscreen' : 'loader-container';

  return (
    <div className={containerClass}>
      <div className={`loader ${sizeClass} ${colorClass}`}>
        <div className="spinner"></div>
      </div>
      {text && <div className="loader-text">{text}</div>}
    </div>
  );
};

export default Loader; 