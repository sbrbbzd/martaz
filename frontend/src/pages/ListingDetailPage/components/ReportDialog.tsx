import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa';
import { useReportListingMutation, useGetReportReasonsQuery } from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
}

const ReportDialog: React.FC<ReportDialogProps> = ({ isOpen, onClose, listingId, listingTitle }) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [customReason, setCustomReason] = useState('');
  
  // Get predefined report reasons from API
  const { data: reportReasons, isLoading: isLoadingReasons } = useGetReportReasonsQuery();
  
  // Report listing mutation
  const [reportListing, { isLoading: isReporting }] = useReportListingMutation();
  
  if (!isOpen) return null;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason) {
      toast.error(t('listing.report.selectReason'));
      return;
    }
    
    try {
      const finalReason = reason === 'other' ? customReason : reason;
      
      await reportListing({
        listingId,
        reason: finalReason,
        additionalInfo
      }).unwrap();
      
      toast.success(t('listing.report.success'));
      onClose();
      
      // Reset form
      setReason('');
      setAdditionalInfo('');
      setCustomReason('');
    } catch (error) {
      console.error('Failed to report listing:', error);
      toast.error(t('listing.report.error'));
    }
  };
  
  return (
    <div className="report-dialog-overlay">
      <div className="report-dialog">
        <div className="report-dialog__header">
          <h2>
            <FaExclamationTriangle />
            {t('listing.report.title')}
          </h2>
          <button 
            className="report-dialog__close-button" 
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <FaTimesCircle />
          </button>
        </div>
        
        <div className="report-dialog__content">
          <p className="report-dialog__description">
            {t('listing.report.description')}
          </p>
          
          <div className="report-dialog__listing-info">
            <strong>{t('listing.report.reportingListing')}:</strong> {listingTitle}
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="report-dialog__form-group">
              <label htmlFor="report-reason">
                {t('listing.report.reasonLabel')}*
              </label>
              
              {isLoadingReasons ? (
                <div className="report-dialog__loading">
                  <LoadingSpinner size="small" />
                </div>
              ) : (
                <select
                  id="report-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  className="report-dialog__select"
                >
                  <option value="">{t('listing.report.selectReason')}</option>
                  {reportReasons?.map((reasonOption) => (
                    <option key={reasonOption.id} value={reasonOption.name}>
                      {reasonOption.name}
                    </option>
                  ))}
                  <option value="other">{t('listing.report.otherReason')}</option>
                </select>
              )}
            </div>
            
            {reason === 'other' && (
              <div className="report-dialog__form-group">
                <label htmlFor="custom-reason">
                  {t('listing.report.customReasonLabel')}*
                </label>
                <input
                  id="custom-reason"
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  required
                  className="report-dialog__input"
                  placeholder={t('listing.report.customReasonPlaceholder')}
                />
              </div>
            )}
            
            <div className="report-dialog__form-group">
              <label htmlFor="additional-info">
                {t('listing.report.additionalInfoLabel')}
              </label>
              <textarea
                id="additional-info"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                className="report-dialog__textarea"
                placeholder={t('listing.report.additionalInfoPlaceholder')}
                rows={4}
              />
            </div>
            
            <div className="report-dialog__actions">
              <button
                type="button"
                onClick={onClose}
                className="report-dialog__button report-dialog__button--secondary"
                disabled={isReporting}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="report-dialog__button report-dialog__button--primary"
                disabled={isReporting || (reason === 'other' && !customReason) || !reason}
              >
                {isReporting ? (
                  <>
                    <LoadingSpinner size="small" />
                    {t('common.submitting')}
                  </>
                ) : (
                  t('listing.report.submit')
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportDialog; 