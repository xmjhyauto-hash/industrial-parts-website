'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Upload, FileSpreadsheet, FolderOpen, CheckCircle, XCircle, AlertCircle, Globe } from 'lucide-react'

interface UploadResult {
  success: string[]
  errors: { product: string; error: string }[]
  autoFetch?: {
    total: number
    enriched: number
    notFound: number
    skipped: number
    failed: number
  }
}

type TabType = 'folder' | 'excel'

export default function AdminUploadPage() {
  const [activeTab, setActiveTab] = useState<TabType>('folder')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedExcel, setSelectedExcel] = useState<File | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [autoFetch, setAutoFetch] = useState(false)

  const isMounted = useRef(true)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const excelInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  // Folder Upload Handler
  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('请上传 ZIP 文件')
      return
    }

    setUploading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('autoFetch', autoFetch ? 'true' : 'false')

    let response
    try {
      response = await fetch('/api/upload/folder', {
        method: 'POST',
        body: formData,
      })
    } catch (err) {
      console.error('Network error:', err)
      setError('网络错误：无法连接到服务器')
      setUploading(false)
      return
    }

    console.log('Response status:', response.status)

    let data
    try {
      data = await response.json()
      console.log('Response data:', data)
    } catch {
      console.error('Failed to parse JSON')
      setError('服务器响应无效')
      setUploading(false)
      return
    }

    if (!isMounted.current) return

    console.log('Full response data:', JSON.stringify(data, null, 2))
    console.log('Results object:', data.results)
    console.log('autoFetch in results:', data.results?.autoFetch)

    if (response.ok) {
      setResult(data.results || data)
    } else {
      setError(data.error || '上传失败')
    }

    setUploading(false)
  }

  // Excel Upload Handler
  const handleExcelUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedExcel) {
      setError('请选择 Excel 文件')
      return
    }

    setUploading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('excel', selectedExcel)
    if (selectedImage) {
      formData.append('image', selectedImage)
    }
    formData.append('autoFetch', autoFetch ? 'true' : 'false')

    console.log('Excel upload started, autoFetch:', autoFetch)

    let response
    try {
      response = await fetch('/api/upload/excel', {
        method: 'POST',
        body: formData,
      })
    } catch (err) {
      console.error('Excel upload network error:', err)
      setError('网络错误：无法连接到服务器')
      setUploading(false)
      return
    }

    console.log('Excel upload response status:', response.status)

    let data
    try {
      data = await response.json()
      console.log('Excel upload response data:', data)
    } catch {
      console.error('Excel upload failed to parse JSON')
      setError('服务器响应无效')
      setUploading(false)
      return
    }

    if (!isMounted.current) {
      console.log('Component unmounted, skipping state update')
      return
    }

    if (response.ok) {
      setResult(data.results || data)
      setSelectedExcel(null)
      setSelectedImage(null)
      if (excelInputRef.current) excelInputRef.current.value = ''
      if (imageInputRef.current) imageInputRef.current.value = ''
    } else {
      setError(data.error || '上传失败')
    }

    setUploading(false)
  }

  const TabButton = ({ tab, icon: Icon, label }: { tab: TabType; icon: React.ElementType; label: string }) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors ${
        activeTab === tab ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">批量上传</h1>

      <div className="flex gap-4 mb-8">
        <TabButton tab="folder" icon={FolderOpen} label="文件夹上传 (ZIP)" />
        <TabButton tab="excel" icon={FileSpreadsheet} label="Excel 上传" />
      </div>

      {/* Folder Upload Tab */}
      {activeTab === 'folder' && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">ZIP 文件夹上传</h2>
            <p className="text-sm text-gray-500 mt-1">ZIP文件名=分类名，子文件夹=产品名</p>
          </CardHeader>
          <CardBody>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
              onClick={() => folderInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700 font-medium">点击上传 ZIP 文件</p>
              <p className="text-sm text-gray-500 mt-2">ZIP文件名=分类名，子文件夹=产品名</p>
              <input ref={folderInputRef} type="file" accept=".zip" onChange={handleFolderUpload} className="hidden" />
            </div>

            {/* Auto-fetch Toggle */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mt-4">
              <input
                type="checkbox"
                id="autoFetchFolder"
                checked={autoFetch}
                onChange={(e) => setAutoFetch(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <label htmlFor="autoFetchFolder" className="font-medium text-blue-900 cursor-pointer">
                  <Globe className="w-4 h-4 inline-block mr-1" />
                  自动从型号获取SEO数据
                </label>
                <p className="text-sm text-blue-700 mt-1">
                  在线搜索产品规格并生成元标签。每个产品约需2秒。
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <h3 className="font-medium text-gray-900 mb-2">预期结构：</h3>
              <pre className="text-sm text-gray-600 font-mono">{`SIEMENS.zip（分类）
├── 6AV7704-0BB10/（产品）
│   ├── photo1.jpg
└── SIMATIC-S7-1200/（产品）
    └── photo.jpg`}</pre>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Excel Upload Tab */}
      {activeTab === 'excel' && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Excel 上传</h2>
            <p className="text-sm text-gray-500 mt-1">Excel文件名=分类名，自动匹配或创建分类</p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleExcelUpload} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Excel 文件 *</label>
                <input
                  ref={excelInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setSelectedExcel(e.target.files?.[0] || null)}
                  className="block w-full max-w-md text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
                />
                {selectedExcel && (
                  <p className="text-xs text-green-600 mt-1">
                    已选择： {selectedExcel.name}
                    <br />
                    <span className="text-gray-500">将创建分类：{selectedExcel.name.replace(/\.(xlsx|xls)$/i, '')}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">产品图片（可选）</label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                  className="block w-full max-w-md text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
                {selectedImage && <p className="text-xs text-green-600 mt-1">已选择： {selectedImage.name}</p>}
              </div>

              {/* Auto-fetch Toggle */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <input
                  type="checkbox"
                  id="autoFetchExcel"
                  checked={autoFetch}
                  onChange={(e) => setAutoFetch(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <label htmlFor="autoFetchExcel" className="font-medium text-blue-900 cursor-pointer">
                    <Globe className="w-4 h-4 inline-block mr-1" />
                    自动从型号获取SEO数据
                  </label>
                  <p className="text-sm text-blue-700 mt-1">
                    在线搜索产品规格并生成元标签。每个产品约需2秒。
                  </p>
                </div>
              </div>

              <Button type="submit" disabled={!selectedExcel || uploading} loading={uploading}>
                <Upload className="w-4 h-4 mr-2" />
                上传产品
              </Button>
            </form>

            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <h3 className="font-medium text-gray-900 mb-2">Excel 格式：</h3>
              <pre className="text-sm text-gray-600 font-mono">{`| 序号 | 产品名称 | 型号 | 品牌 | 规格参数 | 描述 |
| 1   | HMI Panel | 6AV7704... | SIEMENS | 7" TFT | Industrial |`}</pre>
              <p className="text-xs text-gray-500 mt-2">Excel文件名即为分类名，如 SIEMENS.xlsx 会创建/匹配 "SIEMENS" 分类</p>
            </div>
          </CardBody>
        </Card>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">错误</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-4">
          {result.success.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="font-medium text-green-800">已创建 {result.success.length} 个产品</p>
              </div>
              <ul className="text-sm text-green-700 ml-7 space-y-1">
                {result.success.map((name, idx) => <li key={idx}>{name}</li>)}
              </ul>
            </div>
          )}
          {result.errors.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <p className="font-medium text-amber-800">{result.errors.length} 个产品失败</p>
              </div>
              <ul className="text-sm text-amber-700 ml-7 space-y-1">
                {result.errors.map((err, idx) => (
                  <li key={idx}><span className="font-medium">{err.product}:</span> {err.error}</li>
                ))}
              </ul>
            </div>
          )}
          {result.autoFetch && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-5 h-5 text-purple-500" />
                <p className="font-medium text-purple-800">SEO 自动获取结果</p>
              </div>
              <div className="text-sm text-purple-700 ml-7 space-y-1">
                <p>处理的产品总数：{result.autoFetch.total}</p>
                <p>生成的SEO内容：{result.autoFetch.enriched}</p>
                <p>在线未找到：{result.autoFetch.notFound}</p>
                <p>跳过（无型号/已有元数据）：{result.autoFetch.skipped}</p>
                {result.autoFetch.failed > 0 && (
                  <p className="text-red-600">失败：{result.autoFetch.failed}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
