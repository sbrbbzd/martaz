import React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import './Button.scss';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'text';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  className?: string;
}

interface LinkButtonProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>, 
  Pick<ButtonProps, 'variant' | 'size' | 'fullWidth' | 'icon' | 'iconPosition' | 'className'> {
  to: string;
  external?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconPosition = 'right',
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const buttonClasses = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth ? 'btn--full-width' : '',
    icon ? 'btn--with-icon' : '',
    loading ? 'btn--loading' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button 
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="btn__spinner">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="none" strokeWidth="3" />
          </svg>
        </span>
      )}
      
      {icon && iconPosition === 'left' && !loading && (
        <span className="btn__icon btn__icon--left">{icon}</span>
      )}
      
      <span className="btn__text">{children}</span>
      
      {icon && iconPosition === 'right' && !loading && (
        <span className="btn__icon btn__icon--right">{icon}</span>
      )}
    </button>
  );
};

export const LinkButton: React.FC<LinkButtonProps> = ({
  children,
  to,
  external = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconPosition = 'right',
  className = '',
  ...props
}) => {
  const buttonClasses = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth ? 'btn--full-width' : '',
    icon ? 'btn--with-icon' : '',
    className
  ].filter(Boolean).join(' ');

  if (external) {
    return (
      <a 
        href={to} 
        className={buttonClasses}
        target="_blank"
        rel="noopener noreferrer"
        {...props as React.AnchorHTMLAttributes<HTMLAnchorElement>}
      >
        {icon && iconPosition === 'left' && (
          <span className="btn__icon btn__icon--left">{icon}</span>
        )}
        
        <span className="btn__text">{children}</span>
        
        {icon && iconPosition === 'right' && (
          <span className="btn__icon btn__icon--right">{icon}</span>
        )}
      </a>
    );
  }

  return (
    <Link 
      to={to} 
      className={buttonClasses}
      {...props as Omit<LinkProps, 'to'>}
    >
      {icon && iconPosition === 'left' && (
        <span className="btn__icon btn__icon--left">{icon}</span>
      )}
      
      <span className="btn__text">{children}</span>
      
      {icon && iconPosition === 'right' && (
        <span className="btn__icon btn__icon--right">{icon}</span>
      )}
    </Link>
  );
};

// Example component showing different button variants
export const ButtonExamples: React.FC = () => {
  return (
    <div className="button-examples">
      <div className="button-row">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="accent">Accent</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="text">Text</Button>
      </div>
      
      <div className="button-row">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>
      
      <div className="button-row">
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
        <Button fullWidth>Full Width</Button>
      </div>
      
      <div className="button-row">
        <LinkButton to="#">Link Button</LinkButton>
        <LinkButton to="https://example.com" external>External Link</LinkButton>
      </div>
    </div>
  );
};

export default Button; 