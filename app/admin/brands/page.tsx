'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Image, Trash2, Edit2, Plus, GripVertical } from 'lucide-react'

interface Brand {
  id: string
  name: string
  logo: string
  url: string
  sortOrder: number
  active: boolean
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    url: '',
    sortOrder: 0,
    active: true,
  })

  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/admin/brands')
      const data = await res.json()
      setBrands(data.brands || [])
    } catch (error) {
      console.error('Failed to fetch brands:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const method = editingBrand ? 'PUT' : 'POST'
    const url = editingBrand ? '/api/admin/brands' : '/api/admin/brands'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBrand ? { ...formData, id: editingBrand.id } : formData),
      })

      if (res.ok) {
        fetchBrands()
        resetForm()
      }
    } catch (error) {
      console.error('Failed to save brand:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brand?')) return

    try {
      await fetch(`/api/admin/brands?id=${id}`, { method: 'DELETE' })
      fetchBrands()
    } catch (error) {
      console.error('Failed to delete brand:', error)
    }
  }

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand)
    setFormData({
      name: brand.name,
      logo: brand.logo,
      url: brand.url,
      sortOrder: brand.sortOrder,
      active: brand.active,
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setEditingBrand(null)
    setFormData({ name: '', logo: '', url: '', sortOrder: 0, active: true })
    setShowForm(false)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo') => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData({ ...formData, [field]: reader.result as string })
    }
    reader.readAsDataURL(file)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">品牌管理</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          添加品牌
        </Button>
      </div>

      {/* Brand Form */}
      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <h2 className="font-semibold text-gray-900">
              {editingBrand ? '编辑品牌' : '添加新品牌'}
            </h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    品牌名称 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    网站链接
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="https://"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo 图片
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors">
                    <Image className="w-4 h-4" />
                    <span className="text-sm">上传图片</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'logo')}
                      className="hidden"
                    />
                  </label>
                  {formData.logo && (
                    <div className="relative">
                      <img
                        src={formData.logo}
                        alt="Preview"
                        className="h-12 w-auto object-contain border rounded"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logo: '' })}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    排序
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 text-primary border-border rounded focus:ring-primary/20"
                  />
                  <label htmlFor="active" className="text-sm text-gray-700">
                    启用（显示在网站上）
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <Button type="submit">
                  {editingBrand ? '更新品牌' : '添加品牌'}
                </Button>
                <Button variant="secondary" onClick={resetForm}>
                  取消
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Brands Grid */}
      {brands.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <Image className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">暂无品牌。点击"添加品牌"创建一个。</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {brands.map((brand) => (
            <Card key={brand.id}>
              <CardBody>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-400">#{brand.sortOrder}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(brand)}
                      className="p-1.5 text-gray-400 hover:text-primary rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(brand.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="h-20 flex items-center justify-center mb-3 bg-gray-50 rounded-lg">
                  {brand.logo ? (
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="max-h-16 max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-gray-400 font-medium">{brand.name}</span>
                  )}
                </div>

                <div className="text-center">
                  <h3 className="font-medium text-gray-900 truncate">{brand.name}</h3>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${
                    brand.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {brand.active ? '启用' : '禁用'}
                  </span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
