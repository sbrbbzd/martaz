import React from 'react';
import './Card.scss';
import { getImageUrl } from '../../../utils/helpers';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outlined' | 'elevated' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  clickable?: boolean;
  as?: React.ElementType;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  radius = 'md',
  hover = false,
  clickable = false,
  as: Component = 'div',
  onClick,
}) => {
  const cardClasses = [
    'card',
    `card--${variant}`,
    `card--padding-${padding}`,
    `card--radius-${radius}`,
    hover ? 'card--hover' : '',
    clickable ? 'card--clickable' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <Component 
      className={cardClasses} 
      onClick={clickable ? onClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      {children}
    </Component>
  );
};

// Card subcomponents
export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children,
  className = '' 
}) => (
  <div className={`card__header ${className}`}>
    {children}
  </div>
);

export const CardMedia: React.FC<{ 
  src: string;
  alt?: string;
  height?: number | string;
  className?: string;
  loading?: 'eager' | 'lazy';
}> = ({ 
  src,
  alt = '',
  height,
  className = '',
  loading = 'lazy'
}) => (
  <div 
    className={`card__media ${className}`} 
    style={height ? { height: typeof height === 'number' ? `${height}px` : height } : undefined}
  >
    <img src={getImageUrl(src)} alt={alt} loading={loading} />
  </div>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children,
  className = '' 
}) => (
  <div className={`card__content ${className}`}>
    {children}
  </div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children,
  className = '' 
}) => (
  <div className={`card__footer ${className}`}>
    {children}
  </div>
);

export default Card;