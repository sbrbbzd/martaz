import React from 'react';
import { useTranslation } from 'react-i18next';
import './styles.scss';

interface ErrorMessageProps {
  message: string;
  details?: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  details,
  onRetry
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="error-message">
      <div className="error-message__icon">
        <i className="icon-error"></i>
      </div>
      
      <h3 className="error-message__title">{message}</h3>
      
      {details && (
        <p className="error-message__details">{details}</p>
      )}
      
      {onRetry && (
        <button 
          className="error-message__retry"
          onClick={onRetry}
        >
          {t('common.retry')}
        </button>
      )}
    </div>
  );
};

export default ErrorMessage; 