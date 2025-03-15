import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import './styles.scss';

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="not-found-page">
      <Helmet>
        <title>{t('common.notFound')} | {t('common.appName')}</title>
      </Helmet>
      
      <div className="not-found-content">
        <h1>404</h1>
        <h2>{t('common.notFound')}</h2>
        <p>{t('notFound.message', 'The page you are looking for does not exist or has been moved.')}</p>
        
        <div className="not-found-actions">
          <Link to="/" className="btn btn-primary">
            {t('notFound.backToHome', 'Back to Home')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 