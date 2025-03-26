import React from 'react';
import { TFunction } from 'i18next';
import { formatPrice } from '../../../utils/helpers';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { FeatureDuration } from '../types';

interface FeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedDuration: FeatureDuration;
  onDurationChange: (duration: FeatureDuration) => void;
  isProcessing: boolean;
  t: TFunction;
}

// Extract FeatureModal into a separate component
const FeatureModal: React.FC<FeatureModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedDuration,
  onDurationChange,
  isProcessing,
  t
}) => {
  if (!isOpen) return null;
  
  const featureDurationOptions = [
    { value: 'day' as FeatureDuration, label: t('listing.featureDuration.day'), price: 5 },
    { value: 'week' as FeatureDuration, label: t('listing.featureDuration.week'), price: 25 },
    { value: 'month' as FeatureDuration, label: t('listing.featureDuration.month'), price: 80 }
  ];
  
  // Function to get feature end date
  const getFeatureEndDate = (duration: FeatureDuration) => {
    const now = new Date();
    let endDate = new Date(now);
    
    switch(duration) {
      case 'day':
        endDate.setDate(now.getDate() + 1);
        break;
      case 'week':
        endDate.setDate(now.getDate() + 7);
        break;
      case 'month':
        endDate.setMonth(now.getMonth() + 1);
        break;
    }
    
    return endDate.toLocaleDateString();
  };
  
  return (
    <div 
      className="listing-detail-page__modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feature-modal-title"
    >
      <div className="listing-detail-page__modal">
        <div className="listing-detail-page__modal-header">
          <h3 id="feature-modal-title">{t('listing.featureTitle')}</h3>
          <button 
            className="listing-detail-page__modal-close"
            onClick={onClose}
            disabled={isProcessing}
            aria-label={t('common.close')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="listing-detail-page__modal-content">
          <p>{t('listing.featureDescription')}</p>
          
          <div className="listing-detail-page__feature-options">
            {featureDurationOptions.map((option) => (
              <div 
                key={option.value}
                className={`listing-detail-page__feature-option ${selectedDuration === option.value ? 'is-selected' : ''}`}
                onClick={() => onDurationChange(option.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onDurationChange(option.value);
                  }
                }}
                tabIndex={0}
                role="radio"
                aria-checked={selectedDuration === option.value}
              >
                <div className="listing-detail-page__feature-option-header">
                  <h4>{option.label}</h4>
                  <span className="listing-detail-page__feature-option-price">
                    {formatPrice(option.price)}
                  </span>
                </div>
                <div className="listing-detail-page__feature-option-details">
                  <p>
                    {t('listing.featureValidUntil', { 
                      date: getFeatureEndDate(option.value) 
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="listing-detail-page__modal-footer">
          <button 
            className="listing-detail-page__modal-cancel"
            onClick={onClose}
            disabled={isProcessing}
          >
            {t('common.cancel')}
          </button>
          <button 
            className="listing-detail-page__modal-confirm"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <LoadingSpinner size="small" />
            ) : (
              t('listing.confirmFeature')
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeatureModal; 