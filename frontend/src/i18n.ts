import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import translationAZ from './assets/locales/az/translation.json';
import translationRU from './assets/locales/ru/translation.json';
import translationEN from './assets/locales/en/translation.json';

// the translations
const resources = {
  az: {
    translation: translationAZ
  },
  ru: {
    translation: translationRU
  },
  en: {
    translation: translationEN
  },
  'en-US': {
    translation: translationEN
  }
};

i18n
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next
  .use(initReactI18next)
  // init i18next
  .init({
    resources,
    fallbackLng: 'az',
    debug: false,
    interpolation: {
      escapeValue: false // not needed for react as it escapes by default
    },
    returnObjects: true,
    parseMissingKeyHandler: (key) => {
      // Just return the key itself when missing
      return key;
    },
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      lookupQuerystring: 'lang',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage', 'cookie']
    }
  });

export default i18n; 