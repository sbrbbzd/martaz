import React from 'react';
import { TFunction } from 'i18next';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

interface LoadingComponentProps {
  t: TFunction;
}

// Function to separately define a loading component
const LoadingComponent: React.FC<LoadingComponentProps> = ({ t }) => (
  <div className="listing-detail-page">
    <div className="listing-detail-page__container" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingSpinner size="large" text={t('listing.loading')} />
    </div>
  </div>
);

export default LoadingComponent; 