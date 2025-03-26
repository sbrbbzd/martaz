import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './styles.scss';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false
}) => {
  const { t } = useTranslation();
  
  const handlePrevious = () => {
    if (!disabled && currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };
  
  const handleNext = () => {
    if (!disabled && currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };
  
  const generatePageNumbers = () => {
    let pages = [];
    
    if (totalPages <= 5) {
      // Show all pages if 5 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always include first page
      pages.push(1);
      
      if (currentPage <= 3) {
        // Near the start
        pages.push(2, 3, 4);
        pages.push(-1); // Ellipsis
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push(-1); // Ellipsis
        pages.push(totalPages - 3, totalPages - 2, totalPages - 1);
      } else {
        // Somewhere in the middle
        pages.push(-1); // Ellipsis
        pages.push(currentPage - 1, currentPage, currentPage + 1);
        pages.push(-2); // Ellipsis
      }
      
      // Always include last page
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  const pageNumbers = generatePageNumbers();
  
  return (
    <div className="pagination">
      {/* Previous button */}
      <button 
        className="pagination__button"
        onClick={handlePrevious}
        disabled={disabled || currentPage === 1}
        aria-label={t('common.previous')}
      >
        <FiChevronLeft />
      </button>
      
      {/* Page numbers */}
      <div className="pagination__pages">
        {pageNumbers.map((page, index) => 
          page === -1 || page === -2 ? (
            <div key={`ellipsis-${index}`} className="pagination__ellipsis">
              ...
            </div>
          ) : (
            <button
              key={page}
              className={`pagination__page ${currentPage === page ? 'pagination__page--active' : ''}`}
              onClick={() => !disabled && onPageChange(page)}
              disabled={disabled}
              aria-label={t('common.page', { page })}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}
      </div>
      
      {/* Next button */}
      <button 
        className="pagination__button"
        onClick={handleNext}
        disabled={disabled || currentPage === totalPages}
        aria-label={t('common.next')}
      >
        <FiChevronRight />
      </button>
    </div>
  );
};

export default Pagination; 