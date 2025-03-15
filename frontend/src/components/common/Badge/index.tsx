import React from 'react';
import './Badge.scss';

export type BadgeVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'error' | 'warning' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  className?: string;
  dot?: boolean;
  outline?: boolean;
  rounded?: boolean;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  dot = false,
  outline = false,
  rounded = false,
}) => {
  const badgeClasses = [
    'badge',
    `badge--${variant}`,
    `badge--${size}`,
    outline ? 'badge--outline' : '',
    rounded ? 'badge--rounded' : '',
    dot ? 'badge--dot' : '',
    icon ? 'badge--with-icon' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={badgeClasses}>
      {dot && <span className="badge__dot" />}
      
      {icon && <span className="badge__icon">{icon}</span>}
      
      <span className="badge__text">{children}</span>
    </span>
  );
};

export default Badge; 