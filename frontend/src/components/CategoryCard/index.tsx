import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Card from '../common/Card';
import { getCategoryMaterialIcon } from '../../utils/material-icons';
import './CategoryCard.scss';
import { Category } from '../../services/api';

interface CategoryCardProps {
  id: string;
  name: string;
  count?: number;
  icon: string;
  onClick?: () => void;
  slug?: string;
  translations?: {
    az?: string | null;
    en?: string | null;
    ru?: string | null;
  };
}

const CategoryCard: React.FC<CategoryCardProps> = ({ id, name, count = 0, icon, onClick, slug, translations }) => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  
  // Get the appropriate name based on the current language
  const getLocalizedName = () => {
    if (!translations) return name;
    
    // Try to get the translation for the current language
    const translation = translations[currentLanguage as keyof typeof translations];
    
    // If no translation exists for the current language, fallback to the default name
    return translation || name;
  };

  const isCustomIcon = icon && icon.includes('.svg');
  const materialIcon = isCustomIcon ? null : (icon || getCategoryMaterialIcon({ name, slug }));

  const handleClick = () => {
    if (onClick) onClick();
  };

  const categorySlug = slug || id;

  return (
    <Link to={`/${categorySlug}`} className="category-card__link" onClick={handleClick}>
      <Card variant="default" className="category-card">
        <div className="category-card__icon-wrapper">
          {isCustomIcon ? (
            <img src={icon} alt={name} className="category-card__custom-icon" width="48" height="48" />
          ) : (
            <span className="material-icons-outlined category-card__icon">{materialIcon}</span>
          )}
        </div>
        <h3 className="category-card__title">{getLocalizedName()}</h3>
        <div className="category-card__count">{count} {t('items')}</div>
      </Card>
    </Link>
  );
};

export default CategoryCard; 