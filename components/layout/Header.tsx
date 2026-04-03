'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Search, Menu, X, ChevronRight } from 'lucide-react'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useLanguage } from '@/lib/LanguageContext'

interface Category {
  id: string
  name: string
  slug: string
  children: Category[]
}

interface SearchResult {
  type: 'product' | 'category'
  name: string
  slug: string
  brand?: string
  model?: string
}

export function Header() {
  const { t } = useLanguage()
  const [categories, setCategories] = useState<Category[]>([])
  const [showMenu, setShowMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [siteName, setSiteName] = useState('Industrial Parts')
  const [siteLogo, setSiteLogo] = useState('')
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)
  const touchStartTime = useRef<number>(0)
  const touchStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  useEffect(() => {
    fetch('/api/categories?menu=true')
      .then(res => res.json())
      .then(data => setCategories(data.categories || []))
      .catch(() => {})

    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.site_name) {
          setSiteName(data.site_name)
        }
        if (data.site_logo) {
          setSiteLogo(data.site_logo)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        const data = await res.json()
        setSearchResults(data.results || [])
        setShowResults(true)
      } catch {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setShowResults(false)
      setSearchQuery('')
    }
  }

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'product') {
      router.push(`/product/${result.slug}`)
    } else {
      router.push(`/category/${result.slug}`)
    }
    setShowResults(false)
    setSearchQuery('')
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartTime.current = Date.now()
    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchDuration = Date.now() - touchStartTime.current
    const touchEndPos = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    }
    const moveDistance = Math.sqrt(
      Math.pow(touchEndPos.x - touchStartPos.current.x, 2) +
      Math.pow(touchEndPos.y - touchStartPos.current.y, 2)
    )

    if (touchDuration > 300 || moveDistance < 10) {
      setTimeout(() => {
        setShowMenu(prev => !prev)
      }, 50)
    }
  }

  const handleMenuButtonClick = () => {
    setShowMenu(prev => !prev)
  }

  return (
    <header className="bg-primary sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-16 gap-4">
          {/* Menu Toggle Button */}
          <button
            onClick={handleMenuButtonClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors touch-manipulation select-none"
          >
            {showMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            <span className="font-medium hidden sm:inline">{t('header.menu')}</span>
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            {siteLogo ? (
              <div className="bg-white rounded px-1 py-0.5">
                <Image
                  src={siteLogo}
                  alt={siteName}
                  width={32}
                  height={32}
                  className="h-8 w-auto object-contain"
                  unoptimized={siteLogo.startsWith('http')}
                />
              </div>
            ) : (
              <span className="text-white font-bold text-xl whitespace-nowrap">{siteName}</span>
            )}
          </Link>

          {/* Language Switcher - Right side */}
          <div className="ml-auto">
            <LanguageSwitcher />
          </div>

          {/* Search Bar - Right side */}
          <div ref={searchRef} className="flex-1 max-w-xl ml-auto">
            <form onSubmit={handleSearch} className="relative flex">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('header.search')}
                className="flex-1 w-full pl-4 pr-4 py-2 rounded-l-lg bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/40 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-l-0 border-white/20 rounded-r-lg text-white transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>

            {/* Search Results Dropdown */}
            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border max-h-[400px] overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleResultClick(result)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${result.type === 'product' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          {result.type === 'product' ? 'Product' : 'Category'}
                        </span>
                        <span className="font-medium text-gray-900">{result.name}</span>
                      </div>
                      {result.type === 'product' && (
                        <div className="text-sm text-gray-500 mt-0.5">
                          {result.brand && <span>{result.brand} - </span>}
                          <span className="font-mono text-xs">{result.model}</span>
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-gray-500">
                    No results found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Menu - Left Side Panel */}
      {showMenu && (
        <div ref={menuRef} className="absolute left-0 top-full w-72 bg-white shadow-2xl border-r z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b">
            <span className="font-semibold text-gray-900">{t('header.categories')}</span>
            <button
              onClick={() => setShowMenu(false)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Category List */}
          <nav className="py-2 max-h-[70vh] overflow-y-auto">
            {categories.map((category) => (
              <div key={category.id}>
                <Link
                  href={`/category/${category.slug}`}
                  className="flex items-center justify-between px-5 py-3 text-gray-700 hover:bg-gray-50 hover:text-primary transition-all duration-150 group"
                  onClick={() => setShowMenu(false)}
                >
                  <span className="text-base group-hover:font-semibold group-hover:scale-105 group-hover:text-primary transition-all duration-150 origin-left">
                    {category.name}
                  </span>
                  {category.children.length > 0 && (
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all duration-150" />
                  )}
                </Link>

                {/* Subcategories */}
                {category.children.length > 0 && (
                  <div className="bg-gray-50/50">
                    {category.children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/category/${child.slug}`}
                        className="block pl-10 pr-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-primary transition-all duration-150 hover:font-medium"
                        onClick={() => setShowMenu(false)}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      )}

      {/* Overlay */}
      {showMenu && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </header>
  )
}
