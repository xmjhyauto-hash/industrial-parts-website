import Link from 'next/link'
import { Search } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { ProductGrid } from '@/components/product/ProductGrid'
import { Pagination } from '@/components/ui/Pagination'

const PRODUCTS_PER_PAGE = 12

interface SearchPageProps {
  searchParams: { q?: string; page?: string }
}

export function generateMetadata({ searchParams }: SearchPageProps) {
  const query = searchParams.q || ''
  return {
    title: query ? `Search: ${query}` : 'Search Products',
    description: `Search results for ${query}`,
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || ''
  const currentPage = Math.max(1, parseInt(searchParams.page || '1', 10))

  const whereClause = query ? {
    OR: [
      { name: { contains: query } },
      { model: { contains: query } },
      { brand: { contains: query } },
      { description: { contains: query } },
    ],
  } : {}

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      include: {
        category: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (currentPage - 1) * PRODUCTS_PER_PAGE,
      take: PRODUCTS_PER_PAGE,
    }),
    prisma.product.count({ where: whereClause }),
  ])

  const totalPages = Math.ceil(total / PRODUCTS_PER_PAGE)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {query ? `Search Results for "${query}"` : 'All Products'}
          </h1>
          <p className="text-gray-600">
            {total} product{total !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Search Tips */}
        {query && products.length === 0 && (
          <div className="bg-white rounded-xl border p-8 text-center">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h2>
            <p className="text-gray-600 mb-4">
              We couldn&apos;t find any products matching &quot;{query}&quot;
            </p>
            <div className="text-sm text-gray-500">
              <p className="font-medium mb-2">Search tips:</p>
              <ul className="list-disc list-inside text-left max-w-md mx-auto">
                <li>Check the spelling of your search terms</li>
                <li>Try using different keywords</li>
                <li>Try searching by product name, brand, or model number</li>
                <li>Use more general terms</li>
              </ul>
            </div>
            <Link
              href="/search"
              className="inline-block mt-4 text-primary hover:underline"
            >
              Browse all products
            </Link>
          </div>
        )}

        {/* Products */}
        {products.length > 0 && (
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
              baseUrl="/search"
              searchParams={query ? { q: query } : undefined}
            />
          </>
        )}

        {/* Browse All (when no query) */}
        {!query && products.length === 0 && (
          <div className="bg-white rounded-xl border p-8 text-center">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Products Yet</h2>
            <p className="text-gray-600 mb-4">
              There are no products in the catalog yet.
            </p>
            <Link href="/admin" className="text-primary hover:underline">
              Go to Admin to add products
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}