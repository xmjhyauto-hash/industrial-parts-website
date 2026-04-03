import { redirect } from 'next/navigation'
import Link from 'next/link'
import { verifySession } from '@/lib/auth'
import { LayoutDashboard, Package, FolderTree, Upload, Settings, BarChart3, MessageCircle, Image, Mail, FileText, Trash2, Users } from 'lucide-react'
import { LogoutButton } from '@/components/admin/LogoutButton'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await verifySession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <header className="bg-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/admin" className="font-bold text-lg">
              管理后台
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm text-slate-300 hover:text-white">
                查看网站
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-1">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              <LayoutDashboard className="w-5 h-5" />
              仪表盘
            </Link>
            <Link
              href="/admin/products"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              <Package className="w-5 h-5" />
              产品管理
            </Link>
            <Link
              href="/admin/categories"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              <FolderTree className="w-5 h-5" />
              分类管理
            </Link>
            <Link
              href="/admin/upload"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              <Upload className="w-5 h-5" />
              批量上传
            </Link>
            <Link
              href="/admin/analytics"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              <BarChart3 className="w-5 h-5" />
              数据分析
            </Link>
            <Link
              href="/admin/brands"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              <Image className="w-5 h-5" />
              品牌管理
            </Link>
            <Link
              href="/admin/articles"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              <FileText className="w-5 h-5" />
              Why Choose Us
            </Link>
            <Link
              href="/admin/messages"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              <MessageCircle className="w-5 h-5" />
              访客留言
            </Link>
            <Link
              href="/admin/inquiries"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              <Mail className="w-5 h-5" />
              产品询价
            </Link>
            <Link
              href="/admin/recycle-bin"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              <Trash2 className="w-5 h-5" />
              回收站
            </Link>
            <Link
              href="/admin/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              <Settings className="w-5 h-5" />
              系统设置
            </Link>
            <Link
              href="/admin/admin-users"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              <Users className="w-5 h-5" />
              管理员账号
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
