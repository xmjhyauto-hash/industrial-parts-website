'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      // Get CSRF token first
      const csrfRes = await fetch('/api/csrf')
      const csrfData = await csrfRes.json()
      const csrfToken = csrfData.csrfToken

      await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken || '',
        },
        body: JSON.stringify({ action: 'logout' }),
      })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1 text-sm text-slate-300 hover:text-white"
    >
      <LogOut className="w-4 h-4" />
      退出登录
    </button>
  )
}
