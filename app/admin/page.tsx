import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Package, FolderTree, Upload, ArrowRight, MessageCircle, Mail } from 'lucide-react'

export default async function AdminDashboard() {
  // Fetch basic counts first
  const [productCount, categoryCount, recentProducts] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.product.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { name: true } },
      },
    }),
  ])

  // Try to fetch message and inquiry counts, fall back to 0 if tables don't exist
  let newMessagesCount = 0
  let newInquiriesCount = 0

  try {
    newMessagesCount = await prisma.visitorMessage.count({ where: { status: 'new' } })
  } catch {
    // Table might not exist yet
  }

  try {
    newInquiriesCount = await prisma.inquiry.count({ where: { status: 'new' } })
  } catch {
    // Table might not exist yet
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">仪表盘</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">产品总数</p>
              <p className="text-3xl font-bold text-gray-900">{productCount}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">分类总数</p>
              <p className="text-3xl font-bold text-gray-900">{categoryCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FolderTree className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <Link
          href="/admin/messages"
          className="bg-white rounded-xl border p-6 hover:border-primary transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">访客留言</p>
              <p className="text-3xl font-bold text-gray-900">{newMessagesCount}</p>
              {newMessagesCount > 0 && (
                <p className="text-xs text-blue-600">条新留言</p>
              )}
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Link>

        <Link
          href="/admin/inquiries"
          className="bg-white rounded-xl border p-6 hover:border-primary transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">产品询价</p>
              <p className="text-3xl font-bold text-gray-900">{newInquiriesCount}</p>
              {newInquiriesCount > 0 && (
                <p className="text-xs text-blue-600">条新询价</p>
              )}
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Products */}
      <div className="bg-white rounded-xl border">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">最近添加的产品</h2>
          <Link href="/admin/products" className="text-sm text-primary hover:underline flex items-center gap-1">
            查看全部
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="divide-y">
          {recentProducts.length > 0 ? (
            recentProducts.map((product) => (
              <div key={product.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.category.name}</p>
                </div>
                <Link
                  href={`/admin/products?edit=${product.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  编辑
                </Link>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              暂无产品 <Link href="/admin/upload" className="text-primary hover:underline">添加第一个产品</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
