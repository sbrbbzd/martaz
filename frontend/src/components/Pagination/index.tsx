import React from 'react';
import { useTranslation } from 'react-i18next';
import './styles.scss';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  const { t } = useTranslation();
  
  const getPageNumbers = () => {
    const pages = [];
    
    // Always show first page
    pages.push(1);
    
    // Add current page and pages around it
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (pages.indexOf(i) === -1) {
        pages.push(i);
      }
    }
    
    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    // Add ellipses
    const result = [];
    let prev = 0;
    
    for (const page of pages) {
      if (page - prev > 1) {
        result.push(-1); // -1 represents an ellipsis
      }
      result.push(page);
      prev = page;
    }
    
    return result;
  };
  
  const pageNumbers = getPageNumbers();
  
  return (
    <div className="pagination">
      {/* Previous button */}
      <div 
        className={`pagination__item ${currentPage === 1 ? 'pagination__item--disabled' : ''}`}
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </div>
      
      {/* Page numbers */}
      {pageNumbers.map((page, index) => 
        page === -1 ? (
          <div key={`ellipsis-${index}`} className="pagination__item pagination__item--ellipsis">
            ...
          </div>
        ) : (
          <div
            key={page}
            className={`pagination__item ${currentPage === page ? 'pagination__item--active' : ''}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </div>
        )
      )}
      
      {/* Next button */}
      <div 
        className={`pagination__item ${currentPage === totalPages ? 'pagination__item--disabled' : ''}`}
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </div>
    </div>
  );
};

export default Pagination; 