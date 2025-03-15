import React from 'react';
import { useTranslation } from 'react-i18next';
import './styles.scss';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  text 
}) => {
  const { t } = useTranslation();
  
  return (
    <div className={`loading-spinner loading-spinner--${size}`}>
      <div className="loading-spinner__spinner"></div>
      {text && <p className="loading-spinner__text">{text}</p>}
      {!text && <p className="loading-spinner__text">{t('common.loading')}</p>}
    </div>
  );
};

export default LoadingSpinner; 