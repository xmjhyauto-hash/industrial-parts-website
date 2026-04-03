'use client'

import { useLanguage } from '@/lib/LanguageContext'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Settings, Cpu, Monitor, Zap, Radio, Power, Network, Shield, Truck, Wrench, Award } from 'lucide-react'
import { PopularBrands } from './PopularBrands'

interface Category {
  id: string
  name: string
  slug: string
  image: string | null
  _count: { products: number }
}

interface Product {
  id: string
  name: string
  slug: string
  images: string
  category: { name: string; slug: string }
}

interface Article {
  id: string
  title: string
  description: string
  icon: string
  sortOrder: number
  active: boolean
}

interface TranslatedHomeProps {
  heroTitle: string
  heroSubtitle: string
  heroImage?: string
  categories: Category[]
  featuredProducts: Product[]
  showcaseProducts?: Product[]
  articles?: Article[]
}

const categoryIcons: Record<string, React.ReactNode> = {
  'automation-control': <Settings className="w-8 h-8" />,
  'plc-controllers': <Cpu className="w-8 h-8" />,
  'hmi-displays': <Monitor className="w-8 h-8" />,
  sensors: <Radio className="w-8 h-8" />,
  'drives-motors': <Zap className="w-8 h-8" />,
  'power-supply': <Power className="w-8 h-8" />,
  networking: <Network className="w-8 h-8" />,
  'safety-equipment': <Shield className="w-8 h-8" />,
}

const iconMap: Record<string, React.ReactNode> = {
  Settings: <Settings className="w-8 h-8" />,
  Zap: <Zap className="w-8 h-8" />,
  Network: <Network className="w-8 h-8" />,
  Shield: <Shield className="w-8 h-8" />,
  Truck: <Truck className="w-8 h-8" />,
  Wrench: <Wrench className="w-8 h-8" />,
  Award: <Award className="w-8 h-8" />,
}

// Default articles if none are configured
const defaultArticles = [
  { id: '1', title: '卓越品质', description: '严格的质量控制，确保每一件产品都符合国际标准', icon: 'Settings' },
  { id: '2', title: '快速响应', description: '专业团队24小时在线，快速响应客户需求', icon: 'Zap' },
  { id: '3', title: '技术支持', description: '资深工程师提供全方位技术支持，解决您的后顾之忧', icon: 'Network' },
]

export function TranslatedHome({ heroTitle, heroSubtitle, heroImage, categories, featuredProducts, showcaseProducts, articles }: TranslatedHomeProps) {
  const { t } = useLanguage()

  // Use configured articles or fall back to defaults
  const displayArticles = articles && articles.length > 0
    ? articles.map(a => ({ ...a, icon: a.icon || 'Settings' }))
    : defaultArticles

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section
        className="text-white py-20 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: heroImage
            ? `linear-gradient(rgba(30, 64, 175, 0.85), rgba(30, 58, 138, 0.9)), url(${heroImage})`
            : 'linear-gradient(to bottom right, #1E40AF, #1E3A8A)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {heroTitle}
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            {heroSubtitle}
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 bg-accent hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {t('hero.browseAll')}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('categories.title')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('categories.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="group p-6 bg-gray-50 rounded-xl hover:bg-primary hover:text-white transition-all duration-200 flex flex-col justify-end items-center min-h-[180px]"
              >
                <div className="flex justify-center mb-4 text-primary group-hover:text-white transition-colors">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      width={96}
                      height={96}
                      className="w-20 h-20 md:w-24 md:h-24 object-contain"
                      unoptimized={category.image.startsWith('http')}
                    />
                  ) : (
                    <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
                      {categoryIcons[category.slug] || <Settings className="w-12 h-12 md:w-16 md:h-16" />}
                    </div>
                  )}
                </div>
                <div className="text-center mt-auto">
                  <h3 className="font-semibold text-base md:text-lg mb-1">{category.name}</h3>
                  <p className="text-sm text-gray-500 group-hover:text-white/80">
                    {category._count.products} {t('categories.products')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase Products Section */}
      {showcaseProducts && showcaseProducts.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">热门产品</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                精选热门产品，品质保证
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {showcaseProducts.map((product) => {
                const images = JSON.parse(product.images || '[]')
                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-primary transition-all"
                  >
                    <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                      {images.length > 0 ? (
                        <Image
                          src={images[0]}
                          alt={product.name}
                          fill
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          unoptimized={images[0]?.startsWith('http')}
                        />
                      ) : (
                        <Settings className="w-12 h-12 text-gray-300" />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-primary mb-1 truncate">{product.category.name}</p>
                      <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{product.name}</h3>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Popular Brands Section */}
      <PopularBrands />

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">{t('featured.title')}</h2>
              <Link
                href="/search"
                className="text-primary hover:text-primary-dark font-medium flex items-center gap-1"
              >
                {t('featured.viewAll')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => {
                const images = JSON.parse(product.images || '[]')
                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                  >
                    <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                      {images.length > 0 ? (
                        <Image
                          src={images[0]}
                          alt={product.name}
                          fill
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          unoptimized={images[0]?.startsWith('http')}
                        />
                      ) : (
                        <Settings className="w-12 h-12 text-gray-300" />
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-primary mb-1">{product.category.name}</p>
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {t('why.title')}
          </h2>
          <div className={`grid grid-cols-1 ${displayArticles.length === 1 ? 'md:grid-cols-1 max-w-xl mx-auto' : displayArticles.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' : 'md:grid-cols-3'} gap-8`}>
            {displayArticles.map((article) => (
              <div key={article.id} className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary">
                    {iconMap[article.icon] || <Settings className="w-8 h-8" />}
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{article.title}</h3>
                <p className="text-gray-600">
                  {article.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
