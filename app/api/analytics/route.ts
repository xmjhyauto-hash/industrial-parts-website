import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { lookupCountry, getCountryName } from '@/lib/geoip'

// Categorize traffic source from referer
function categorizeSource(referer: string | null): {
  category: 'direct' | 'search' | 'social' | 'external' | 'unknown'
  source: string
  medium: string
} {
  if (!referer) {
    return { category: 'direct', source: 'Direct', medium: 'none' }
  }

  try {
    const url = new URL(referer)
    const hostname = url.hostname.replace(/^www\./, '')

    // Search engines
    const searchEngines: Record<string, string> = {
      'google.com': 'Google',
      'bing.com': 'Bing',
      'yahoo.com': 'Yahoo',
      'baidu.com': 'Baidu',
      'yandex.com': 'Yandex',
      'sogou.com': 'Sogou',
      'so.com': '360 Search',
    }

    for (const [domain, name] of Object.entries(searchEngines)) {
      if (hostname.includes(domain)) {
        return { category: 'search', source: name, medium: 'organic' }
      }
    }

    // Social media
    const socialPlatforms: Record<string, string> = {
      'facebook.com': 'Facebook',
      'twitter.com': 'Twitter',
      'x.com': 'X (Twitter)',
      'instagram.com': 'Instagram',
      'linkedin.com': 'LinkedIn',
      'youtube.com': 'YouTube',
      'tiktok.com': 'TikTok',
      'weibo.com': 'Weibo',
      'reddit.com': 'Reddit',
      'pinterest.com': 'Pinterest',
      'quora.com': 'Quora',
      'tumblr.com': 'Tumblr',
    }

    for (const [domain, name] of Object.entries(socialPlatforms)) {
      if (hostname.includes(domain)) {
        return { category: 'social', source: name, medium: 'social' }
      }
    }

    // External link
    return { category: 'external', source: hostname, medium: 'referral' }
  } catch {
    return { category: 'unknown', source: 'Unknown', medium: 'unknown' }
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')

    // Get date range
    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // Basic stats
    const totalVisits = await prisma.visitorLog.count()

    const visitsInRange = await prisma.visitorLog.count({
      where: {
        visitedAt: { gte: startDate, lte: endDate },
      },
    })

    const uniqueIPs = await prisma.visitorLog.groupBy({
      by: ['ip'],
      where: {
        visitedAt: { gte: startDate, lte: endDate },
        ip: { not: null },
      },
    })

    // Daily visits
    const dailyVisits = await prisma.$queryRaw`
      SELECT DATE(visitedAt) as date, COUNT(*) as count
      FROM VisitorLog
      WHERE visitedAt >= ${startDate} AND visitedAt <= ${endDate}
      GROUP BY DATE(visitedAt)
      ORDER BY date ASC
    `

    // Top pages
    const topPages = await prisma.visitorLog.groupBy({
      by: ['path'],
      _count: { path: true },
      orderBy: { _count: { path: 'desc' } },
      take: 10,
    })

    // Recent visits
    const recentVisits = await prisma.visitorLog.findMany({
      orderBy: { visitedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        ip: true,
        path: true,
        method: true,
        visitedAt: true,
        referer: true,
        userAgent: true,
      },
    })

    // Traffic sources (categorize referers)
    const allLogsInRange = await prisma.visitorLog.findMany({
      where: { visitedAt: { gte: startDate, lte: endDate } },
      select: { referer: true },
    })

    const sourceStats: Record<string, { category: string; count: number }> = {
      direct: { category: 'Direct', count: 0 },
      search: { category: 'Search Engine', count: 0 },
      social: { category: 'Social Media', count: 0 },
      external: { category: 'External Link', count: 0 },
      unknown: { category: 'Unknown', count: 0 },
    }

    for (const log of allLogsInRange) {
      const { category } = categorizeSource(log.referer)
      sourceStats[category].count++
    }

    const trafficSources = Object.entries(sourceStats).map(([, val]) => ({
      source: val.category,
      count: val.count,
      percentage: visitsInRange > 0 ? ((val.count / visitsInRange) * 100).toFixed(1) : '0',
    }))

    // Geographic stats using local IP lookup
    const geoStats: Record<string, { country: string; count: number }> = {}

    // Get unique IPs from logs in range
    const logsWithIPs = await prisma.visitorLog.findMany({
      where: { visitedAt: { gte: startDate, lte: endDate }, ip: { not: null } },
      select: { ip: true },
      distinct: ['ip'],
    })

    for (const log of logsWithIPs) {
      if (log.ip) {
        const countryCode = lookupCountry(log.ip)
        if (countryCode !== 'UNKNOWN' && countryCode !== 'PRIVATE' && countryCode !== 'LOCAL') {
          if (!geoStats[countryCode]) {
            geoStats[countryCode] = { country: countryCode, count: 0 }
          }
          geoStats[countryCode].count++
        }
      }
    }

    const topCountries = Object.values(geoStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(c => ({
        ...c,
        countryName: getCountryName(c.country),
      }))

    return NextResponse.json({
      totalVisits,
      visitsInRange,
      uniqueVisitors: uniqueIPs.length,
      dailyVisits: dailyVisits || [],
      topPages: topPages.map(p => ({ path: p.path, views: p._count.path })),
      recentVisits: recentVisits.map(v => ({
        ...v,
        visitedAt: v.visitedAt.toISOString(),
        source: categorizeSource(v.referer),
      })),
      trafficSources,
      topCountries,
      geoipAvailable: true,
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}