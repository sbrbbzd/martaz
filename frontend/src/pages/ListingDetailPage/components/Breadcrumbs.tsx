import React, { FC } from 'react';
import { TFunction } from 'i18next';
import { Link } from 'react-router-dom';

interface BreadcrumbsProps {
  listing: any;
  t: TFunction;
}

// Extract breadcrumbs into a component
const Breadcrumbs: FC<BreadcrumbsProps> = ({ listing, t }) => {
  if (!listing) return null;
  
  return (
    <div className="listing-detail-page__breadcrumbs">
      <Link to="/">{t('common.home')}</Link>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
      <Link to="/listings">{t('common.listings')}</Link>
      {listing.category && (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
          <Link to={`/categories/${listing.category.slug}`}>{listing.category.name}</Link>
        </>
      )}
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
      <span>{listing.title}</span>
    </div>
  );
};

export default Breadcrumbs; 