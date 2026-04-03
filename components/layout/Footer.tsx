'use client'

import Link from 'next/link'
import { Mail, Phone, MapPin } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'
import { useState, useEffect } from 'react'

interface Settings {
  site_name?: string
  seller_email?: string
  seller_phone?: string
  seller_address?: string
}

export function Footer() {
  const { t } = useLanguage()
  const currentYear = new Date().getFullYear()
  const [settings, setSettings] = useState<Settings>({})

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setSettings(data)
        }
      })
      .catch(console.error)
  }, [])

  return (
    <footer className="bg-slate-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="font-bold text-lg mb-4">{settings.site_name || 'Industrial Parts Co.'}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              {t('footer.description')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-slate-400 hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/search" className="text-slate-400 hover:text-white transition-colors">All Products</Link></li>
              <li><Link href="/admin" className="text-slate-400 hover:text-white transition-colors">Admin Portal</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold mb-4">{t('footer.categories')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/category/automation-control" className="text-slate-400 hover:text-white transition-colors">Automation Control</Link></li>
              <li><Link href="/category/plc-controllers" className="text-slate-400 hover:text-white transition-colors">PLC & Controllers</Link></li>
              <li><Link href="/category/hmi-displays" className="text-slate-400 hover:text-white transition-colors">HMI & Displays</Link></li>
              <li><Link href="/category/sensors" className="text-slate-400 hover:text-white transition-colors">Sensors</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">{t('footer.contact')}</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{settings.seller_email || 'sales@example.com'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{settings.seller_phone || '+65 1234 5678'}</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{settings.seller_address || 'Singapore'}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700 mt-8 pt-8 text-center text-sm text-slate-400">
          <p>&copy; {currentYear} {settings.site_name || 'Industrial Parts Co.'} {t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  )
}
