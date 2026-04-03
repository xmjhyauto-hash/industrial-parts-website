import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const BATCH_SIZE = 1000 // Process products in batches to avoid memory issues

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://industrial-parts.example.com'

  // Get all categories (usually a small number)
  const categories = await prisma.category.findMany({
    select: {
      slug: true,
      updatedAt: true,
    },
  })

  // Build category entries
  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: category.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // Get total product count for batching
  const totalProducts = await prisma.product.count({
    where: { deletedAt: null },
  })

  // Generate product entries in batches
  const productEntries: MetadataRoute.Sitemap = []
  let offset = 0

  while (offset < totalProducts) {
    const productBatch = await prisma.product.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
      where: {
        deletedAt: null,
      },
      skip: offset,
      take: BATCH_SIZE,
      orderBy: { updatedAt: 'desc' },
    })

    for (const product of productBatch) {
      productEntries.push({
        url: `${baseUrl}/product/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.9,
      })
    }

    offset += BATCH_SIZE
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    ...categoryEntries,
    ...productEntries,
  ]
}