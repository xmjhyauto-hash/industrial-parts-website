'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Plus, Edit2, Trash2, GripVertical, Settings, Zap, Network, Shield, Truck, Wrench, Award } from 'lucide-react'

interface Article {
  id: string
  title: string
  description: string
  icon: string
  sortOrder: number
  active: boolean
}

const ICON_OPTIONS = [
  { name: 'Settings', icon: Settings },
  { name: 'Zap', icon: Zap },
  { name: 'Network', icon: Network },
  { name: 'Shield', icon: Shield },
  { name: 'Truck', icon: Truck },
  { name: 'Wrench', icon: Wrench },
  { name: 'Award', icon: Award },
]

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: 'Settings',
    sortOrder: 0,
    active: true,
  })

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/articles')
      const data = await res.json()
      setArticles(data.articles || [])
    } catch (error) {
      console.error('Failed to fetch articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingArticle ? `/api/articles/${editingArticle.id}` : '/api/articles'
      const method = editingArticle ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        fetchArticles()
        resetForm()
      }
    } catch (error) {
      console.error('Failed to save article:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (article: Article) => {
    setFormData({
      title: article.title,
      description: article.description,
      icon: article.icon,
      sortOrder: article.sortOrder,
      active: article.active,
    })
    setEditingArticle(article)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这篇文章吗？')) return

    try {
      await fetch(`/api/articles/${id}`, { method: 'DELETE' })
      fetchArticles()
    } catch (error) {
      console.error('Failed to delete article:', error)
    }
  }

  const resetForm = () => {
    setFormData({ title: '', description: '', icon: 'Settings', sortOrder: 0, active: true })
    setEditingArticle(null)
    setShowForm(false)
  }

  const getIconComponent = (iconName: string) => {
    const found = ICON_OPTIONS.find(opt => opt.name === iconName)
    const IconComponent = found?.icon || Settings
    return <IconComponent className="w-6 h-6" />
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
        <h1 className="text-2xl font-bold text-gray-900">Why Choose Us 文章管理</h1>
        <Button onClick={() => {
          resetForm()
          setShowForm(true)
        }}>
          <Plus className="w-4 h-4 mr-2" />
          添加文章
        </Button>
      </div>

      {/* Article Form */}
      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <h2 className="font-semibold text-gray-900">
              {editingArticle ? '编辑文章' : '添加新文章'}
            </h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="标题 *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="例如：卓越品质"
                required
              />

              <Textarea
                label="描述 *"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="例如：严格的质量控制，确保每一件产品都符合国际标准"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">图标</label>
                <div className="flex flex-wrap gap-3">
                  {ICON_OPTIONS.map((opt) => {
                    const IconComponent = opt.icon
                    return (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: opt.name })}
                        className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-colors ${
                          formData.icon === opt.name
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                        title={opt.name}
                      >
                        <IconComponent className="w-6 h-6" />
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="排序"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  placeholder="数字越小越靠前"
                />
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

              <div className="flex gap-3">
                <Button type="submit" loading={saving}>
                  {editingArticle ? '更新文章' : '创建文章'}
                </Button>
                <Button type="button" variant="secondary" onClick={resetForm}>
                  取消
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Articles List */}
      {articles.length === 0 && !showForm ? (
        <Card>
          <CardBody className="text-center py-12">
            <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">暂无文章。点击"添加文章"创建一个。</p>
            <p className="text-sm text-gray-400">
              如果不添加文章，网站将显示默认的 Why Choose Us 内容。
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <Card key={article.id}>
              <CardBody>
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <GripVertical className="w-5 h-5" />
                    <span className="text-sm">#{article.sortOrder}</span>
                  </div>

                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    article.active ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {getIconComponent(article.icon)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold ${article.active ? 'text-gray-900' : 'text-gray-400'}`}>
                        {article.title}
                      </h3>
                      {!article.active && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                          已禁用
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{article.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(article)}
                      className="p-2 text-gray-400 hover:text-primary rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(article.id)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
