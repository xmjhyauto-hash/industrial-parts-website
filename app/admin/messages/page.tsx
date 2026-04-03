'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MessageCircle, Mail, Phone, Trash2, Check, Eye, Clock, User, Download, FileSpreadsheet } from 'lucide-react'

interface VisitorMessage {
  id: string
  name: string
  email: string | null
  phone: string | null
  message: string
  ip: string | null
  status: string
  createdAt: string
  updatedAt: string
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: '新留言', color: 'text-blue-700', bg: 'bg-blue-100' },
  read: { label: '已读', color: 'text-amber-700', bg: 'bg-amber-100' },
  replied: { label: '已回复', color: 'text-green-700', bg: 'bg-green-100' },
  closed: { label: '已关闭', color: 'text-gray-700', bg: 'bg-gray-100' },
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<VisitorMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<VisitorMessage | null>(null)
  const [exporting, setExporting] = useState(false)

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/export/messages?format=excel')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `messages-${new Date().toISOString().split('T')[0]}.xlsx`
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
      const res = await fetch('/api/export/messages?format=json')
      const result = await res.json()

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>访客留言记录</title>
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
  <h1>📝 访客留言记录</h1>
  <p style="font-size:12px;color:#666;">导出时间: ${new Date().toLocaleString('zh-CN')}</p>
  <table>
    <thead>
      <tr>
        <th>状态</th>
        <th>姓名</th>
        <th>邮箱</th>
        <th>电话</th>
        <th>留言内容</th>
        <th>IP</th>
        <th>时间</th>
      </tr>
    </thead>
    <tbody>
      ${(result.data || []).map((m: VisitorMessage) => `
        <tr>
          <td>${statusConfig[m.status]?.label || m.status}</td>
          <td>${m.name}</td>
          <td>${m.email || '-'}</td>
          <td>${m.phone || '-'}</td>
          <td>${m.message}</td>
          <td>${m.ip || '-'}</td>
          <td>${formatDate(m.createdAt)}</td>
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
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/messages')
      const data = await res.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/messages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      fetchMessages()
      if (selectedMessage?.id === id) {
        setSelectedMessage({ ...selectedMessage, status })
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const deleteMessage = async (id: string) => {
    if (!confirm('确定删除这条留言吗？')) return

    try {
      await fetch(`/api/messages/${id}`, { method: 'DELETE' })
      fetchMessages()
      if (selectedMessage?.id === id) {
        setSelectedMessage(null)
      }
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString()
  }

  const newCount = messages.filter(m => m.status === 'new').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">加载留言中...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">访客留言</h1>
          {newCount > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
              {newCount} 条新留言
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
          <Button variant="secondary" onClick={fetchMessages}>
            刷新
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Message List */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">留言列表 ({messages.length})</h2>
          </CardHeader>
          <CardBody className="p-0">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>暂无留言</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedMessage?.id === msg.id ? 'bg-primary/5' : ''
                    } ${msg.status === 'new' ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusConfig[msg.status]?.bg} ${statusConfig[msg.status]?.color}`}>
                          {statusConfig[msg.status]?.label || msg.status}
                        </span>
                        {msg.status === 'new' && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatDate(msg.createdAt)}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">{msg.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{msg.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      {msg.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {msg.email}</span>}
                      {msg.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {msg.phone}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Message Detail */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">留言详情</h2>
          </CardHeader>
          <CardBody>
            {selectedMessage ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${statusConfig[selectedMessage.status]?.bg} ${statusConfig[selectedMessage.status]?.color}`}>
                    {statusConfig[selectedMessage.status]?.label || selectedMessage.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(selectedMessage.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedMessage.name}</h3>
                    <div className="text-sm text-gray-500 space-y-1">
                      {selectedMessage.email && (
                        <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedMessage.email}</p>
                      )}
                      {selectedMessage.phone && (
                        <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedMessage.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">留言内容</label>
                  <p className="mt-1 text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                    {selectedMessage.message}
                  </p>
                </div>

                {selectedMessage.ip && (
                  <div className="text-xs text-gray-400">
                    <span className="font-medium">IP:</span> {selectedMessage.ip}
                  </div>
                )}

                {/* Status Actions */}
                <div className="flex items-center gap-2 pt-4 border-t">
                  <span className="text-sm text-gray-500">更新状态：</span>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => updateStatus(selectedMessage.id, key)}
                      disabled={selectedMessage.status === key}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                        selectedMessage.status === key
                          ? `${config.bg} ${config.color}`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>

                {/* Delete */}
                <div className="pt-4 border-t">
                  <Button
                    variant="secondary"
                    onClick={() => deleteMessage(selectedMessage.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    删除留言
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>选择一个留言查看详情</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
