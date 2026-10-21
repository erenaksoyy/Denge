import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';

import type { Language } from '@/lib/types';

import { en } from './en';
import { tr } from './tr';

export type AppLang = 'tr' | 'en';

export function deviceLanguage(): AppLang {
  return getLocales()[0]?.languageCode === 'tr' ? 'tr' : 'en';
}

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources: { tr: { translation: tr }, en: { translation: en } },
  lng: deviceLanguage(),
  fallbackLng: 'en',
  initAsync: false,
  interpolation: { escapeValue: false },
  returnNull: false,
});

export function applyLanguage(pref: Language) {
  const lang = pref === 'system' ? deviceLanguage() : pref;
  if (i18n.language !== lang) void i18n.changeLanguage(lang);
}

export const currentLang = (): AppLang => (i18n.language === 'tr' ? 'tr' : 'en');
export const localeTag = (lang: AppLang = currentLang()) => (lang === 'tr' ? 'tr-TR' : 'en-US');

/** Translation function plus the active language and its BCP-47 locale for Intl formatting. */
export function useT() {
  const { t, i18n: inst } = useTranslation();
  const lang: AppLang = inst.language === 'tr' ? 'tr' : 'en';
  return { t, lang, locale: localeTag(lang) };
}

export default i18n;
