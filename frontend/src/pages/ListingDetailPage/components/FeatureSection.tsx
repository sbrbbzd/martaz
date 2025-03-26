import React from 'react';
import { TFunction } from 'i18next';
import { formatDate } from '../../../utils/helpers';

interface FeatureSectionProps {
  listing: any; 
  t: TFunction;
}

// Define a component for the Feature section
const FeatureSection: React.FC<FeatureSectionProps> = ({ listing, t }) => {
  if (!listing) return null;
  
  return (
    <div className="listing-detail-page__features" id="features-section">
      <div className="listing-detail-page__section-header">
        <h2>{t('listing.features')}</h2>
      </div>
      <div className="listing-detail-page__features-grid">
        {listing.condition && (
          <div className="listing-detail-page__feature-item">
            <div className="listing-detail-page__feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                <line x1="16" y1="8" x2="2" y2="22"></line>
                <line x1="17.5" y1="15" x2="9" y2="15"></line>
              </svg>
            </div>
            <div className="listing-detail-page__feature-content">
              <span>{t('listing.condition')}</span>
              <strong>{t(`condition.${listing.condition}`, {defaultValue: listing.condition})}</strong>
            </div>
          </div>
        )}
        {listing.location && (
          <div className="listing-detail-page__feature-item">
            <div className="listing-detail-page__feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div className="listing-detail-page__feature-content">
              <span>{t('listing.location')}</span>
              <strong>{listing.location}</strong>
            </div>
          </div>
        )}
        {listing.createdAt && (
          <div className="listing-detail-page__feature-item">
            <div className="listing-detail-page__feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div className="listing-detail-page__feature-content">
              <span>{t('listing.listedOn')}</span>
              <strong>{formatDate(listing.createdAt)}</strong>
            </div>
          </div>
        )}
        {listing.views !== undefined && (
          <div className="listing-detail-page__feature-item">
            <div className="listing-detail-page__feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </div>
            <div className="listing-detail-page__feature-content">
              <span>{t('listing.views')}</span>
              <strong>{listing.views}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeatureSection; 