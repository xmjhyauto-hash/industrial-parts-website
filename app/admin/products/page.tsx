'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { FolderTree, CheckSquare, Square, Trash2, ArrowRightCircle, Upload, X, Image as ImageIcon } from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  model: string | null
  brand: string | null
  description: string | null
  specifications: string | null
  images: string
  categoryId: string
  category: { name: string; slug: string }
  featured: boolean
}

interface Category {
  id: string
  name: string
  slug: string
}

function ProductsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')

  const [products, setProducts] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Filter state
  const [filterBrand, setFilterBrand] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [targetCategoryId, setTargetCategoryId] = useState('')
  const [bulkUpdating, setBulkUpdating] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    model: '',
    brand: '',
    description: '',
    specifications: '',
    categoryId: '',
    featured: false,
  })

  const [productImages, setProductImages] = useState<string[]>([])
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  useEffect(() => {
    if (editId && products.length > 0) {
      const product = products.find((p) => p.id === editId)
      if (product) {
        setFormData({
          name: product.name,
          model: product.model || '',
          brand: product.brand || '',
          description: product.description || '',
          specifications: product.specifications || '',
          categoryId: product.categoryId,
          featured: product.featured,
        })
        // Parse images
        try {
          const images = JSON.parse(product.images || '[]')
          setProductImages(images)
        } catch {
          setProductImages([])
        }
      }
    }
  }, [editId, products])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?limit=100')
      const data = await res.json()
      const prods = data.products || []
      setAllProducts(prods)
      setProducts(prods)

      // Extract unique brands
      const uniqueBrands = Array.from(new Set(prods
        .map((p: Product) => p.brand)
        .filter((b: string | undefined): b is string => !!b)
      )).sort() as string[]
      setBrands(uniqueBrands)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  // Apply filters
  const applyFilters = () => {
    let filtered = [...allProducts]

    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(keyword) ||
        (p.model && p.model.toLowerCase().includes(keyword)) ||
        (p.brand && p.brand.toLowerCase().includes(keyword))
      )
    }

    if (filterBrand) {
      filtered = filtered.filter(p => p.brand === filterBrand)
    }

    if (filterCategory) {
      filtered = filtered.filter(p => p.categoryId === filterCategory)
    }

    setProducts(filtered)
    setSelectedIds(new Set())
  }

  useEffect(() => {
    applyFilters()
  }, [filterBrand, filterCategory, searchKeyword])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(flattenCategories(data.categories || []))
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const flattenCategories = (cats: Category[], prefix = ''): Category[] => {
    return cats.flatMap((c) => [
      { ...c, name: prefix + c.name },
      ...flattenCategories((c as Category & { children?: Category[] }).children || [], prefix + c.name + ' > '),
    ])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editId ? `/api/products/${editId}` : '/api/products'
      const method = editId ? 'PUT' : 'POST'

      const payload = {
        ...formData,
        images: JSON.stringify(productImages),
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        fetchProducts()
        resetForm()
        // Clear edit mode by navigating away
        if (editId) {
          router.push('/admin/products')
        }
      } else {
        const data = await res.json()
        alert(data.error || '保存产品失败')
      }
    } catch (error) {
      console.error('Failed to save product:', error)
      alert('保存产品失败')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      model: '',
      brand: '',
      description: '',
      specifications: '',
      categoryId: categories[0]?.id || '',
      featured: false,
    })
    setProductImages([])
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImage(true)
    try {
      for (const file of Array.from(files)) {
        const formDataImg = new FormData()
        formDataImg.append('file', file)

        const res = await fetch('/api/upload/image', {
          method: 'POST',
          body: formDataImg,
        })

        if (res.ok) {
          const data = await res.json()
          setProductImages((prev) => [...prev, data.url])
        }
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
      alert('图片上传失败')
    } finally {
      setUploadingImage(false)
      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
    }
  }

  const handleDeleteImage = async (imageUrl: string) => {
    if (!confirm('确定删除这张图片吗？')) return

    // If it's an uploaded image (not external), try to delete from server
    if (imageUrl.startsWith('/uploads/')) {
      try {
        await fetch('/api/upload/image', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: imageUrl }),
        })
      } catch (error) {
        console.error('Failed to delete image from server:', error)
      }
    }

    setProductImages((prev) => prev.filter((img) => img !== imageUrl))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这个产品吗？此操作无法撤销。')) return

    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' })
      fetchProducts()
    } catch (error) {
      console.error('Failed to delete product:', error)
    }
  }

  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const handleBulkUpdateCategory = async () => {
    if (!targetCategoryId || selectedIds.size === 0) return

    if (!confirm(`将 ${selectedIds.size} 个产品移动到新分类？`)) return

    setBulkUpdating(true)
    try {
      const res = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateCategory',
          productIds: Array.from(selectedIds),
          categoryId: targetCategoryId,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        alert(`已成功将 ${data.updated} 个产品移动到 "${data.categoryName}"`)
        setSelectedIds(new Set())
        setShowCategoryModal(false)
        setTargetCategoryId('')
        fetchProducts()
      }
    } catch (error) {
      console.error('Failed to update category:', error)
      alert('更新产品失败')
    } finally {
      setBulkUpdating(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return

    if (!confirm(`删除选中的 ${selectedIds.size} 个产品吗？此操作无法撤销。`)) return

    setBulkUpdating(true)
    try {
      const res = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          productIds: Array.from(selectedIds),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        alert(`已成功删除 ${data.deleted} 个产品`)
        setSelectedIds(new Set())
        fetchProducts()
      }
    } catch (error) {
      console.error('Failed to delete products:', error)
      alert('删除产品失败')
    } finally {
      setBulkUpdating(false)
    }
  }

  const handleNewProduct = () => {
    resetForm()
    // Clear edit mode
    router.push('/admin/products')
  }

  const handleEditProduct = (product: Product) => {
    router.push(`/admin/products?edit=${product.id}`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {editId ? '编辑产品' : '产品管理'}
        </h1>
        {!editId && (
          <Button onClick={handleNewProduct}>
            添加产品
          </Button>
        )}
      </div>

      {/* Product Form - Edit Mode */}
      {editId ? (
        <Card className="mb-8">
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="产品名称 *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input
                  label="型号"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
                <Input
                  label="品牌"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分类 *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  >
                    <option value="">选择分类</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Images Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">产品图片</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {productImages.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img}
                        alt={`产品图片 ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(img)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {productImages.length === 0 && (
                    <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg text-gray-400">
                      <ImageIcon className="w-8 h-8 mr-2" />
                      <span>暂无图片</span>
                    </div>
                  )}
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingImage ? '上传中...' : '添加图片'}
                </Button>
              </div>

              <Textarea
                label="描述"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <Textarea
                label="规格参数（每行一个，格式：键: 值）"
                rows={4}
                placeholder="显示屏: 7寸 TFT
分辨率: 800x600
电压: 24V DC"
                value={formData.specifications}
                onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="featured" className="text-sm text-gray-700">
                  推荐产品
                </label>
              </div>

              <div className="flex gap-3">
                <Button type="submit" loading={saving}>
                  更新产品
                </Button>
                <Button type="button" variant="secondary" onClick={() => router.push('/admin/products')}>
                  取消
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : (
        <Card className="mb-8">
          <CardBody>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">创建新产品</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="产品名称 *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input
                  label="型号"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
                <Input
                  label="品牌"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分类 *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  >
                    <option value="">选择分类</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Images Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">产品图片</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {productImages.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img}
                        alt={`产品图片 ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(img)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingImage ? '上传中...' : '添加图片'}
                </Button>
              </div>

              <Textarea
                label="描述"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <Textarea
                label="规格参数（每行一个，格式：键: 值）"
                rows={4}
                placeholder="显示屏: 7寸 TFT
分辨率: 800x600
电压: 24V DC"
                value={formData.specifications}
                onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="featured" className="text-sm text-gray-700">
                  推荐产品
                </label>
              </div>

              <div className="flex gap-3">
                <Button type="submit" loading={saving}>
                  创建产品
                </Button>
                <Button type="button" variant="secondary" onClick={resetForm}>
                  清空表单
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Products List */}
      {!editId && (
        <Card className="mb-4">
          <CardBody>
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">关键词搜索</label>
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="搜索产品名称、型号、品牌..."
                  className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-w-[200px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">按品牌筛选</label>
                <select
                  value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-w-[160px]"
                >
                  <option value="">全部品牌</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">按分类筛选</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-w-[160px]"
                >
                  <option value="">全部分类</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              {(filterBrand || filterCategory || searchKeyword) && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setFilterBrand('')
                    setFilterCategory('')
                    setSearchKeyword('')
                  }}
                >
                  清除筛选
                </Button>
              )}
              <div className="text-sm text-gray-500 ml-auto">
                显示 {products.length} / {allProducts.length} 个产品
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          {(filterBrand || filterCategory || searchKeyword) ? (
            <>
              <p className="text-gray-500">没有符合筛选条件的产品。</p>
              <Button
                variant="secondary"
                onClick={() => {
                  setFilterBrand('')
                  setFilterCategory('')
                  setSearchKeyword('')
                }}
                className="mt-4"
              >
                清除筛选
              </Button>
            </>
          ) : (
            <>
              <p className="text-gray-500">暂无产品。</p>
              <Button onClick={handleNewProduct} className="mt-4">
                添加第一个产品
              </Button>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Bulk Action Bar */}
          {selectedIds.size > 0 && (
            <div className="bg-primary text-white px-6 py-3 rounded-lg mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-medium">已选择 {selectedIds.size} 个产品</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                  className="text-white border-white hover:bg-white/20"
                >
                  清除选择
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCategoryModal(true)}
                  className="text-white border-white hover:bg-white/20"
                >
                  <FolderTree className="w-4 h-4 mr-1" />
                  更改分类
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  删除
                </Button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={toggleSelectAll}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {selectedIds.size === products.length && products.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-primary" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">产品</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">品牌</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">推荐</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => (
                  <tr key={product.id} className={`hover:bg-gray-50 ${selectedIds.has(product.id) ? 'bg-primary/5' : ''}`}>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleSelect(product.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {selectedIds.has(product.id) ? (
                          <CheckSquare className="w-5 h-5 text-primary" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      {product.model && (
                        <p className="text-sm text-gray-500 font-mono">{product.model}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{product.brand || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{product.category.name}</td>
                    <td className="px-6 py-4">
                      {product.featured && <Badge variant="warning">推荐</Badge>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="text-sm text-primary hover:underline"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Category Change Modal */}
          {showCategoryModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowCategoryModal(false)} />
              <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">更改分类</h3>
                <p className="text-sm text-gray-600 mb-4">
                  将 {selectedIds.size} 个选中产品移动到：
                </p>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">选择分类</label>
                  <select
                    value={targetCategoryId}
                    onChange={(e) => setTargetCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">选择分类...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleBulkUpdateCategory}
                    disabled={!targetCategoryId || bulkUpdating}
                    loading={bulkUpdating}
                  >
                    <ArrowRightCircle className="w-4 h-4 mr-2" />
                    移动产品
                  </Button>
                  <Button variant="secondary" onClick={() => setShowCategoryModal(false)}>
                    取消
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-gray-500">加载中...</p>
    </div>
  )
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ProductsContent />
    </Suspense>
  )
}