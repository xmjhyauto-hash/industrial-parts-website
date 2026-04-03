'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ExternalLink, MessageCircle } from 'lucide-react'

interface ProductCardProps {
  product: {
    slug: string
    name: string
    model?: string | null
    brand?: string | null
    images: string
    category?: {
      name: string
      slug: string
    }
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const images = JSON.parse(product.images || '[]')
  const mainImage = images[0] || '/placeholder-product.png'

  const handleQuickInquiry = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Direct mailto link for quick inquiry
    const subject = encodeURIComponent(`Inquiry about ${product.name}${product.model ? ` - ${product.model}` : ''}`)
    const body = encodeURIComponent(`Hello,\n\nI am interested in the following product:\n\nProduct: ${product.name}\nModel: ${product.model || 'N/A'}\nBrand: ${product.brand || 'N/A'}\n\nPlease provide me with more information about pricing and availability.\n\nThank you.`)
    window.location.href = `mailto:sales@example.com?subject=${subject}&body=${body}`
  }

  return (
    <Card hover className="group overflow-hidden">
      <Link href={`/product/${product.slug}`}>
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <Image
            src={mainImage}
            alt={product.name}
            fill
            className="object-contain p-4 transition-transform duration-200 group-hover:scale-105"
          />
          {product.brand && (
            <Badge variant="primary" className="absolute top-2 left-2">
              {product.brand}
            </Badge>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 line-clamp-2 min-h-[3rem]">
            {product.name}
          </h3>
          {product.model && (
            <p className="mt-1 font-mono text-sm text-gray-500">{product.model}</p>
          )}
          {product.category && (
            <p className="mt-1 text-xs text-gray-400">{product.category.name}</p>
          )}
        </div>
      </Link>
      <div className="px-4 pb-4">
        <div className="flex gap-2">
          <Link href={`/product/${product.slug}`} className="flex-1">
            <Button variant="accent" className="w-full hidden sm:flex">
              <ExternalLink className="w-4 h-4 mr-2" />
              Inquire Now
            </Button>
          </Link>
          {/* Mobile Quick Inquiry Button - Floating */}
          <button
            onClick={handleQuickInquiry}
            className="sm:hidden fixed bottom-4 right-4 z-30 w-14 h-14 bg-accent hover:bg-accent/90 text-white rounded-full shadow-lg flex items-center justify-center touch-manipulation"
            aria-label="Quick inquiry"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
          {/* Desktop fallback inline button */}
          <Link href={`/product/${product.slug}`} className="sm:hidden flex-1">
            <Button variant="accent" className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              Inquire
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}
