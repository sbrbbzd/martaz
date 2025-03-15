import React from 'react';
import './styles.scss';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  fullPage?: boolean;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  fullPage = false,
  text
}) => {
  const spinnerContent = (
    <>
      <div className={`loading-spinner loading-spinner--${size}`}>
        <div className="loading-spinner__circle"></div>
        <div className="loading-spinner__circle"></div>
        <div className="loading-spinner__circle"></div>
      </div>
      {text && <p className="loading-spinner__text">{text}</p>}
    </>
  );
  
  if (fullPage) {
    return (
      <div className="loading-spinner__fullpage">
        {spinnerContent}
      </div>
    );
  }
  
  return (
    <div className="loading-spinner__container">
      {spinnerContent}
    </div>
  );
};

export default LoadingSpinner; 