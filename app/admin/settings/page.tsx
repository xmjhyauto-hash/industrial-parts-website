'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Upload, X, CheckCircle, Star, Image, Type, Bell, Mail, MessageSquare, Webhook } from 'lucide-react'

interface SiteSettings {
  site_name: string
  site_logo: string
  hero_title: string
  hero_subtitle: string
  hero_image: string
  seller_email: string
  seller_phone: string
  seller_address: string
  showcase_products: string
  watermark_enabled: string
  watermark_type: string
  watermark_text: string
  watermark_image: string
  watermark_position: string
  watermark_opacity: string
  // Notification settings
  notification_email_enabled: string
  notification_email_recipients: string
  notification_sms_enabled: string
  notification_sms_webhook: string
  notification_new_message: string
  notification_new_inquiry: string
}

interface Product {
  id: string
  name: string
  model: string | null
  brand: string | null
  images: string
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>({
    site_name: '',
    site_logo: '',
    hero_title: '',
    hero_subtitle: '',
    hero_image: '',
    seller_email: '',
    seller_phone: '',
    seller_address: '',
    showcase_products: '',
    watermark_enabled: 'false',
    watermark_type: 'text',
    watermark_text: '',
    watermark_image: '',
    watermark_position: 'bottom-right',
    watermark_opacity: '0.3',
    notification_email_enabled: 'false',
    notification_email_recipients: '',
    notification_sms_enabled: 'false',
    notification_sms_webhook: '',
    notification_new_message: 'true',
    notification_new_inquiry: 'true',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [showcaseIds, setShowcaseIds] = useState<string[]>([])
  const [showcaseSearch, setShowcaseSearch] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const watermarkImageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchSettings()
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?limit=500')
      const data = await res.json()
      setAllProducts(data.products || [])
    } catch (err) {
      console.error('Failed to fetch products:', err)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      setSettings({
        site_name: data.site_name || '',
        site_logo: data.site_logo || '',
        hero_title: data.hero_title || '',
        hero_subtitle: data.hero_subtitle || '',
        hero_image: data.hero_image || '',
        seller_email: data.seller_email || '',
        seller_phone: data.seller_phone || '',
        seller_address: data.seller_address || '',
        showcase_products: data.showcase_products || '',
        watermark_enabled: data.watermark_enabled || 'false',
        watermark_type: data.watermark_type || 'text',
        watermark_text: data.watermark_text || '',
        watermark_image: data.watermark_image || '',
        watermark_position: data.watermark_position || 'bottom-right',
        watermark_opacity: data.watermark_opacity || '0.3',
        notification_email_enabled: data.notification_email_enabled || 'false',
        notification_email_recipients: data.notification_email_recipients || '',
        notification_sms_enabled: data.notification_sms_enabled || 'false',
        notification_sms_webhook: data.notification_sms_webhook || '',
        notification_new_message: data.notification_new_message || 'true',
        notification_new_inquiry: data.notification_new_inquiry || 'true',
      })
      if (data.showcase_products) {
        setShowcaseIds(data.showcase_products.split(',').filter(Boolean))
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error('Failed to save settings:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.url) {
        setSettings({ ...settings, hero_image: data.url })
      }
    } catch (err) {
      console.error('Failed to upload image:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.url) {
        setSettings({ ...settings, site_logo: data.url })
      }
    } catch (err) {
      console.error('Failed to upload logo:', err)
    } finally {
      setUploadingLogo(false)
    }
  }

  const removeHeroImage = () => {
    setSettings({ ...settings, hero_image: '' })
  }

  const removeLogo = () => {
    setSettings({ ...settings, site_logo: '' })
  }

  const handleWatermarkImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.url) {
        setSettings({ ...settings, watermark_image: data.url })
      }
    } catch (err) {
      console.error('Failed to upload watermark image:', err)
    }
  }

  const removeWatermarkImage = () => {
    setSettings({ ...settings, watermark_image: '' })
  }

  const toggleShowcaseProduct = (productId: string) => {
    let newIds: string[]
    if (showcaseIds.includes(productId)) {
      newIds = showcaseIds.filter(id => id !== productId)
    } else {
      if (showcaseIds.length >= 6) {
        alert('最多只能选择6个展示产品')
        return
      }
      newIds = [...showcaseIds, productId]
    }
    setShowcaseIds(newIds)
    setSettings({ ...settings, showcase_products: newIds.join(',') })
  }

  const showcaseProducts = allProducts.filter(p => showcaseIds.includes(p.id))

  const filteredProducts = showcaseSearch
    ? allProducts.filter(p => {
        const keyword = showcaseSearch.toLowerCase()
        return (
          p.name.toLowerCase().includes(keyword) ||
          (p.brand && p.brand.toLowerCase().includes(keyword)) ||
          (p.model && p.model.toLowerCase().includes(keyword))
        )
      })
    : allProducts

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">网站设置</h1>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">基本设置</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">公司 Logo</label>
              {settings.site_logo ? (
                <div className="relative inline-block">
                  <img
                    src={settings.site_logo}
                    alt="Logo"
                    className="h-16 w-auto object-contain border rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary cursor-pointer transition-colors"
                  onClick={() => logoInputRef.current?.click()}
                >
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">点击上传 Logo</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP (Max 5MB)</p>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={uploadingLogo}
                  />
                </div>
              )}
              {uploadingLogo && <p className="text-sm text-gray-500 mt-2">上传中...</p>}
            </div>
            <Input
              label="网站名称"
              value={settings.site_name}
              onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
              placeholder="Industrial Parts Co."
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">首页横幅区域</h2>
            <p className="text-sm text-gray-500 mt-1">
              自定义首页横幅内容
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="横幅标题"
              value={settings.hero_title}
              onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
              placeholder="Industrial Automation Components"
            />
            <Textarea
              label="横幅副标题"
              rows={3}
              value={settings.hero_subtitle}
              onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
              placeholder="Your trusted partner for industrial automation parts..."
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                背景图片（推荐：1920x600px）
              </label>
              {settings.hero_image ? (
                <div className="relative inline-block">
                  <img
                    src={settings.hero_image}
                    alt="Hero"
                    className="max-w-md rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={removeHeroImage}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary cursor-pointer transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">点击上传背景图片</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP (Max 5MB)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </div>
              )}
              {uploading && <p className="text-sm text-gray-500 mt-2">上传中...</p>}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">产品橱窗</h2>
            <p className="text-sm text-gray-500 mt-1">
              选择最多6个产品在首页展示
            </p>
          </CardHeader>
          <CardBody>
            {/* Selected Products */}
            {showcaseProducts.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">已选产品（{showcaseProducts.length}/6）：</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {showcaseProducts.map(product => {
                    let images: string[] = []
                    try { images = JSON.parse(product.images || '[]') } catch {}
                    return (
                      <div key={product.id} className="relative border rounded-lg p-2 bg-gray-50">
                        <button
                          type="button"
                          onClick={() => toggleShowcaseProduct(product.id)}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 z-10"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {images[0] ? (
                          <img src={images[0]} alt={product.name} className="w-full h-20 object-cover rounded mb-2" />
                        ) : (
                          <div className="w-full h-20 bg-gray-200 rounded mb-2 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">无图片</span>
                          </div>
                        )}
                        <p className="text-xs font-medium text-gray-700 truncate">{product.name}</p>
                        {product.brand && <p className="text-xs text-gray-500">{product.brand}</p>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Product Selection */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <p className="text-sm font-medium text-gray-700">选择产品：</p>
                <input
                  type="text"
                  value={showcaseSearch}
                  onChange={(e) => setShowcaseSearch(e.target.value)}
                  placeholder="搜索产品名称、品牌、型号..."
                  className="flex-1 px-3 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div className="border rounded-lg p-3 max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {filteredProducts.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">没有找到匹配的产品</p>
                  ) : (
                    filteredProducts.map(product => {
                      let images: string[] = []
                      try { images = JSON.parse(product.images || '[]') } catch {}
                      const isSelected = showcaseIds.includes(product.id)
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => toggleShowcaseProduct(product.id)}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                            isSelected ? 'bg-primary/10 border border-primary' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                            isSelected ? 'bg-primary border-primary' : 'border-gray-300'
                          }`}>
                            {isSelected && <Star className="w-3 h-3 text-white fill-white" />}
                          </div>
                          {images[0] ? (
                            <img src={images[0]} alt={product.name} className="w-10 h-10 object-cover rounded" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                              <span className="text-gray-400 text-xs">无</span>
                            </div>
                          )}
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-gray-700">{product.name}</p>
                            {product.brand && <p className="text-xs text-gray-500">{product.brand}</p>}
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">卖家联系信息</h2>
            <p className="text-sm text-gray-500 mt-1">
              此信息显示在产品页面供客户询价使用。
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="邮箱"
              type="email"
              value={settings.seller_email}
              onChange={(e) => setSettings({ ...settings, seller_email: e.target.value })}
              placeholder="sales@example.com"
              required
            />
            <Input
              label="电话"
              type="tel"
              value={settings.seller_phone}
              onChange={(e) => setSettings({ ...settings, seller_phone: e.target.value })}
              placeholder="+65 1234 5678"
            />
            <Input
              label="地址"
              value={settings.seller_address}
              onChange={(e) => setSettings({ ...settings, seller_address: e.target.value })}
              placeholder="Singapore"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">图片水印设置</h2>
            <p className="text-sm text-gray-500 mt-1">
              上传的图片将自动添加水印（压缩和水印仅对新上传的图片生效）
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.watermark_enabled === 'true'}
                  onChange={(e) => setSettings({
                    ...settings,
                    watermark_enabled: e.target.checked ? 'true' : 'false'
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
              <span className="text-sm font-medium text-gray-700">
                {settings.watermark_enabled === 'true' ? '已启用' : '已禁用'}
              </span>
            </div>

            {settings.watermark_enabled === 'true' && (
              <>
                {/* Watermark Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">水印类型</label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, watermark_type: 'text' })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                        settings.watermark_type === 'text'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Type className="w-4 h-4" />
                      文字水印
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, watermark_type: 'image' })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                        settings.watermark_type === 'image'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Image className="w-4 h-4" />
                      图片水印
                    </button>
                  </div>
                </div>

                {/* Text Watermark Input */}
                {settings.watermark_type === 'text' && (
                  <Input
                    label="水印文字"
                    value={settings.watermark_text}
                    onChange={(e) => setSettings({ ...settings, watermark_text: e.target.value })}
                    placeholder="请输入水印文字"
                  />
                )}

                {/* Image Watermark Upload */}
                {settings.watermark_type === 'image' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">水印图片</label>
                    {settings.watermark_image ? (
                      <div className="relative inline-block">
                        <img
                          src={settings.watermark_image}
                          alt="Watermark"
                          className="h-20 w-auto object-contain border rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={removeWatermarkImage}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary cursor-pointer transition-colors"
                        onClick={() => watermarkImageInputRef.current?.click()}
                      >
                        <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">点击上传水印图片</p>
                        <p className="text-xs text-gray-400 mt-1">PNG with transparency recommended</p>
                        <input
                          ref={watermarkImageInputRef}
                          type="file"
                          accept="image/png,image/svg+xml"
                          onChange={handleWatermarkImageUpload}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Position Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">水印位置</label>
                  <div className="grid grid-cols-3 gap-2 w-max">
                    {[
                      { value: 'top-left', label: '左上' },
                      { value: 'top-right', label: '右上' },
                      { value: 'center', label: '居中' },
                      { value: 'bottom-left', label: '左下' },
                      { value: 'bottom-right', label: '右下' },
                    ].map((pos) => (
                      <button
                        key={pos.value}
                        type="button"
                        onClick={() => setSettings({ ...settings, watermark_position: pos.value })}
                        className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                          settings.watermark_position === pos.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Opacity Slider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    透明度: {Math.round(parseFloat(settings.watermark_opacity || '0.3') * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.9"
                    step="0.1"
                    value={settings.watermark_opacity || '0.3'}
                    onChange={(e) => setSettings({ ...settings, watermark_opacity: e.target.value })}
                    className="w-64"
                  />
                </div>
              </>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">消息提醒设置</h2>
            <p className="text-sm text-gray-500 mt-1">
              当有新留言或询价时，发送邮件或短信通知
            </p>
          </CardHeader>
          <CardBody className="space-y-6">
            {/* Event Triggers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">通知触发条件</label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notification_new_message === 'true'}
                    onChange={(e) => setSettings({
                      ...settings,
                      notification_new_message: e.target.checked ? 'true' : 'false'
                    })}
                    className="w-4 h-4 rounded text-primary"
                  />
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">新访客留言</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notification_new_inquiry === 'true'}
                    onChange={(e) => setSettings({
                      ...settings,
                      notification_new_inquiry: e.target.checked ? 'true' : 'false'
                    })}
                    className="w-4 h-4 rounded text-primary"
                  />
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">新产品询价</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Email Notification */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">邮件通知</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notification_email_enabled === 'true'}
                    onChange={(e) => setSettings({
                      ...settings,
                      notification_email_enabled: e.target.checked ? 'true' : 'false'
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {settings.notification_email_enabled === 'true' && (
                <div className="space-y-4">
                  <Input
                    label="收件邮箱"
                    value={settings.notification_email_recipients}
                    onChange={(e) => setSettings({
                      ...settings,
                      notification_email_recipients: e.target.value
                    })}
                    placeholder="sales@example.com, admin@example.com"
                  />
                  <p className="text-xs text-gray-500 -mt-2">
                    多个邮箱请用英文逗号分隔
                  </p>
                </div>
              )}
            </div>

            {/* SMS Notification */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Webhook className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">短信通知 (Webhooks)</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notification_sms_enabled === 'true'}
                    onChange={(e) => setSettings({
                      ...settings,
                      notification_sms_enabled: e.target.checked ? 'true' : 'false'
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {settings.notification_sms_enabled === 'true' && (
                <div className="space-y-4">
                  <Input
                    label="Webhook URL"
                    value={settings.notification_sms_webhook}
                    onChange={(e) => setSettings({
                      ...settings,
                      notification_sms_webhook: e.target.value
                    })}
                    placeholder="https://api.smsprovider.com/send"
                  />
                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                    <p className="font-medium text-gray-700 mb-1">支持的 SMS Webhook 格式：</p>
                    <p>POST 请求，JSON body: {"{ \"message\": \"短信内容\" }"}</p>
                    <p className="mt-1">支持 Twilio、Nexmo、阿里云短信等 webhook 格式</p>
                  </div>
                </div>
              )}
            </div>

            {/* SMTP Note */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">邮件发送说明</p>
                  <p className="mt-1 text-blue-600">
                    邮件通过环境变量配置的 SMTP 服务器发送。请在 <code className="bg-blue-100 px-1 rounded">.env</code> 文件中设置：
                  </p>
                  <div className="mt-2 bg-blue-100 rounded p-2 font-mono text-xs">
                    <p>SMTP_HOST=smtp.example.com</p>
                    <p>SMTP_PORT=587</p>
                    <p>SMTP_SECURE=false</p>
                    <p>SMTP_USER=your@email.com</p>
                    <p>SMTP_PASS=your-password</p>
                    <p>SMTP_FROM=noreply@example.com</p>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" loading={saving}>
            保存设置
          </Button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              设置保存成功！
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
