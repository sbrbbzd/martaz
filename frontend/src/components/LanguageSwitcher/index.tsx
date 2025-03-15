import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './styles.scss';

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'buttons';
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  variant = 'dropdown',
  className = ''
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  const languages = [
    { code: 'az', name: 'Azərbaycan' },
    { code: 'ru', name: 'Русский' },
    { code: 'en', name: 'English' }
  ];
  
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];
  
  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };
  
  if (variant === 'buttons') {
    return (
      <div className={`language-switcher-buttons ${className}`}>
        {languages.map(lang => (
          <button
            key={lang.code}
            className={`language-button ${lang.code === i18n.language ? 'active' : ''}`}
            onClick={() => handleLanguageChange(lang.code)}
          >
            {lang.code.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }
  
  return (
    <div className={`language-switcher-dropdown ${className}`}>
      <button 
        className="language-dropdown-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        {currentLanguage.code.toUpperCase()}
        <span className="arrow">▼</span>
      </button>
      
      {isOpen && (
        <div className="language-dropdown-menu">
          {languages.map(lang => (
            <button
              key={lang.code}
              className={`language-option ${lang.code === i18n.language ? 'active' : ''}`}
              onClick={() => handleLanguageChange(lang.code)}
            >
              {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher; 