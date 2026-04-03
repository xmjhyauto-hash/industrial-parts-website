'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Eye, Users, Clock, Globe, ArrowUp, ArrowDown, Search, Share2, Link2, HelpCircle, MapPin, AlertTriangle, Download, FileSpreadsheet } from 'lucide-react'

interface TrafficSource {
  source: string
  count: number
  percentage: string
}

interface TopCountry {
  country: string
  countryName: string
  count: number
}

interface AnalyticsData {
  totalVisits: number
  visitsInRange: number
  uniqueVisitors: number
  dailyVisits: { date: string; count: number }[]
  topPages: { path: string; views: number }[]
  recentVisits: {
    id: string
    ip: string | null
    path: string
    method: string
    visitedAt: string
    referer: string | null
    source: { category: string; source: string; medium: string }
  }[]
  trafficSources: TrafficSource[]
  topCountries: TopCountry[]
  geoipAvailable: boolean
}

const sourceIcons: Record<string, React.ReactNode> = {
  'Direct': <ArrowUp className="w-4 h-4" />,
  'Search Engine': <Search className="w-4 h-4" />,
  'Social Media': <Share2 className="w-4 h-4" />,
  'External Link': <Link2 className="w-4 h-4" />,
  'Unknown': <HelpCircle className="w-4 h-4" />,
}

const sourceColors: Record<string, string> = {
  'Direct': 'bg-blue-100 text-blue-700',
  'Search Engine': 'bg-green-100 text-green-700',
  'Social Media': 'bg-purple-100 text-purple-700',
  'External Link': 'bg-orange-100 text-orange-700',
  'Unknown': 'bg-gray-100 text-gray-700',
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(7)
  const [exporting, setExporting] = useState(false)

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      const res = await fetch(`/api/export/analytics?days=${days}&format=excel`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('导出失败')
    } finally {
      setExporting(false)
    }
  }

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      const res = await fetch(`/api/export/analytics?days=${days}&format=json`)
      const result = await res.json()

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>访客分析报告</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { font-size: 18px; margin-bottom: 10px; }
    h2 { font-size: 14px; margin-top: 20px; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }
    th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
    th { background: #f5f5f5; }
    .summary { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .summary p { margin: 5px 0; }
    @media print { body { padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <h1>📊 访客分析报告</h1>
  <div class="summary">
    <p><strong>报表周期：</strong>${result.summary?.reportPeriod || '-'}</p>
    <p><strong>总访问量：</strong>${result.summary?.totalVisits || 0}</p>
    <p><strong>独立IP数：</strong>${result.summary?.uniqueIPs || 0}</p>
    <p><strong>导出时间：</strong>${new Date().toLocaleString('zh-CN')}</p>
  </div>

  <h2>📈 每日访问量</h2>
  <table>
    <thead><tr><th>日期</th><th>访问量</th></tr></thead>
    <tbody>
      ${(result.dailyVisits || []).map((d: { date: string; count: number }) => `<tr><td>${d.date}</td><td>${d.count}</td></tr>`).join('')}
    </tbody>
  </table>

  <h2>📄 热门页面 Top 20</h2>
  <table>
    <thead><tr><th>页面</th><th>浏览量</th></tr></thead>
    <tbody>
      ${(result.topPages || []).slice(0, 20).map((p: { path: string; views: number }) => `<tr><td>${p.path}</td><td>${p.views}</td></tr>`).join('')}
    </tbody>
  </table>

  <h2>🌍 地域分布</h2>
  <table>
    <thead><tr><th>国家</th><th>访问数</th></tr></thead>
    <tbody>
      ${(result.topCountries || []).map((c: { country: string; countryName: string; count: number }) => `<tr><td>${c.countryName || c.country}</td><td>${c.count}</td></tr>`).join('')}
    </tbody>
  </table>

  <h2>📝 最近访问记录</h2>
  <table>
    <thead><tr><th>时间</th><th>IP</th><th>页面</th><th>来源</th></tr></thead>
    <tbody>
      ${(result.recentVisits || []).map((v: { visitedAt: string; ip: string; path: string; source: { source: string } }) => `<tr><td>${new Date(v.visitedAt).toLocaleString('zh-CN')}</td><td>${v.ip || '-'}</td><td>${v.path}</td><td>${v.source?.source || '-'}</td></tr>`).join('')}
    </tbody>
  </table>

  <div class="no-print" style="margin-top:30px;text-align:center;">
    <button onclick="window.print()" style="padding:12px 30px;font-size:14px;cursor:pointer;">🖨️ 打印 / 保存为 PDF</button>
  </div>
</body>
</html>
      `

      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('导出失败')
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [days])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics?days=${days}`)
      const result = await res.json()
      if (result.error) {
        setData(null)
      } else {
        setData(result)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleString()
  }

  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return '0'
    return num.toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">加载分析数据中...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">加载分析数据失败</p>
      </div>
    )
  }

  // Calculate trend
  const dailyVisits = data.dailyVisits || []
  const todayVisits = dailyVisits[dailyVisits.length - 1]?.count || 0
  const yesterdayVisits = dailyVisits[dailyVisits.length - 2]?.count || 0
  const trend = yesterdayVisits > 0 ? ((todayVisits - yesterdayVisits) / yesterdayVisits * 100).toFixed(1) : '0'
  const isTrendUp = parseFloat(trend) >= 0

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">访客分析</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">时间范围：</span>
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value={7}>最近7天</option>
            <option value={14}>最近14天</option>
            <option value={30}>最近30天</option>
            <option value={90}>最近90天</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={exporting}
          >
            <FileSpreadsheet className="w-4 h-4 mr-1" />
            导出 Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={exporting}
          >
            <Download className="w-4 h-4 mr-1" />
            导出 PDF
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">总访问量</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(data.totalVisits)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">访问量（最近 {days} 天）</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(data.visitsInRange)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">独立访客</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(data.uniqueVisitors)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今日趋势</p>
                <div className="flex items-center gap-1">
                  <p className="text-3xl font-bold text-gray-900">{trend}%</p>
                  {isTrendUp ? (
                    <ArrowUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <ArrowDown className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Traffic Sources & Geographic Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">流量来源</h2>
            <p className="text-sm text-gray-500 mt-1">基于 Referer 分类统计</p>
          </CardHeader>
          <CardBody>
            {data.trafficSources && data.trafficSources.length > 0 ? (
              <div className="space-y-4">
                {data.trafficSources.map((source) => (
                  <div key={source.source} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${sourceColors[source.source] || 'bg-gray-100 text-gray-700'}`}>
                      {sourceIcons[source.source] || <HelpCircle className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{source.source}</span>
                        <span className="text-sm text-gray-500">{source.count} ({source.percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            source.source === 'Direct' ? 'bg-blue-500' :
                            source.source === 'Search Engine' ? 'bg-green-500' :
                            source.source === 'Social Media' ? 'bg-purple-500' :
                            source.source === 'External Link' ? 'bg-orange-500' : 'bg-gray-500'
                          }`}
                          style={{ width: `${source.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">暂无来源数据</p>
            )}
          </CardBody>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">地域分布</h2>
                <p className="text-sm text-gray-500 mt-1">基于 IP 地址统计</p>
              </div>
              {!data.geoipAvailable && (
                <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  <AlertTriangle className="w-3 h-3" />
                  需要安装 geoip-lite
                </div>
              )}
            </div>
          </CardHeader>
          <CardBody>
            {data.topCountries && data.topCountries.length > 0 ? (
              <div className="space-y-3">
                {data.topCountries.map((country, idx) => (
                  <div key={country.country} className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-gray-100 rounded-full text-sm text-gray-600 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{country.countryName}</span>
                        <span className="text-sm text-gray-500">{country.count}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-teal-500 h-2 rounded-full"
                          style={{ width: `${(country.count / data.topCountries[0].count) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">暂无地域数据</p>
                {data.geoipAvailable === false && (
                  <p className="text-xs text-gray-400 mt-2">运行 npm install geoip-lite 启用</p>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Visits Chart */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">每日访问量</h2>
          </CardHeader>
          <CardBody>
            {dailyVisits.length > 0 ? (
              <div className="space-y-3">
                {dailyVisits.map((day, idx) => {
                  const maxCount = Math.max(...dailyVisits.map(d => d.count), 1)
                  const height = (day.count / maxCount) * 100
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-20 text-sm text-gray-500">{day.date}</div>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-300"
                          style={{ width: `${height}%` }}
                        />
                      </div>
                      <div className="w-12 text-sm text-gray-600 text-right">{day.count}</div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">暂无访问数据</p>
            )}
          </CardBody>
        </Card>

        {/* Top Pages */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">最常访问页面</h2>
          </CardHeader>
          <CardBody>
            {data.topPages && data.topPages.length > 0 ? (
              <div className="space-y-3">
                {data.topPages.map((page, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-gray-100 rounded-full text-sm text-gray-600 flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-gray-700 font-mono">{page.path}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{formatNumber(page.views)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">暂无页面数据</p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Recent Visits */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">最近访问</h2>
        </CardHeader>
        <CardBody>
          {data.recentVisits && data.recentVisits.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="pb-3 pr-4">时间</th>
                    <th className="pb-3 pr-4">IP 地址</th>
                    <th className="pb-3 pr-4">页面</th>
                    <th className="pb-3 pr-4">来源</th>
                    <th className="pb-3">Referer</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-700">
                  {data.recentVisits.map((visit) => (
                    <tr key={visit.id} className="border-t border-gray-100">
                      <td className="py-3 pr-4 text-gray-500">{formatDate(visit.visitedAt)}</td>
                      <td className="py-3 pr-4 font-mono text-xs">{visit.ip || '-'}</td>
                      <td className="py-3 pr-4 font-mono text-primary">{visit.path || '-'}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${sourceColors[visit.source?.source] || 'bg-gray-100 text-gray-700'}`}>
                          {sourceIcons[visit.source?.source] || <HelpCircle className="w-3 h-3" />}
                          {visit.source?.source || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500 truncate max-w-xs" title={visit.referer || ''}>
                        {visit.referer ? (
                          <span className="text-xs font-mono">{new URL(visit.referer).hostname}</span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">暂无最近访问记录</p>
          )}
        </CardBody>
      </Card>
    </div>
  )
}