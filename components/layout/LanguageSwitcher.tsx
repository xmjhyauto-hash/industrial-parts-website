'use client'

import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { ChevronDown, Globe } from 'lucide-react'

export function LanguageSwitcher() {
  const { language, setLanguage, languages, dir } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLang = languages.find(l => l.code === language)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Sync direction on mount
  useEffect(() => {
    const lang = languages.find(l => l.code === language)
    if (lang) {
      document.documentElement.dir = lang.dir
      document.documentElement.lang = lang.code
    }
  }, [language, languages])

  const handleSelect = (code: typeof languages[number]['code']) => {
    setLanguage(code)
    setIsOpen(false)
    // Update document direction for RTL languages
    const lang = languages.find(l => l.code === code)
    if (lang) {
      document.documentElement.dir = lang.dir
      document.documentElement.lang = lang.code
    }
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">{currentLang?.nativeName}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute ${dir === 'rtl' ? 'left-0' : 'right-0'} top-full mt-2 w-48 bg-white rounded-lg shadow-xl border overflow-hidden z-50`}
        >
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                  language === lang.code ? 'bg-primary/5 text-primary' : 'text-gray-700'
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{lang.nativeName}</span>
                  <span className="text-xs text-gray-400">{lang.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
