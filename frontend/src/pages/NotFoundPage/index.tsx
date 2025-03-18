import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useGetCategoriesQuery } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import './styles.scss';

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  
  // Get categories to check if the URL might be a category slug
  const { data: categories, isLoading } = useGetCategoriesQuery(undefined);
  
  useEffect(() => {
    // Extract potential slug from path (removes the leading slash)
    const potentialSlug = location.pathname.substring(1);
    
    // Check if this might be a category slug
    if (categories && potentialSlug) {
      const matchingCategory = categories.find(category => category.slug === potentialSlug);
      
      if (matchingCategory) {
        // This is a valid category slug, so we can redirect to the listings page with this category
        navigate(`/${matchingCategory.slug}`, { replace: true });
      } else {
        setIsChecking(false);
      }
    } else if (!isLoading) {
      setIsChecking(false);
    }
  }, [categories, location.pathname, navigate, isLoading]);
  
  if (isLoading || isChecking) {
    return <LoadingSpinner />;
  }
  
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