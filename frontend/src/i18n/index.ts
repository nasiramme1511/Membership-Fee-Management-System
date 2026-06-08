import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import am from './locales/am.json';
import or from './locales/or.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      am: { translation: am },
      or: { translation: or }
    },
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'cookie'],
      caches: ['localStorage', 'cookie']
    },
    interpolation: {
      escapeValue: false
    },
    parseMissingKeyHandler: (key) => {
      const parts = key.split('.');
      return parts[parts.length - 1];
    }
  });

export default i18n;
