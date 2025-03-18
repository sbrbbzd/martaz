import React, { useState } from 'react';
import './TextField.scss';

interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  variant?: 'outlined' | 'filled';
  required?: boolean;
}

const TextField: React.FC<TextFieldProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  prefix,
  suffix,
  variant = 'outlined',
  required = false,
  className = '',
  onChange,
  onFocus,
  onBlur,
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    if (onFocus) onFocus(e);
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    if (onBlur) onBlur(e);
  };
  
  const textFieldClasses = [
    'text-field',
    `text-field--${variant}`,
    fullWidth ? 'text-field--full-width' : '',
    focused ? 'text-field--focused' : '',
    error ? 'text-field--error' : '',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={textFieldClasses}>
      {label && (
        <label className="text-field__label">
          {label}
          {required && <span className="text-field__required">*</span>}
        </label>
      )}
      
      <div className="text-field__input-container">
        {prefix && (
          <div className="text-field__prefix">
            {prefix}
          </div>
        )}
        
        <input
          className="text-field__input"
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={onChange}
          aria-invalid={!!error}
          aria-required={required}
          {...props}
        />
        
        {suffix && (
          <div className="text-field__suffix">
            {suffix}
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <div className={`text-field__helper ${error ? 'text-field__helper--error' : ''}`}>
          {error || helperText}
        </div>
      )}
    </div>
  );
};

export default TextField; 