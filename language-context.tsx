'use client';

import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import frMessages from '@/locales/fr.json'; // Default messages is now French
import enMessages from '@/locales/en.json'; // Keep for fallback

export type Locale = 'en' | 'fr' | 'de';
type Messages = Record<string, any>;

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const supportedLocales: Locale[] = ['en', 'fr', 'de'];
const defaultLocale: Locale = 'fr'; // Changed default to 'fr' to match layout.tsx

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [messages, setMessages] = useState<Messages>(frMessages); // Changed default messages to French

  useEffect(() => {
    // This effect runs only on the client
    const savedLocale = localStorage.getItem('locale') as Locale | null;
    const browserLang = navigator.language.split('-')[0] as Locale;

    if (savedLocale && supportedLocales.includes(savedLocale)) {
      setLocale(savedLocale);
    } else if (supportedLocales.includes(browserLang)) {
      setLocale(browserLang);
    } else {
      setLocale(defaultLocale);
    }
  }, []);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const newMessages = await import(`@/locales/${locale}.json`);
        setMessages(newMessages.default);
        localStorage.setItem('locale', locale);
      } catch (error) {
        console.error(`Could not load messages for locale: ${locale}`, error);
        setMessages(enMessages); // Fallback to English
      }
    };

    loadMessages();
  }, [locale]);

  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let result: any = messages;
    let fallbackResult: any = enMessages;

    for (const k of keys) {
      result = result?.[k];
      fallbackResult = fallbackResult?.[k];
    }
    
    // Return translated text, fallback to English, or return the key itself
    return result || fallbackResult || key;
  }, [messages]);

  const value = {
    locale,
    setLocale: (newLocale: Locale) => {
        if (supportedLocales.includes(newLocale)) {
            setLocale(newLocale);
        }
    },
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
