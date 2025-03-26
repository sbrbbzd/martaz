import React from 'react';
import { TFunction } from 'i18next';
import { Link } from 'react-router-dom';
import ErrorMessage from '../../../components/ErrorMessage';

interface ErrorComponentProps {
  error: any;
  t: TFunction;
  refetch: () => void;
}

// Function to separately define an error component
const ErrorComponent: React.FC<ErrorComponentProps> = ({ 
  error, 
  t, 
  refetch 
}) => {
  const errorMessage = error 
    ? typeof error === 'object' 
      ? JSON.stringify(error)
      : String(error)
    : "Data not available";
  
  return (
    <div className="listing-detail-page">
      <div className="listing-detail-page__container">
        <ErrorMessage 
          message={t('listing.notFound')}
          details={errorMessage}
          onRetry={() => refetch()}
        />
        <div className="listing-detail-page__back">
          <Link to="/listings">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"></path>
            </svg>
            {t('common.backToListings')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ErrorComponent; 