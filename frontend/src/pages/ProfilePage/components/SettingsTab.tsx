import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { FiAlertCircle, FiToggleLeft, FiToggleRight, FiGlobe, FiMoon, FiSun, FiBell } from 'react-icons/fi';
import { toast } from 'react-toastify';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  profileImage?: string;
  createdAt?: string;
}

interface SettingsTabProps {
  user: User;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ user }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  
  // Settings state
  const [settings, setSettings] = useState({
    language: i18n.language || 'en',
    theme: localStorage.getItem('theme') || 'light',
    emailNotifications: true,
    pushNotifications: false,
    twoFactorAuth: false,
  });
  
  // Handle language change
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    setSettings(prev => ({ ...prev, language: newLanguage }));
    i18n.changeLanguage(newLanguage);
    toast.success(t('settings.languageChanged'));
  };
  
  // Handle theme change
  const handleThemeChange = (theme: 'light' | 'dark') => {
    setSettings(prev => ({ ...prev, theme }));
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    toast.success(t('settings.themeChanged'));
  };
  
  // Handle toggle settings
  const handleToggle = (setting: keyof typeof settings) => {
    setSettings(prev => ({ 
      ...prev, 
      [setting]: !prev[setting] 
    }));
    
    toast.success(t('settings.preferenceSaved'));
  };
  
  return (
    <div className="settings-tab">
      <div className="settings-tab__header">
        <h2>{t('profile.tabs.settings')}</h2>
        <p>{t('settings.subtitle')}</p>
      </div>
      
      <div className="settings-tab__section">
        <h3 className="settings-tab__section-title">
          <FiGlobe className="settings-tab__section-icon" />
          {t('settings.language')}
        </h3>
        
        <div className="settings-tab__option">
          <label htmlFor="language">{t('settings.selectLanguage')}</label>
          <select
            id="language"
            value={settings.language}
            onChange={handleLanguageChange}
            className="form-control"
          >
            <option value="en">English</option>
            <option value="az">Azərbaycan</option>
            <option value="ru">Русский</option>
          </select>
        </div>
      </div>
      
      <div className="settings-tab__section">
        <h3 className="settings-tab__section-title">
          {settings.theme === 'light' ? (
            <FiSun className="settings-tab__section-icon" />
          ) : (
            <FiMoon className="settings-tab__section-icon" />
          )}
          {t('settings.appearance')}
        </h3>
        
        <div className="settings-tab__theme-selector">
          <button
            className={`settings-tab__theme-option ${settings.theme === 'light' ? 'active' : ''}`}
            onClick={() => handleThemeChange('light')}
          >
            <FiSun size={24} />
            <span>{t('settings.lightTheme')}</span>
          </button>
          
          <button
            className={`settings-tab__theme-option ${settings.theme === 'dark' ? 'active' : ''}`}
            onClick={() => handleThemeChange('dark')}
          >
            <FiMoon size={24} />
            <span>{t('settings.darkTheme')}</span>
          </button>
        </div>
      </div>
      
      <div className="settings-tab__section">
        <h3 className="settings-tab__section-title">
          <FiBell className="settings-tab__section-icon" />
          {t('settings.notifications')}
        </h3>
        
        <div className="settings-tab__toggle-row">
          <div className="settings-tab__toggle-info">
            <h4>{t('settings.emailNotifications')}</h4>
            <p>{t('settings.emailNotificationsDesc')}</p>
          </div>
          <button
            className="settings-tab__toggle"
            onClick={() => handleToggle('emailNotifications')}
            aria-pressed={settings.emailNotifications}
          >
            {settings.emailNotifications ? (
              <FiToggleRight size={24} className="toggle-on" />
            ) : (
              <FiToggleLeft size={24} className="toggle-off" />
            )}
          </button>
        </div>
        
        <div className="settings-tab__toggle-row">
          <div className="settings-tab__toggle-info">
            <h4>{t('settings.pushNotifications')}</h4>
            <p>{t('settings.pushNotificationsDesc')}</p>
          </div>
          <button
            className="settings-tab__toggle"
            onClick={() => handleToggle('pushNotifications')}
            aria-pressed={settings.pushNotifications}
          >
            {settings.pushNotifications ? (
              <FiToggleRight size={24} className="toggle-on" />
            ) : (
              <FiToggleLeft size={24} className="toggle-off" />
            )}
          </button>
        </div>
      </div>
      
      <div className="settings-tab__section">
        <h3 className="settings-tab__section-title">
          <FiAlertCircle className="settings-tab__section-icon" />
          {t('settings.security')}
        </h3>
        
        <div className="settings-tab__toggle-row">
          <div className="settings-tab__toggle-info">
            <h4>{t('settings.twoFactorAuth')}</h4>
            <p>{t('settings.twoFactorAuthDesc')}</p>
          </div>
          <button
            className="settings-tab__toggle"
            onClick={() => handleToggle('twoFactorAuth')}
            aria-pressed={settings.twoFactorAuth}
          >
            {settings.twoFactorAuth ? (
              <FiToggleRight size={24} className="toggle-on" />
            ) : (
              <FiToggleLeft size={24} className="toggle-off" />
            )}
          </button>
        </div>
        
        <div className="settings-tab__action-buttons">
          <button className="btn btn--outline">
            {t('settings.changePassword')}
          </button>
          
          <button className="btn btn--danger">
            {t('settings.deleteAccount')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab; 