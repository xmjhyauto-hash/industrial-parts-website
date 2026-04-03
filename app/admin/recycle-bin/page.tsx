'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Trash2, RotateCcw, Package, FileText, AlertTriangle } from 'lucide-react'

interface RecycledItem {
  id: string
  name: string
  title?: string
  type: 'product' | 'article'
  deletedAt: string | null
  category?: { name: string }
}

export default function RecycleBinPage() {
  const [items, setItems] = useState<RecycledItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchRecycleBin()
  }, [])

  const fetchRecycleBin = async () => {
    try {
      const res = await fetch('/api/recycle-bin')
      const data = await res.json()
      const allItems = [
        ...(data.products || []).map((p: RecycledItem) => ({ ...p, name: p.name })),
        ...(data.articles || []).map((a: RecycledItem) => ({ ...a, name: a.title })),
      ]
      setItems(allItems)
    } catch (error) {
      console.error('Failed to fetch recycle bin:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map(i => i.id)))
    }
  }

  const handleRestore = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`恢复选中的 ${selectedIds.size} 个项目吗？`)) return

    setProcessing(true)
    try {
      const productIds = items.filter(i => selectedIds.has(i.id) && i.type === 'product').map(i => i.id)
      const articleIds = items.filter(i => selectedIds.has(i.id) && i.type === 'article').map(i => i.id)

      await fetch('/api/recycle-bin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', productIds, articleIds }),
      })
      setSelectedIds(new Set())
      fetchRecycleBin()
    } catch (error) {
      console.error('Failed to restore:', error)
    } finally {
      setProcessing(false)
    }
  }

  const handlePermanentDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`永久删除选中的 ${selectedIds.size} 个项目吗？此操作无法撤销！`)) return

    setProcessing(true)
    try {
      const productIds = items.filter(i => selectedIds.has(i.id) && i.type === 'product').map(i => i.id)
      const articleIds = items.filter(i => selectedIds.has(i.id) && i.type === 'article').map(i => i.id)

      await fetch('/api/recycle-bin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'permanent-delete', productIds, articleIds }),
      })
      setSelectedIds(new Set())
      fetchRecycleBin()
    } catch (error) {
      console.error('Failed to permanently delete:', error)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return <div className="text-gray-500">加载中...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trash2 className="w-6 h-6 text-gray-700" />
          <h1 className="text-2xl font-bold text-gray-900">回收站</h1>
          <Badge variant="secondary">{items.length} 个项目</Badge>
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRestore}
              disabled={processing}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              恢复选中项 ({selectedIds.size})
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handlePermanentDelete}
              disabled={processing}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              永久删除 ({selectedIds.size})
            </Button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <Trash2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">回收站是空的</p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <div className="p-4 border-b">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.size === items.length && items.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-600">全选</span>
            </label>
          </div>
          <div className="divide-y">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 flex items-center gap-4 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(item.id)}
                  onChange={() => toggleSelect(item.id)}
                  className="w-4 h-4 rounded"
                />
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  {item.type === 'product' ? (
                    <Package className="w-5 h-5 text-gray-600" />
                  ) : (
                    <FileText className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.name}</div>
                  <div className="text-sm text-gray-500">
                    {item.type === 'product' ? '产品' : '文章'}
                    {item.category && ` · ${item.category.name}`}
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  删除于 {new Date(item.deletedAt!).toLocaleDateString('zh-CN')}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="mt-6">
        <CardBody className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-900">关于回收站</p>
            <p className="mt-1">
              删除的产品和文章会移至回收站，而非永久删除。您可以恢复或永久删除这些项目。
            </p>
            <p className="mt-1">
              恢复后的产品和文章将恢复正常显示。
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}