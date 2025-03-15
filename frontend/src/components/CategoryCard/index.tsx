import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Card from '../common/Card';
import './CategoryCard.scss';

interface CategoryCardProps {
  id: string;
  name: string;
  count?: number;
  icon: string;
  onClick?: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ id, name, count = 0, icon, onClick }) => {
  const { t } = useTranslation();
  const isCustomIcon = icon.includes('.svg');

  const handleClick = () => {
    if (onClick) onClick();
  };

  return (
    <Link to={`/listings?category=${id}`} className="category-card__link" onClick={handleClick}>
      <Card variant="default" className="category-card">
        <div className="category-card__icon-wrapper">
          {isCustomIcon ? (
            <img src={icon} alt={name} className="category-card__custom-icon" width="48" height="48" />
          ) : (
            <span className="material-icons-outlined category-card__icon">{icon}</span>
          )}
        </div>
        <h3 className="category-card__title">{name}</h3>
        <div className="category-card__count">{count} {t('items')}</div>
      </Card>
    </Link>
  );
};

export default CategoryCard; 