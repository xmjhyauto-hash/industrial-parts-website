'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useLanguage } from '@/lib/LanguageContext'

interface Brand {
  id: string
  name: string
  logo: string
  url: string
}

export function PopularBrands() {
  const { t } = useLanguage()
  const [brands, setBrands] = useState<Brand[]>([])

  useEffect(() => {
    fetch('/api/brands')
      .then(res => res.json())
      .then(data => {
        if (data.brands && data.brands.length > 0) {
          setBrands(data.brands)
        }
      })
      .catch(() => {})
  }, [])

  if (brands.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('brands.title')}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('brands.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {brands.map((brand) => (
            <a
              key={brand.id}
              href={brand.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              {brand.logo ? (
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  width={160}
                  height={64}
                  className="max-h-16 max-w-full object-contain grayscale group-hover:grayscale-0 transition-all"
                  unoptimized={brand.logo.startsWith('http')}
                />
              ) : (
                <span className="font-semibold text-gray-400">{brand.name}</span>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
