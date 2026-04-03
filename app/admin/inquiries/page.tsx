'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Mail, Package, Trash2, Check, Clock, Tag, ExternalLink, Download, FileSpreadsheet } from 'lucide-react'

interface Inquiry {
  id: string
  productId: string
  productName: string
  productModel: string | null
  productBrand: string | null
  customerEmail: string
  customerMessage: string | null
  ip: string | null
  status: string
  createdAt: string
  updatedAt: string
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: '新询价', color: 'text-blue-700', bg: 'bg-blue-100' },
  read: { label: '已读', color: 'text-amber-700', bg: 'bg-amber-100' },
  replied: { label: '已回复', color: 'text-green-700', bg: 'bg-green-100' },
  closed: { label: '已关闭', color: 'text-gray-700', bg: 'bg-gray-100' },
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [exporting, setExporting] = useState(false)

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/export/inquiries?format=excel')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inquiries-${new Date().toISOString().split('T')[0]}.xlsx`
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
      const res = await fetch('/api/export/inquiries?format=json')
      const result = await res.json()

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>产品询价记录</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { font-size: 18px; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
    @media print { body { padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <h1>📩 产品询价记录</h1>
  <p style="font-size:12px;color:#666;">导出时间: ${new Date().toLocaleString('zh-CN')}</p>
  <table>
    <thead>
      <tr>
        <th>状态</th>
        <th>产品名称</th>
        <th>型号</th>
        <th>品牌</th>
        <th>客户邮箱</th>
        <th>询价内容</th>
        <th>IP</th>
        <th>时间</th>
      </tr>
    </thead>
    <tbody>
      ${(result.data || []).map((i: Inquiry) => `
        <tr>
          <td>${statusConfig[i.status]?.label || i.status}</td>
          <td>${i.productName}</td>
          <td>${i.productModel || '-'}</td>
          <td>${i.productBrand || '-'}</td>
          <td>${i.customerEmail}</td>
          <td>${i.customerMessage || '-'}</td>
          <td>${i.ip || '-'}</td>
          <td>${formatDate(i.createdAt)}</td>
        </tr>
      `).join('')}
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
    fetchInquiries()
  }, [])

  const fetchInquiries = async () => {
    try {
      const res = await fetch('/api/inquiry')
      const data = await res.json()
      setInquiries(data.inquiries || [])
    } catch (error) {
      console.error('Failed to fetch inquiries:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/inquiry/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      fetchInquiries()
      if (selectedInquiry?.id === id) {
        setSelectedInquiry({ ...selectedInquiry, status })
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const deleteInquiry = async (id: string) => {
    if (!confirm('确定删除这条询价吗？')) return

    try {
      await fetch(`/api/inquiry/${id}`, { method: 'DELETE' })
      fetchInquiries()
      if (selectedInquiry?.id === id) {
        setSelectedInquiry(null)
      }
    } catch (error) {
      console.error('Failed to delete inquiry:', error)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString()
  }

  const newCount = inquiries.filter(i => i.status === 'new').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">加载询价中...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">产品询价</h1>
          {newCount > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
              {newCount} 条新询价
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={exporting}>
            <FileSpreadsheet className="w-4 h-4 mr-1" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting}>
            <Download className="w-4 h-4 mr-1" />
            PDF
          </Button>
          <Button variant="secondary" onClick={fetchInquiries}>
            刷新
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inquiry List */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">询价列表 ({inquiries.length})</h2>
          </CardHeader>
          <CardBody className="p-0">
            {inquiries.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>暂无询价</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {inquiries.map((inquiry) => (
                  <div
                    key={inquiry.id}
                    onClick={() => setSelectedInquiry(inquiry)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedInquiry?.id === inquiry.id ? 'bg-primary/5' : ''
                    } ${inquiry.status === 'new' ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusConfig[inquiry.status]?.bg} ${statusConfig[inquiry.status]?.color}`}>
                          {statusConfig[inquiry.status]?.label || inquiry.status}
                        </span>
                        {inquiry.status === 'new' && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatDate(inquiry.createdAt)}
                      </span>
                    </div>

                    {/* Product Info */}
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {inquiry.productName}
                      </span>
                    </div>

                    {/* Customer Info */}
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                      <Mail className="w-3 h-3" />
                      <span>{inquiry.customerEmail}</span>
                    </div>

                    {/* Customer Message Preview */}
                    {inquiry.customerMessage && (
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                        {inquiry.customerMessage}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Inquiry Detail */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">询价详情</h2>
          </CardHeader>
          <CardBody>
            {selectedInquiry ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${statusConfig[selectedInquiry.status]?.bg} ${statusConfig[selectedInquiry.status]?.color}`}>
                    {statusConfig[selectedInquiry.status]?.label || selectedInquiry.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(selectedInquiry.createdAt)}
                  </span>
                </div>

                {/* Product Info */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">产品</span>
                  </div>
                  <p className="font-semibold text-gray-900">{selectedInquiry.productName}</p>
                  {selectedInquiry.productBrand && (
                    <div className="flex items-center gap-1 mt-1">
                      <Tag className="w-3 h-3 text-gray-400" />
                      <span className="text-sm text-gray-600">{selectedInquiry.productBrand}</span>
                    </div>
                  )}
                  {selectedInquiry.productModel && (
                    <p className="font-mono text-sm text-gray-500 mt-1">
                      型号：{selectedInquiry.productModel}
                    </p>
                  )}
                </div>

                {/* Customer Info */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">客户</span>
                  </div>
                  <p className="font-medium text-gray-900">{selectedInquiry.customerEmail}</p>
                  {selectedInquiry.ip && (
                    <p className="text-xs text-gray-400 mt-1">
                      IP：{selectedInquiry.ip}
                    </p>
                  )}
                </div>

                {/* Customer Message */}
                {selectedInquiry.customerMessage && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">客户需求</label>
                    <p className="mt-1 text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                      {selectedInquiry.customerMessage}
                    </p>
                  </div>
                )}

                {/* Status Actions */}
                <div className="flex items-center gap-2 pt-4 border-t">
                  <span className="text-sm text-gray-500">更新状态：</span>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => updateStatus(selectedInquiry.id, key)}
                      disabled={selectedInquiry.status === key}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                        selectedInquiry.status === key
                          ? `${config.bg} ${config.color}`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      window.location.href = `mailto:${selectedInquiry.customerEmail}?subject=Re: Inquiry about ${selectedInquiry.productName}`
                    }}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    回复邮件
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => deleteInquiry(selectedInquiry.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    删除
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>选择一个询价查看详情</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}