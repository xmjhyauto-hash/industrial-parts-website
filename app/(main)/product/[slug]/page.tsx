import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Tag } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { ImageGallery } from '@/components/product/ImageGallery'
import { ProductGrid } from '@/components/product/ProductGrid'
import { Badge } from '@/components/ui/Badge'
import { ProductInquirySection } from '@/components/product/ProductInquirySection'

interface ProductPageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: ProductPageProps) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
  })

  if (!product) {
    return { title: 'Product Not Found' }
  }

  return {
    title: product.metaTitle || product.name,
    description: product.metaDescription || product.description || `${product.name} by ${product.brand || 'Unknown'}`,
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      category: {
        include: {
          parent: true,
        },
      },
    },
  })

  if (!product) {
    notFound()
  }

  // Get related products from same category
  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
    },
    include: {
      category: { select: { name: true, slug: true } },
    },
    take: 4,
  })

  // Parse specifications if available
  let specifications: Record<string, string> = {}
  if (product.specifications) {
    try {
      specifications = JSON.parse(product.specifications)
    } catch {
      specifications = {}
    }
  }

  // Parse images
  const images = JSON.parse(product.images || '[]')

  // Get seller contact info
  const sellerEmail = await prisma.siteSettings.findUnique({
    where: { key: 'seller_email' },
  })
  const sellerPhone = await prisma.siteSettings.findUnique({
    where: { key: 'seller_phone' },
  })

  const contactSubject = encodeURIComponent(
    `Inquiry about ${product.name}${product.model ? ` - ${product.model}` : ''}`
  )
  const contactBody = encodeURIComponent(
    `Hello,\n\nI am interested in the following product:\n\nProduct: ${product.name}\nModel: ${product.model || 'N/A'}\nBrand: ${product.brand || 'N/A'}\n\nPlease provide me with more information about pricing and availability.\n\nThank you.`
  )
  const mailtoLink = `mailto:${sellerEmail?.value || 'sales@example.com'}?subject=${contactSubject}&body=${contactBody}`

  // Prepare product for inquiry section
  const inquiryProduct = {
    id: product.id,
    name: product.name,
    model: product.model,
    brand: product.brand,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-primary">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            {product.category.parent && (
              <>
                <Link href={`/category/${product.category.parent.slug}`} className="text-gray-500 hover:text-primary">
                  {product.category.parent.name}
                </Link>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </>
            )}
            <Link href={`/category/${product.category.slug}`} className="text-gray-500 hover:text-primary">
              {product.category.name}
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Product Main Section */}
        <div className="bg-white rounded-xl border p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Images */}
            <div>
              <ImageGallery images={images} productName={product.name} />
            </div>

            {/* Product Info */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                {product.brand && (
                  <Badge variant="primary">{product.brand}</Badge>
                )}
                {product.featured && (
                  <Badge variant="warning">Featured</Badge>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>

              {product.model && (
                <p className="font-mono text-lg text-gray-600 mb-4">
                  Model: {product.model}
                </p>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                <Tag className="w-4 h-4" />
                <span>Category: </span>
                <Link href={`/category/${product.category.slug}`} className="text-primary hover:underline">
                  {product.category.name}
                </Link>
              </div>

              {/* Inquiry Button */}
              <ProductInquirySection
                product={inquiryProduct}
                sellerEmail={sellerEmail?.value}
                sellerPhone={sellerPhone?.value}
              />
            </div>
          </div>
        </div>

        {/* Specifications */}
        {Object.keys(specifications).length > 0 && (
          <div className="bg-white rounded-xl border p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Specifications</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody>
                  {Object.entries(specifications).map(([key, value], idx) => (
                    <tr key={key} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="px-4 py-3 font-medium text-gray-700">{key}</td>
                      <td className="px-4 py-3 text-gray-600">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Description */}
        {product.description && (
          <div className="bg-white rounded-xl border p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 whitespace-pre-wrap">{product.description}</p>
            </div>
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Products</h2>
            <ProductGrid
              products={relatedProducts.map((p) => ({
                ...p,
                images: p.images,
              }))}
            />
          </div>
        )}
      </div>
    </div>
  )
}
