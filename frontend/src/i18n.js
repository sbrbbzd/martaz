import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Tüm dil dosyalarını içe aktarın
import translationEN from './assets/locales/en/translation.json';
import translationAZ from './assets/locales/az/translation.json';
import translationRU from './assets/locales/ru/translation.json';

const resources = {
  en: {
    translation: translationEN
  },
  az: {
    translation: translationAZ
  },
  ru: {
    translation: translationRU
  }
};

i18n
  // Backend'i kaldırdık (HTTP backend kullanmıyoruz)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'az',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

export default i18n; 