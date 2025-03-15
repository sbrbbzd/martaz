import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Card, { CardMedia, CardContent, CardFooter } from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import './ListingCard.scss';

// Placeholder image
const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMThweCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OTk5OSI+UmVzaW0gWcO8a2xlbmVtZWRpPC90ZXh0Pjwvc3ZnPg==';

interface ListingCardProps {
  id: string | number;
  title: string;
  price: number;
  currency?: string;
  location: string;
  imageUrl?: string;
  featuredImage?: string;
  images?: string[];
  category?: string;
  categoryIcon?: string;
  categoryName?: string;
  categorySlug?: string;
  slug?: string;
  condition?: string;
  isFeatured?: boolean;
  isNew?: boolean;
  isPromoted?: boolean;
  createdAt?: string;
  className?: string;
  userName?: string;
  userImage?: string;
  onClick?: () => void;
}

const ListingCard: React.FC<ListingCardProps> = ({
  id,
  title,
  price,
  currency = '₼',
  location,
  imageUrl,
  featuredImage,
  images,
  category,
  categoryIcon,
  categoryName,
  categorySlug,
  slug,
  condition,
  isFeatured = false,
  isNew = false,
  isPromoted = false,
  createdAt,
  className = '',
  userName,
  userImage,
  onClick,
}) => {
  const { t } = useTranslation();
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const handleCardClick = () => {
    if (onClick) onClick();
  };

  // Get the image source
  const getImageSrc = () => {
    if (imageUrl) return imageUrl;
    if (featuredImage) return featuredImage;
    if (images && images.length > 0) return images[0];
    return placeholderImage;
  };

  // Format the time ago string
  const getTimeAgo = () => {
    if (!createdAt) return '';
    
    const now = new Date();
    const createdDate = new Date(createdAt);
    const diffInSeconds = Math.floor((now.getTime() - createdDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return t('time.justNow');
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? t('time.minute') : t('time.minutes')}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? t('time.hour') : t('time.hours')}`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? t('time.day') : t('time.days')}`;
    }
  };

  // Use slug for the link if available, otherwise use ID
  const listingUrl = slug ? `/listings/${slug}` : `/listings/${id}`;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      onClick={handleCardClick}
      className={className}
    >
      <Card variant="default" padding="none" radius="lg" className="listing-card">
        <div className="listing-card__header">
          <CardMedia 
            src={getImageSrc()} 
            alt={title}
            height={180}
            className="listing-card__image"
            loading="lazy"
          />
          
          {!imageLoaded && (
            <div className="listing-card__skeleton"></div>
          )}
          
          <img 
            src={getImageSrc()} 
            alt={title} 
            onLoad={() => setImageLoaded(true)}
            style={{ display: 'none' }}
          />
          
          <div className="listing-card__badges">
            {isFeatured && (
              <Badge variant="secondary" size="sm" rounded>{t('featured')}</Badge>
            )}
            
            {isPromoted && (
              <Badge variant="secondary" size="sm" rounded>{t('promoted')}</Badge>
            )}
            
            {isNew && (
              <Badge variant="accent" size="sm" rounded>{t('new')}</Badge>
            )}
            
            {condition && (
              <Badge variant="primary" size="sm" rounded>{t(`condition.${condition}`)}</Badge>
            )}
          </div>
          
          <button 
            className={`listing-card__favorite ${isFavorite ? 'listing-card__favorite--active' : ''}`}
            onClick={handleFavoriteClick}
            aria-label={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
          >
            {isFavorite ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            )}
          </button>
        </div>
        
        <Link to={listingUrl} className="listing-card__content-link">
          <CardContent className="listing-card__content">
            {(category || categoryName) && (
              <div className="listing-card__category">
                {categoryIcon && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                  </svg>
                )}
                {categoryName || category}
              </div>
            )}
            
            <h3 className="listing-card__title">{title}</h3>
            
            <div className="listing-card__meta">
              <div className="listing-card__location">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                {location}
              </div>
              
              {createdAt && (
                <div className="listing-card__time">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  {getTimeAgo()}
                </div>
              )}
            </div>
            
            {userName && (
              <div className="listing-card__user">
                {userImage ? (
                  <img src={userImage} alt={userName} className="listing-card__user-avatar" />
                ) : (
                  <span className="listing-card__user-initials">
                    {userName.charAt(0)}
                  </span>
                )}
                <span className="listing-card__user-name">{userName}</span>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="listing-card__footer">
            <div className="listing-card__price">
              {price.toLocaleString()} {currency}
            </div>
            
            <Button 
              variant="text" 
              size="sm" 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              }
            >
              {t('viewDetails')}
            </Button>
          </CardFooter>
        </Link>
      </Card>
    </motion.div>
  );
};

export default ListingCard; 