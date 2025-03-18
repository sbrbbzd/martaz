import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Card from '../common/Card';
import { getCategoryMaterialIcon } from '../../utils/material-icons';
import './CategoryCard.scss';

interface CategoryCardProps {
  id: string;
  name: string;
  count?: number;
  icon: string;
  onClick?: () => void;
  slug?: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ id, name, count = 0, icon, onClick, slug }) => {
  const { t } = useTranslation();
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
        <h3 className="category-card__title">{name}</h3>
        <div className="category-card__count">{count} {t('items')}</div>
      </Card>
    </Link>
  );
};

export default CategoryCard; 