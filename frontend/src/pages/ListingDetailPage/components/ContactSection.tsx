import React from 'react';
import { TFunction } from 'i18next';

interface ContactSectionProps {
  listing: any;
  showContactInfo: boolean;
  setShowContactInfo: (show: boolean) => void;
  isChangingStatus: boolean;
  t: TFunction;
}

// Define a component for Contact section
const ContactSection: React.FC<ContactSectionProps> = ({ 
  listing, 
  showContactInfo, 
  setShowContactInfo, 
  isChangingStatus, 
  t 
}) => {
  return (
    <div className="listing-detail-page__contact">
      <h3>{t('listing.contact')}</h3>
      
      {!showContactInfo ? (
        <button 
          className="listing-detail-page__contact-button"
          onClick={() => setShowContactInfo(true)}
          disabled={isChangingStatus}
          aria-expanded={showContactInfo}
          aria-controls="contact-info-section"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          {t('listing.showContact')}
        </button>
      ) : (
        <div 
          id="contact-info-section"
          className={`listing-detail-page__contact-info ${showContactInfo ? 'is-visible' : ''}`}
          aria-live="polite"
        >
          {listing.contactPhone && (
            <div className="listing-detail-page__contact-info-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <a href={`tel:${listing.contactPhone}`}>{listing.contactPhone}</a>
            </div>
          )}
          {listing.contactEmail && (
            <div className="listing-detail-page__contact-info-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <a href={`mailto:${listing.contactEmail}`}>{listing.contactEmail}</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContactSection; 