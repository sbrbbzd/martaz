import React, { FC } from 'react';
import { TFunction } from 'i18next';

interface DescriptionSectionProps {
  description?: string;
  t: TFunction;
}

// Extract description rendering to a component
const DescriptionSection: FC<DescriptionSectionProps> = ({ description, t }) => {
  if (!description) return null;
  
  const renderParagraphs = () => {
    return description.split('\n')
      .filter(Boolean)
      .map((paragraph: string, index: number) => (
        <p key={index}>{paragraph}</p>
      ));
  };
  
  return (
    <div className="listing-detail-page__description" id="description-section">
      <div className="listing-detail-page__section-header">
        <h2>{t('listing.description')}</h2>
      </div>
      <div className="listing-detail-page__description-content">
        {renderParagraphs()}
      </div>
    </div>
  );
};

export default DescriptionSection; 