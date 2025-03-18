import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '../common/Dialog';
import Button from '../common/Button';
import TextField from '../common/TextField';
import Select from '../common/Select';
import { useImportFromUrlMutation, useGetCategoriesQuery } from '../../services/api';
import { FiLink, FiLoader, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import './ImportDialog.scss';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
}

const ImportDialog: React.FC<ImportDialogProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [importedListingId, setImportedListingId] = useState<string | null>(null);

  // Get the list of categories
  const { data: categories, isLoading: isCategoriesLoading } = useGetCategoriesQuery();
  
  // Import mutation
  const [importFromUrl, { isLoading, isSuccess, error, data }] = useImportFromUrlMutation();

  // Reset form when dialog is opened
  useEffect(() => {
    if (open) {
      setUrl('');
      setCategoryId('');
      setImportStatus('idle');
      setImportedListingId(null);
    }
  }, [open]);

  // Update status based on import result
  useEffect(() => {
    if (isLoading) {
      setImportStatus('loading');
    } else if (isSuccess && data) {
      setImportStatus('success');
      setImportedListingId(data.data.id);
    } else if (error) {
      setImportStatus('error');
    }
  }, [isLoading, isSuccess, error, data]);

  // Handle URL import
  const handleImport = async () => {
    if (!url) return;
    
    try {
      await importFromUrl({ url, categoryId: categoryId || undefined }).unwrap();
    } catch (err) {
      console.error('Failed to import listing:', err);
    }
  };

  // Navigate to the imported listing
  const handleViewListing = () => {
    if (importedListingId) {
      onClose();
      navigate(`/listings/${data?.data.slug || importedListingId}`);
    }
  };

  // Validate URL format
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <Dialog open={open} onClose={importStatus !== 'loading' ? onClose : undefined} maxWidth="sm" fullWidth>
      <DialogTitle>
        {t('import.title', 'Import listing from URL')}
      </DialogTitle>
      
      <DialogContent>
        {importStatus === 'idle' || importStatus === 'loading' ? (
          <div className="import-dialog__form">
            <div className="import-dialog__field">
              <TextField
                label={t('import.url', 'URL')}
                placeholder={t('import.urlPlaceholder', 'Enter product URL')}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                fullWidth
                required
                disabled={importStatus === 'loading'}
                error={url && !isValidUrl(url) ? t('import.invalidUrl', 'Please enter a valid URL') : undefined}
                prefix={<FiLink />}
              />
            </div>
            
            <div className="import-dialog__field">
              <Select
                label={t('import.category', 'Category')}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                fullWidth
                disabled={importStatus === 'loading' || isCategoriesLoading}
              >
                <option value="">{t('import.selectCategory', 'Select a category')}</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>
            
            <div className="import-dialog__note">
              <p>{t('import.note', 'Note: This will attempt to extract product information from the provided URL. The results may vary depending on the website structure.')}</p>
            </div>
          </div>
        ) : importStatus === 'success' ? (
          <div className="import-dialog__success">
            <div className="import-dialog__success-icon">
              <FiCheckCircle size={48} />
            </div>
            <h3>{t('import.success', 'Import successful!')}</h3>
            <p>{t('import.successMessage', 'The listing has been successfully imported and is ready to be published.')}</p>
          </div>
        ) : (
          <div className="import-dialog__error">
            <div className="import-dialog__error-icon">
              <FiAlertCircle size={48} />
            </div>
            <h3>{t('import.error', 'Import failed')}</h3>
            <p>{t('import.errorMessage', 'There was an error importing the listing. Please check the URL and try again.')}</p>
            {error && (
              <div className="import-dialog__error-details">
                {typeof error === 'object' && 'data' in error 
                  ? (error.data as any)?.message || JSON.stringify(error) 
                  : String(error)}
              </div>
            )}
          </div>
        )}
      </DialogContent>
      
      <DialogActions>
        {importStatus === 'idle' ? (
          <>
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button 
              variant="primary" 
              onClick={handleImport} 
              disabled={!url || !isValidUrl(url) || importStatus !== 'idle'}
            >
              {t('import.importButton', 'Import')}
            </Button>
          </>
        ) : importStatus === 'loading' ? (
          <Button variant="primary" disabled>
            <FiLoader className="spin" /> {t('import.importing', 'Importing...')}
          </Button>
        ) : importStatus === 'success' ? (
          <>
            <Button variant="outline" onClick={onClose}>
              {t('common.close', 'Close')}
            </Button>
            <Button variant="primary" onClick={handleViewListing}>
              {t('import.viewListing', 'View Listing')}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onClose}>
              {t('common.close', 'Close')}
            </Button>
            <Button variant="primary" onClick={() => setImportStatus('idle')}>
              {t('import.tryAgain', 'Try Again')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ImportDialog; 