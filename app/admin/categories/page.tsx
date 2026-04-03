'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Card, CardBody } from '@/components/ui/Card'
import { Image, X, ArrowUp, ArrowDown } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  parentId: string | null
  showInMenu: boolean
  sortOrder: number
  children: Category[]
  _count: { products: number }
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: '',
    image: '',
    showInMenu: true,
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const flattenCategories = (cats: Category[], prefix = ''): { id: string; name: string }[] => {
    return cats.flatMap((c) => [
      { id: c.id, name: prefix + c.name },
      ...flattenCategories(c.children, prefix + c.name + ' > '),
    ])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingId ? `/api/categories/${editingId}` : '/api/categories'
      const method = editingId ? 'PUT' : 'POST'

      const payload = {
        ...formData,
        showInMenu: formData.showInMenu === true,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        fetchCategories()
        setShowForm(false)
        setFormData({ name: '', description: '', parentId: '', image: '', showInMenu: true })
        setEditingId(null)
      } else {
        const data = await res.json()
        alert(data.error || '保存失败')
      }
    } catch (error) {
      console.error('Failed to save category:', error)
      alert('保存失败：网络错误')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      parentId: category.parentId || '',
      image: category.image || '',
      showInMenu: category.showInMenu ?? true,
    })
    setEditingId(category.id)
    setShowForm(true)
  }

  const handle删除 = async (id: string) => {
    if (!confirm('确定删除吗？此分类下的产品也将被删除。')) return

    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      fetchCategories()
    } catch (error) {
      console.error('Failed to delete category:', error)
    }
  }

  const toggleMenuVisibility = async (id: string, currentShow: boolean) => {
    try {
      // Get current category data first
      const res = await fetch(`/api/categories/${id}`)
      if (!res.ok) return
      const data = await res.json()
      const category = data.category

      // Update with toggled showInMenu
      await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: category.name,
          description: category.description,
          parentId: category.parentId,
          image: category.image,
          showInMenu: !currentShow,
        }),
      })
      fetchCategories()
    } catch (error) {
      console.error('Failed to toggle menu visibility:', error)
    }
  }

  // Move category up in sort order
  const moveUp = async (index: number) => {
    if (index === 0) return
    const newCategories = [...categories]

    // Create a new ordered array with current category moved up
    const updated = [...newCategories]
    const [removed] = updated.splice(index, 1)
    updated.splice(index - 1, 0, removed)

    // Assign new sortOrder based on array index
    const updates = updated.map((cat, i) => ({
      id: cat.id,
      sortOrder: i * 10, // Use steps of 10 to leave room for future adjustments
    }))

    try {
      const res = await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: updates }),
      })
      if (res.ok) {
        fetchCategories()
      } else {
        const data = await res.json()
        alert(data.error || '移动失败')
      }
    } catch (error) {
      console.error('Failed to move category up:', error)
      alert('移动失败：网络错误')
    }
  }

  // Move category down in sort order
  const moveDown = async (index: number) => {
    if (index === categories.length - 1) return
    const newCategories = [...categories]

    // Create a new ordered array with current category moved down
    const updated = [...newCategories]
    const [removed] = updated.splice(index, 1)
    updated.splice(index + 1, 0, removed)

    // Assign new sortOrder based on array index
    const updates = updated.map((cat, i) => ({
      id: cat.id,
      sortOrder: i * 10, // Use steps of 10 to leave room for future adjustments
    }))

    try {
      const res = await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: updates }),
      })
      if (res.ok) {
        fetchCategories()
      } else {
        const data = await res.json()
        alert(data.error || '移动失败')
      }
    } catch (error) {
      console.error('Failed to move category down:', error)
      alert('移动失败：网络错误')
    }
  }

  const allCategories = flattenCategories(categories)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">分类管理</h1>
        <Button onClick={() => {
          setFormData({ name: '', description: '', parentId: '', image: '', showInMenu: true })
          setEditingId(null)
          setShowForm(true)
        }}>
          添加分类
        </Button>
      </div>

      {/* Category Form */}
      {showForm && (
        <Card className="mb-8">
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="分类名称 *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <Textarea
                label="描述"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类图片（图标替换）</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors">
                    <Image className="w-4 h-4" />
                    <span className="text-sm">上传图片</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          setFormData({ ...formData, image: reader.result as string })
                        }
                        reader.readAsDataURL(file)
                      }}
                      className="hidden"
                    />
                  </label>
                  {formData.image && (
                    <div className="relative inline-block">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="h-12 w-12 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image: '' })}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">上传图片以替换此分类的默认图标</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">父分类</label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">无（顶级）</option>
                  {allCategories
                    .filter((c) => c.id !== editingId)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="showInMenu"
                  checked={formData.showInMenu}
                  onChange={(e) => setFormData({ ...formData, showInMenu: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="showInMenu" className="text-sm text-gray-700">
                  显示在网站导航菜单
                </label>
              </div>

              <div className="flex gap-3">
                <Button type="submit" loading={saving}>
                  {editingId ? '更新分类' : '创建分类'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                  取消
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Categories List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500">暂无分类。</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg border p-3 mb-4">
            <p className="text-sm text-gray-600">
              <strong>提示：</strong>使用向上/向下箭头调整分类在网站导航菜单中的显示顺序
            </p>
          </div>
          {categories.map((category, index) => (
            <div key={category.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className={`p-1 rounded hover:bg-gray-100 ${index === 0 ? 'text-gray-300' : 'text-gray-500'}`}
                      title="向上移动"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === categories.length - 1}
                      className={`p-1 rounded hover:bg-gray-100 ${index === categories.length - 1 ? 'text-gray-300' : 'text-gray-500'}`}
                      title="向下移动"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {category._count.products} 个产品
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => toggleMenuVisibility(category.id, category.showInMenu)}
                    className={`text-xs px-2 py-1 rounded ${category.showInMenu ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                    title={category.showInMenu ? '点击隐藏' : '点击显示'}
                  >
                    {category.showInMenu ? '菜单中' : '已隐藏'}
                  </button>
                  <button
                    onClick={() => handleEdit(category)}
                    className="text-sm text-primary hover:underline"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handle删除(category.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    删除
                  </button>
                </div>
              </div>

              {/* Subcategories */}
              {category.children.length > 0 && (
                <div className="mt-4 pl-4 border-l-2 border-gray-100 space-y-3">
                  {category.children.map((child) => (
                    <div key={child.id} className="flex items-center justify-between bg-gray-50 rounded p-3">
                      <div>
                        <span className="font-medium text-gray-700">{child.name}</span>
                        <span className="text-xs text-gray-400 ml-2">
                          ({child._count.products} 个产品)
                        </span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => toggleMenuVisibility(child.id, child.showInMenu)}
                          className={`text-xs px-2 py-1 rounded ${child.showInMenu ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                          title={child.showInMenu ? '点击隐藏' : '点击显示'}
                        >
                          {child.showInMenu ? '菜单中' : '已隐藏'}
                        </button>
                        <button
                          onClick={() => handleEdit(child)}
                          className="text-sm text-primary hover:underline"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handle删除(child.id)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
