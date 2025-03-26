import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import './styles.scss';

interface Category {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
  parentId?: string | null;
}

interface FilterSidebarProps {
  show: boolean;
  onFilterChange: (filters: any) => void;
  onClearFilters: () => void;
  categories: Category[];
  currentCategory: Category | null;
  minPrice: string;
  maxPrice: string;
  condition: string;
  location: string;
  sort: string;
  order: string;
  onLocationChange: (location: string) => void;
}

// Add this helper function to get translated category name
const getLocalizedCategoryName = (category: any, currentLanguage: string) => {
  if (!category.translations) return category.name;
  
  // Try to get the translation for the current language
  const translation = category.translations[currentLanguage as keyof typeof category.translations];
  
  // If no translation exists for the current language, fallback to the default name
  return translation || category.name;
};

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  show,
  onFilterChange,
  onClearFilters,
  categories,
  currentCategory,
  minPrice,
  maxPrice,
  condition,
  location,
  sort,
  order,
  onLocationChange
}) => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  
  // Local state for form inputs
  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);
  const [localCondition, setLocalCondition] = useState(condition);
  const [localLocation, setLocalLocation] = useState(location);
  const [localSort, setLocalSort] = useState(sort);
  const [localOrder, setLocalOrder] = useState(order);
  
  // Update local state when props change
  useEffect(() => {
    setLocalMinPrice(minPrice);
    setLocalMaxPrice(maxPrice);
    setLocalCondition(condition);
    setLocalLocation(location);
    setLocalSort(sort);
    setLocalOrder(order);
  }, [minPrice, maxPrice, condition, location, sort, order]);
  
  // Apply filters
  const handleApplyFilters = () => {
    onFilterChange({
      minPrice: localMinPrice,
      maxPrice: localMaxPrice,
      condition: localCondition,
      location: localLocation,
      sort: localSort,
      order: localOrder
    });
  };
  
  // Handle sort and order changes
  const handleSortChange = (newSort: string, newOrder: string) => {
    setLocalSort(newSort);
    setLocalOrder(newOrder);
    onFilterChange({
      minPrice: localMinPrice,
      maxPrice: localMaxPrice,
      condition: localCondition,
      location: localLocation,
      sort: newSort,
      order: newOrder
    });
  };
  
  return (
    <div className={`filter-sidebar ${show ? 'filter-sidebar--show' : ''}`}>
      <div className="filter-sidebar__section">
        <h3 className="filter-sidebar__title">{t('filters.categories')}</h3>
        <ul className="filter-sidebar__categories">
          <li>
            <Link 
              to="/listings"
              className={!currentCategory ? 'active' : ''}
            >
              {t('filters.allCategories')}
            </Link>
          </li>
          {categories.map((category) => (
            <li key={category.id}>
              <Link 
                to={`/categories/${category.slug}`}
                className={currentCategory?.id === category.id ? 'active' : ''}
              >
                {getLocalizedCategoryName(category, currentLanguage)}
              </Link>
              
              {/* Show subcategories if this is the current category or parent of current */}
              {(currentCategory?.id === category.id || currentCategory?.parentId === category.id) && 
               category.children && 
               category.children.length > 0 && (
                <ul className="filter-sidebar__subcategories">
                  {category.children.map((subCategory) => (
                    <li key={subCategory.id}>
                      <Link 
                        to={`/categories/${subCategory.slug}`}
                        className={currentCategory?.id === subCategory.id ? 'active' : ''}
                      >
                        {getLocalizedCategoryName(subCategory, currentLanguage)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="filter-sidebar__section">
        <h3 className="filter-sidebar__title">{t('filters.price')}</h3>
        <div className="filter-sidebar__price">
          <div className="filter-sidebar__price-input">
            <input
              type="number"
              placeholder={t('filters.min')}
              value={localMinPrice}
              onChange={(e) => setLocalMinPrice(e.target.value)}
              min="0"
            />
          </div>
          <div className="filter-sidebar__price-separator">-</div>
          <div className="filter-sidebar__price-input">
            <input
              type="number"
              placeholder={t('filters.max')}
              value={localMaxPrice}
              onChange={(e) => setLocalMaxPrice(e.target.value)}
              min="0"
            />
          </div>
        </div>
      </div>
      
      <div className="filter-sidebar__section">
        <h3 className="filter-sidebar__title">{t('filters.condition')}</h3>
        <div className="filter-sidebar__condition">
          <select
            value={localCondition}
            onChange={(e) => setLocalCondition(e.target.value)}
          >
            <option value="">{t('filters.allConditions')}</option>
            <option value="new">{t('condition.new')}</option>
            <option value="like-new">{t('condition.like-new')}</option>
            <option value="good">{t('condition.good')}</option>
            <option value="fair">{t('condition.fair')}</option>
            <option value="poor">{t('condition.poor')}</option>
          </select>
        </div>
      </div>
      
      <div className="filter-sidebar__section">
        <h3 className="filter-sidebar__title">{t('filters.location')}</h3>
        <div className="filter-sidebar__location">
          <input
            type="text"
            placeholder={t('filters.locationPlaceholder')}
            value={localLocation}
            onChange={(e) => setLocalLocation(e.target.value)}
          />
        </div>
      </div>
      
      <div className="filter-sidebar__section">
        <h3 className="filter-sidebar__title">{t('filters.sort')}</h3>
        <div className="filter-sidebar__sort">
          <button 
            className={localSort === 'createdAt' && localOrder === 'DESC' ? 'active' : ''}
            onClick={() => handleSortChange('createdAt', 'DESC')}
          >
            {t('filters.newest')}
          </button>
          <button 
            className={localSort === 'createdAt' && localOrder === 'ASC' ? 'active' : ''}
            onClick={() => handleSortChange('createdAt', 'ASC')}
          >
            {t('filters.oldest')}
          </button>
          <button 
            className={localSort === 'price' && localOrder === 'ASC' ? 'active' : ''}
            onClick={() => handleSortChange('price', 'ASC')}
          >
            {t('filters.priceLowToHigh')}
          </button>
          <button 
            className={localSort === 'price' && localOrder === 'DESC' ? 'active' : ''}
            onClick={() => handleSortChange('price', 'DESC')}
          >
            {t('filters.priceHighToLow')}
          </button>
        </div>
      </div>
      
      <div className="filter-sidebar__actions">
        <button 
          className="filter-sidebar__apply"
          onClick={handleApplyFilters}
        >
          {t('filters.apply')}
        </button>
        <button 
          className="filter-sidebar__clear"
          onClick={onClearFilters}
        >
          {t('filters.clear')}
        </button>
      </div>
    </div>
  );
};

export default FilterSidebar; 