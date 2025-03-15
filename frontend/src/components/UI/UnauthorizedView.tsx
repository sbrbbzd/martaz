import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';
import './UnauthorizedView.scss';

interface UnauthorizedViewProps {
  message?: string;
  showBackButton?: boolean;
  showLoginButton?: boolean;
}

/**
 * Unauthorized View component to display when user doesn't have access
 */
const UnauthorizedView: React.FC<UnauthorizedViewProps> = ({
  message,
  showBackButton = true,
  showLoginButton = true
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  const goToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="unauthorized-container">
      <div className="unauthorized-content">
        <div className="unauthorized-icon">
          <FiAlertTriangle />
        </div>
        <h1 className="unauthorized-title">{t('common.unauthorized_title')}</h1>
        <p className="unauthorized-message">
          {message || t('common.unauthorized_message')}
        </p>
        <div className="unauthorized-actions">
          {showBackButton && (
            <button
              className="btn btn-outline"
              onClick={goBack}
              aria-label={t('common.go_back')}
            >
              <FiArrowLeft />
              <span>{t('common.go_back')}</span>
            </button>
          )}
          {showLoginButton && (
            <button
              className="btn btn-primary"
              onClick={goToLogin}
              aria-label={t('auth.login')}
            >
              {t('auth.login')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedView; 