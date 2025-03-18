import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useGetMyListingsQuery, useDeleteListingMutation } from '../../services/api';
import Button from '../../components/common/Button';
import ListingCard from '../../components/ListingCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import ImportDialog from '../../components/ImportDialog';
import { FiPlus, FiDownload } from 'react-icons/fi';
import './styles.scss';

const MyListingsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // State
  const [page, setPage] = useState(1);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  // Fetch my listings
  const { 
    data: listingsData, 
    isLoading, 
    isError, 
    refetch 
  } = useGetMyListingsQuery({ 
    page, 
    limit: 12 
  });
  
  // Delete mutation
  const [deleteListing, { isLoading: isDeleting }] = useDeleteListingMutation();
  
  // Load more listings
  const handleLoadMore = () => {
    setPage(prevPage => prevPage + 1);
  };
  
  // Handle listing deletion
  const handleDeleteListing = async (id: string) => {
    if (window.confirm(t('myListings.confirmDelete', 'Are you sure you want to delete this listing?'))) {
      try {
        await deleteListing(id).unwrap();
        refetch();
      } catch (error) {
        console.error('Failed to delete listing:', error);
      }
    }
  };
  
  return (
    <div className="my-listings-page">
      <div className="my-listings-page__container">
        <div className="my-listings-page__header">
          <h1>{t('myListings.title', 'My Listings')}</h1>
          
          <div className="my-listings-page__actions">
            <Button 
              variant="primary" 
              onClick={() => navigate('/create-listing')}
              icon={<FiPlus />}
            >
              {t('myListings.createListing', 'Create Listing')}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setImportDialogOpen(true)}
              icon={<FiDownload />}
            >
              {t('myListings.import', 'Import')}
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="my-listings-page__loading">
            <LoadingSpinner />
            <p>{t('common.loading', 'Loading...')}</p>
          </div>
        ) : isError ? (
          <div className="my-listings-page__error">
            <p>{t('myListings.error', 'Error loading your listings')}</p>
            <Button variant="outline" onClick={() => refetch()}>
              {t('common.retry', 'Retry')}
            </Button>
          </div>
        ) : listingsData?.data?.listings?.length ? (
          <>
            <div className="my-listings-page__grid">
              {listingsData.data.listings.map(listing => (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  title={listing.title}
                  price={listing.price}
                  currency={listing.currency}
                  location={listing.location || ''}
                  createdAt={listing.createdAt}
                  slug={listing.slug}
                  featuredImage={listing.featuredImage}
                  images={listing.images}
                  condition={listing.condition}
                  isFeatured={listing.isFeatured}
                  isPromoted={listing.isPromoted}
                />
              ))}
            </div>
            
            {listingsData.data.totalPages > page && (
              <div className="my-listings-page__load-more">
                <Button variant="outline" onClick={handleLoadMore} disabled={isLoading}>
                  {t('common.loadMore', 'Load More')}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="my-listings-page__empty">
            <h3>{t('myListings.noListings', 'No Listings Found')}</h3>
            <p>{t('myListings.noListingsDescription', 'You haven\'t created any listings yet.')}</p>
            <Button 
              variant="primary" 
              onClick={() => navigate('/create-listing')}
              icon={<FiPlus />}
            >
              {t('myListings.createListing', 'Create Listing')}
            </Button>
          </div>
        )}
      </div>
      
      <ImportDialog 
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
      />
    </div>
  );
};

export default MyListingsPage; 