'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { languages, LanguageCode, translations } from './translations'

interface LanguageContextType {
  language: LanguageCode
  setLanguage: (lang: LanguageCode) => void
  t: (key: string) => string
  dir: 'ltr' | 'rtl'
  languages: typeof languages
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const STORAGE_KEY = 'preferred_language'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en')
  const [mounted, setMounted] = useState(false)
  const [dir, setDir] = useState<'ltr' | 'rtl'>('ltr')

  useEffect(() => {
    setMounted(true)
    // Load saved language preference
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && languages.some(l => l.code === saved)) {
      setLanguageState(saved as LanguageCode)
      const lang = languages.find(l => l.code === saved)
      setDir(lang?.dir || 'ltr')
    }
  }, [])

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang)
    localStorage.setItem(STORAGE_KEY, lang)
    const foundLang = languages.find(l => l.code === lang)
    setDir(foundLang?.dir || 'ltr')
  }

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key
  }

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    dir,
    languages,
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
