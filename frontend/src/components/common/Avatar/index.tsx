import React from 'react';
import './Avatar.scss';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarVariant = 'circle' | 'rounded' | 'square';
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  variant?: AvatarVariant;
  status?: AvatarStatus;
  statusPosition?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
  badge?: React.ReactNode;
  badgePosition?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
  className?: string;
  onClick?: () => void;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  name,
  size = 'md',
  variant = 'circle',
  status,
  statusPosition = 'bottom-right',
  badge,
  badgePosition = 'top-right',
  className = '',
  onClick,
}) => {
  const avatarClasses = [
    'avatar',
    `avatar--${size}`,
    `avatar--${variant}`,
    onClick ? 'avatar--clickable' : '',
    className
  ].filter(Boolean).join(' ');
  
  // Generate initials from name
  const getInitials = () => {
    if (!name) return '';
    
    const nameParts = name.split(' ').filter(Boolean);
    if (nameParts.length === 0) return '';
    
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };
  
  // Generate a consistent color based on the name
  const getColorIndex = () => {
    if (!name) return 0;
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 10; // 10 colors defined in Avatar.scss
  };
  
  return (
    <div 
      className={avatarClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={name || alt}
    >
      {src ? (
        <img className="avatar__image" src={src} alt={alt || name || 'Avatar'} />
      ) : name ? (
        <div className={`avatar__initials avatar__initials--color-${getColorIndex()}`}>
          {getInitials()}
        </div>
      ) : (
        <div className="avatar__placeholder">
          <span className="material-icons">person</span>
        </div>
      )}
      
      {status && (
        <span className={`avatar__status avatar__status--${status} avatar__status--${statusPosition}`} />
      )}
      
      {badge && (
        <div className={`avatar__badge avatar__badge--${badgePosition}`}>
          {badge}
        </div>
      )}
    </div>
  );
};

export default Avatar; 