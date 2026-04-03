import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { ProductGrid } from '@/components/product/ProductGrid'
import { Pagination } from '@/components/ui/Pagination'

const PRODUCTS_PER_PAGE = 12

// ISR: Revalidate every minute
export const revalidate = 60

interface CategoryPageProps {
  params: { slug: string }
  searchParams: { page?: string }
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
  })

  if (!category) {
    return { title: 'Category Not Found' }
  }

  return {
    title: category.name,
    description: category.description || `Browse ${category.name} products`,
    alternates: {
      canonical: `/category/${category.slug}`,
      languages: {
        'en-US': `/category/${category.slug}`,
        'zh-CN': `/category/${category.slug}`,
        'es-ES': `/category/${category.slug}`,
        'fr-FR': `/category/${category.slug}`,
        'ar-SA': `/category/${category.slug}`,
        'ru-RU': `/category/${category.slug}`,
      },
    },
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const currentPage = Math.max(1, parseInt(searchParams.page || '1', 10))

  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    include: {
      parent: true,
      children: {
        include: {
          _count: { select: { products: true } },
        },
      },
    },
  })

  if (!category) {
    notFound()
  }

  // Get total count for pagination
  const totalProducts = await prisma.product.count({
    where: { categoryId: category.id },
  })

  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE)

  // Get paginated products
  const products = await prisma.product.findMany({
    where: { categoryId: category.id },
    include: {
      category: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
    skip: (currentPage - 1) * PRODUCTS_PER_PAGE,
    take: PRODUCTS_PER_PAGE,
  })

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
            {category.parent && (
              <>
                <Link href={`/category/${category.parent.slug}`} className="text-gray-500 hover:text-primary">
                  {category.parent.name}
                </Link>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </>
            )}
            <span className="text-gray-900 font-medium">{category.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{category.name}</h1>
          {category.description && (
            <p className="text-gray-600">{category.description}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            {totalProducts} product{totalProducts !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Subcategories */}
        {category.children.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Subcategories</h2>
            <div className="flex flex-wrap gap-3">
              {category.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/category/${child.slug}`}
                  className="px-4 py-2 bg-white border border-border rounded-lg hover:border-primary hover:text-primary transition-colors"
                >
                  {child.name}
                  <span className="ml-2 text-sm text-gray-500">({child._count.products})</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Products</h2>
          {products.length > 0 ? (
            <>
              <ProductGrid
                products={products.map((p) => ({
                  ...p,
                  images: p.images,
                }))}
              />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                baseUrl={`/category/${params.slug}`}
              />
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg border">
              <p className="text-gray-500 text-lg">No products in this category yet.</p>
              <Link href="/" className="text-primary hover:underline mt-2 inline-block">
                Browse other categories
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
