import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { lookupCountry } from '@/lib/geoip'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const format = searchParams.get('format') || 'json'

    // Get date range
    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // Get all logs in range
    const logs = await prisma.visitorLog.findMany({
      where: { visitedAt: { gte: startDate, lte: endDate } },
      orderBy: { visitedAt: 'desc' },
    })

    // Aggregate data
    const totalVisits = logs.length

    // Daily breakdown
    const dailyMap: Record<string, number> = {}
    for (const log of logs) {
      const date = log.visitedAt.toISOString().split('T')[0]
      dailyMap[date] = (dailyMap[date] || 0) + 1
    }

    // Page statistics
    const pageMap: Record<string, number> = {}
    for (const log of logs) {
      pageMap[log.path] = (pageMap[log.path] || 0) + 1
    }

    // IP statistics
    const ipMap: Record<string, { count: number; country: string }> = {}
    for (const log of logs) {
      if (log.ip) {
        if (!ipMap[log.ip]) {
          ipMap[log.ip] = { count: 0, country: lookupCountry(log.ip) }
        }
        ipMap[log.ip].count++
      }
    }

    // Referer statistics
    const refererMap: Record<string, number> = {}
    let directCount = 0
    for (const log of logs) {
      if (log.referer) {
        try {
          const url = new URL(log.referer)
          refererMap[url.hostname] = (refererMap[url.hostname] || 0) + 1
        } catch {
          refererMap['Unknown'] = (refererMap['Unknown'] || 0) + 1
        }
      } else {
        directCount++
      }
    }

    const data = {
      summary: {
        reportPeriod: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        totalVisits,
        uniqueIPs: Object.keys(ipMap).length,
        exportDate: new Date().toISOString(),
      },
      dailyVisits: Object.entries(dailyMap).map(([date, count]) => ({ date, visits: count })),
      topPages: Object.entries(pageMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50)
        .map(([path, views]) => ({ path, views })),
      topCountries: Object.values(ipMap)
        .reduce((acc, { country }) => {
          acc[country] = (acc[country] || 0) + 1
          return acc
        }, {} as Record<string, number>),
      trafficSources: {
        direct: directCount,
        ...refererMap,
      },
      rawLogs: logs.map(log => ({
        time: log.visitedAt.toISOString(),
        ip: log.ip || '',
        path: log.path,
        method: log.method,
        referer: log.referer || '',
        userAgent: log.userAgent || '',
      })),
    }

    if (format === 'excel') {
      // Create Excel file with multiple sheets
      const ExcelJS = await import('xlsx')
      const workbook = ExcelJS.utils.book_new()

      // Summary sheet
      const summaryData = [
        { '报表周期': data.summary.reportPeriod },
        { '总访问量': data.summary.totalVisits },
        { '独立IP数': data.summary.uniqueIPs },
        { '导出时间': data.summary.exportDate },
      ]
      const summarySheet = ExcelJS.utils.json_to_sheet(summaryData)
      ExcelJS.utils.book_append_sheet(workbook, summarySheet, '摘要')

      // Daily visits
      const dailySheet = ExcelJS.utils.json_to_sheet(data.dailyVisits)
      ExcelJS.utils.book_append_sheet(workbook, dailySheet, '每日访问')

      // Top pages
      const pageSheet = ExcelJS.utils.json_to_sheet(data.topPages)
      ExcelJS.utils.book_append_sheet(workbook, pageSheet, '页面统计')

      // Raw logs
      const rawSheet = ExcelJS.utils.json_to_sheet(data.rawLogs)
      ExcelJS.utils.book_append_sheet(workbook, rawSheet, '原始记录')

      const buffer = ExcelJS.write(workbook, { bookType: 'xlsx', type: 'buffer' })

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="analytics-${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Export analytics error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}