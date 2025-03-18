import React, { useState } from 'react';
import './Select.scss';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  variant?: 'outlined' | 'filled';
  required?: boolean;
}

const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  variant = 'outlined',
  required = false,
  className = '',
  children,
  onChange,
  onFocus,
  onBlur,
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  
  const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
    setFocused(true);
    if (onFocus) onFocus(e);
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
    setFocused(false);
    if (onBlur) onBlur(e);
  };
  
  const selectClasses = [
    'select',
    `select--${variant}`,
    fullWidth ? 'select--full-width' : '',
    focused ? 'select--focused' : '',
    error ? 'select--error' : '',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={selectClasses}>
      {label && (
        <label className="select__label">
          {label}
          {required && <span className="select__required">*</span>}
        </label>
      )}
      
      <div className="select__container">
        <select
          className="select__input"
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={onChange}
          aria-invalid={!!error}
          aria-required={required}
          {...props}
        >
          {children}
        </select>
        
        <div className="select__arrow">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
      
      {(error || helperText) && (
        <div className={`select__helper ${error ? 'select__helper--error' : ''}`}>
          {error || helperText}
        </div>
      )}
    </div>
  );
};

export default Select; 