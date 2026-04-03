import { prisma } from '@/lib/prisma'
import { TranslatedHome } from '@/components/TranslatedHome'

// ISR: Revalidate every hour
export const revalidate = 3600

// Default hero content
const defaultHero = {
  title: 'Industrial Automation Components',
  subtitle: 'Your trusted partner for industrial automation parts. Browse our extensive catalog of PLCs, HMIs, sensors, and more.',
}

async function getSettings() {
  try {
    const settings = await prisma.siteSettings.findMany()
    const result: Record<string, string> = {}
    for (const s of settings) {
      result[s.key] = s.value
    }
    return result
  } catch {
    return {}
  }
}

export default async function HomePage() {
  const settings = await getSettings()

  // Get showcase product IDs
  const showcaseIds = settings.showcase_products
    ? settings.showcase_products.split(',').filter(Boolean)
    : []

  const [categories, featuredProducts, showcaseProducts] = await Promise.all([
    prisma.category.findMany({
      where: { parentId: null },
      include: {
        _count: { select: { products: true } },
      },
      take: 8,
      orderBy: { name: 'asc' },
    }),
    prisma.product.findMany({
      where: { featured: true },
      include: {
        category: { select: { name: true, slug: true } },
      },
      take: 8,
    }),
    showcaseIds.length > 0
      ? prisma.product.findMany({
          where: { id: { in: showcaseIds } },
          include: {
            category: { select: { name: true, slug: true } },
          },
        })
      : Promise.resolve([]),
  ])

  // Sort showcase products by the order in showcaseIds
  const sortedShowcaseProducts = showcaseIds
    .map(id => showcaseProducts.find(p => p.id === id))
    .filter(Boolean) as typeof showcaseProducts

  const heroTitle = settings.hero_title || defaultHero.title
  const heroSubtitle = settings.hero_subtitle || defaultHero.subtitle
  const heroImage = settings.hero_image

  // Get active articles for Why Choose Us section
  let articles: Array<{ id: string; title: string; description: string; icon: string; sortOrder: number; active: boolean }> = []
  try {
    articles = await prisma.article.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    })
  } catch {
    // Table might not exist yet
  }

  return (
    <TranslatedHome
      heroTitle={heroTitle}
      heroSubtitle={heroSubtitle}
      heroImage={heroImage}
      categories={categories}
      featuredProducts={featuredProducts}
      showcaseProducts={sortedShowcaseProducts}
      articles={articles}
    />
  )
}
