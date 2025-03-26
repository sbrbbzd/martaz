import React from 'react';
import { useTranslation } from 'react-i18next';

interface FavoritesFiltersProps {
  value: string;
  onChange: (value: string) => void;
}

const FavoritesFilters: React.FC<FavoritesFiltersProps> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="sort-select">
      <select 
        value={value}
        onChange={handleChange}
        aria-label={t('listings.sortBy')}
      >
        <option value="newest">{t('listings.sortNewest')}</option>
        <option value="oldest">{t('listings.sortOldest')}</option>
        <option value="price_asc">{t('listings.sortPriceLow')}</option>
        <option value="price_desc">{t('listings.sortPriceHigh')}</option>
        <option value="title_asc">{t('listings.sortTitleAZ')}</option>
        <option value="title_desc">{t('listings.sortTitleZA')}</option>
      </select>
    </div>
  );
};

export default FavoritesFilters; 