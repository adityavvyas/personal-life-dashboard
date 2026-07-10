'use client';

import { createContext, useContext, useState, useEffect } from 'react';

// Import all language dictionaries
import en from '../locales/en.json';
import hi from '../locales/hi.json';
import bn from '../locales/bn.json';
import te from '../locales/te.json';
import mr from '../locales/mr.json';
import ta from '../locales/ta.json';
import ur from '../locales/ur.json';
import gu from '../locales/gu.json';
import kn from '../locales/kn.json';
import ml from '../locales/ml.json';
import pa from '../locales/pa.json';
import or from '../locales/or.json';

const translations = { en, hi, bn, te, mr, ta, ur, gu, kn, ml, pa, or };

export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' }
];

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem('app_language');
    if (saved && translations[saved]) {
      setLanguage(saved);
    }
  }, []);

  const changeLanguage = (code) => {
    if (translations[code]) {
      setLanguage(code);
      localStorage.setItem('app_language', code);
    }
  };

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        // Fallback to English if key doesn't exist in current language
        let fallback = translations['en'];
        for (const fbK of keys) {
          if (fallback && fallback[fbK] !== undefined) fallback = fallback[fbK];
          else return undefined; // Return undefined to trigger || fallback
        }
        return fallback;
      }
    }
    
    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
