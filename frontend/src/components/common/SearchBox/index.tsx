import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import './SearchBox.scss';

interface SearchBoxProps {
  placeholder?: string;
  trendingSearches?: string[];
  onSearch?: (query: string) => void;
  className?: string;
  variant?: 'default' | 'compact' | 'header';
  showTrending?: boolean;
}

const SearchBox: React.FC<SearchBoxProps> = ({
  placeholder,
  trendingSearches = [],
  onSearch,
  className = '',
  variant = 'default',
  showTrending = true,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load recent searches from localStorage
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches).slice(0, 5));
    }

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = () => {
    if (!query.trim()) return;
    
    // Save to recent searches
    const updatedSearches = [
      query,
      ...recentSearches.filter(item => item !== query)
    ].slice(0, 5);
    
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    
    if (onSearch) {
      onSearch(query);
    } else {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
    
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSearchItemClick = (searchTerm: string) => {
    setQuery(searchTerm);
    setIsFocused(false);
    
    // Trigger search with a small delay to show the term in the input
    setTimeout(() => {
      if (onSearch) {
        onSearch(searchTerm);
      } else {
        navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
      }
    }, 100);
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, height: 0 },
    visible: { opacity: 1, y: 0, height: 'auto' }
  };

  return (
    <div className={`search-box search-box--${variant} ${className}`}>
      <div className="search-box__input-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        
        <input
          ref={inputRef}
          type="text"
          className="search-box__input"
          placeholder={placeholder || t('common.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
        />
        
        {query && (
          <button 
            className="search-box__clear" 
            onClick={() => setQuery('')}
            aria-label={t('common.clear')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
        
        <button 
          className="search-box__button"
          onClick={handleSearch}
          aria-label={t('common.search')}
        >
          {variant === 'header' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          ) : (
            t('common.search')
          )}
        </button>
      </div>
      
      <AnimatePresence>
        {isFocused && (showTrending || recentSearches.length > 0) && (
          <motion.div
            ref={dropdownRef}
            className="search-box__dropdown"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={dropdownVariants}
            transition={{ duration: 0.2 }}
          >
            {recentSearches.length > 0 && (
              <div className="search-box__section">
                <div className="search-box__section-header">
                  <span>{t('common.recentSearches')}</span>
                  <button 
                    className="search-box__clear-all"
                    onClick={() => {
                      setRecentSearches([]);
                      localStorage.removeItem('recentSearches');
                    }}
                  >
                    {t('common.clearAll')}
                  </button>
                </div>
                <ul className="search-box__list">
                  {recentSearches.map((term, index) => (
                    <li key={`recent-${index}`}>
                      <button 
                        className="search-box__item"
                        onClick={() => handleSearchItemClick(term)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="23 4 23 10 17 10"></polyline>
                          <polyline points="1 20 1 14 7 14"></polyline>
                          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                        </svg>
                        <span>{term}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {showTrending && trendingSearches.length > 0 && (
              <div className="search-box__section">
                <div className="search-box__section-header">
                  <span>{t('common.trending')}</span>
                </div>
                <ul className="search-box__list">
                  {trendingSearches.map((term, index) => (
                    <li key={`trending-${index}`}>
                      <button 
                        className="search-box__item"
                        onClick={() => handleSearchItemClick(term)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                          <polyline points="16 7 22 7 22 13"></polyline>
                        </svg>
                        <span>{term}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBox; 