import React from 'react';
import { TFunction } from 'i18next';
import { Link } from 'react-router-dom';
import { FaEdit, FaStar, FaCheckCircle, FaCrown, FaTrash, FaFlag } from 'react-icons/fa';

interface ActionButtonsProps {
  listing: any;
  canEdit: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isChangingStatus: boolean;
  isDeleting: boolean;
  isFeaturing: boolean;
  handleStatusChange: (status: string) => void;
  handleDelete: () => void;
  onReportClick: () => void;
  setIsFeatureModalOpen: (open: boolean) => void;
  t: TFunction;
}

// Define a component for ActionButtons
const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  listing, 
  canEdit, 
  isAdmin, 
  isAuthenticated,
  isChangingStatus, 
  isDeleting, 
  isFeaturing,
  handleStatusChange, 
  handleDelete,
  onReportClick,
  setIsFeatureModalOpen,
  t 
}) => {
  // Don't render anything if user can't edit (not owner or admin)
  if (!canEdit && !isAuthenticated) return null;
  
  return (
    <div className="listing-detail-page__actions">
      {/* Edit button - Only for owner/admin */}
      {canEdit && (
        <Link 
          to={`/listings/${listing.id}/edit`}
          className="listing-detail-page__actions-secondary"
        >
          <FaEdit />
          {t('common.edit')}
        </Link>
      )}
      
      {/* Status change buttons - Mark as sold should be available to the owner */}
      {canEdit && listing.status === 'active' && (
        <button 
          className="listing-detail-page__actions-secondary"
          onClick={() => {
            if (window.confirm(t('listing.confirmMarkSold', 'Are you sure you want to mark this listing as sold? This action cannot be undone.'))) {
              handleStatusChange('sold');
            }
          }}
          disabled={isChangingStatus}
        >
          <FaStar />
          {t('listing.markAsSold')}
        </button>
      )}
      
      {/* Approve button - only for admins on pending listings */}
      {canEdit && listing.status === 'pending' && isAdmin && (
        <button 
          className="listing-detail-page__actions-primary"
          onClick={() => handleStatusChange('active')}
          disabled={isChangingStatus}
          title={t('admin.approve')}
        >
          <FaCheckCircle />
          {t('admin.approve')}
        </button>
      )}
      
      {/* Feature button - show only for active listings that aren't already featured */}
      {canEdit && listing.status === 'active' && !listing.isPromoted && (
        <button
          className="listing-detail-page__actions-feature"
          onClick={() => setIsFeatureModalOpen(true)}
          disabled={isChangingStatus || isFeaturing}
        >
          <FaCrown />
          {t('listing.makeFeature')}
        </button>
      )}
      
      {/* Delete button - Only for owner/admin */}
      {canEdit && (
        <button 
          className="listing-detail-page__actions-danger"
          onClick={() => {
            if (window.confirm(t('listing.confirmDelete'))) {
              handleDelete();
            }
          }}
          disabled={isDeleting || isChangingStatus}
        >
          <FaTrash />
          {t('common.delete')}
        </button>
      )}
      
      {/* Report button - visible to all authenticated users */}
      {isAuthenticated && (
        <button 
          className="listing-detail-page__actions-report"
          onClick={onReportClick}
        >
          <FaFlag />
          {t('listing.report.button')}
        </button>
      )}
    </div>
  );
};

export default ActionButtons; 