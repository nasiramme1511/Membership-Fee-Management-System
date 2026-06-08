import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import am from './locales/am.json';
import om from './locales/om.json';
import so from './locales/so.json';

const SUPPORTED_LANGS = ['en', 'am', 'om', 'so'];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      am: { translation: am },
      om: { translation: om },
      so: { translation: so }
    },
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'cookie'],
      caches: ['localStorage', 'cookie'],
      lookupLocalStorage: 'i18nextLng',
      checkWhitelist: true
    },
    interpolation: {
      escapeValue: false
    },
    parseMissingKeyHandler: (key) => {
      const parts = key.split('.');
      return parts[parts.length - 1];
    }
  });

export { SUPPORTED_LANGS };
export default i18n;
