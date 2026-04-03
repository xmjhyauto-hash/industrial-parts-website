'use client'

import { useState } from 'react'
import { Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { InquiryModal } from '@/components/product/InquiryModal'

interface ProductInquirySectionProps {
  product: {
    id: string
    name: string
    model?: string | null
    brand?: string | null
  }
  sellerEmail?: string | null
  sellerPhone?: string | null
}

export function ProductInquirySection({
  product,
  sellerEmail,
  sellerPhone,
}: ProductInquirySectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Price</h3>
        <p className="text-2xl font-bold text-gray-900 mb-4">Contact for Pricing</p>
        <Button
          variant="accent"
          size="lg"
          className="w-full"
          onClick={() => setIsModalOpen(true)}
        >
          <Mail className="w-5 h-5 mr-2" />
          Inquire Now
        </Button>
      </div>

      {/* Contact Info */}
      <div className="space-y-3 text-sm">
        <h3 className="font-semibold text-gray-900">Contact Seller</h3>
        {sellerEmail && (
          <a
            href={`mailto:${sellerEmail}`}
            className="flex items-center gap-2 text-gray-600 hover:text-primary"
          >
            <Mail className="w-4 h-4" />
            {sellerEmail}
          </a>
        )}
        {sellerPhone && (
          <a
            href={`tel:${sellerPhone}`}
            className="flex items-center gap-2 text-gray-600 hover:text-primary"
          >
            <Phone className="w-4 h-4" />
            {sellerPhone}
          </a>
        )}
      </div>

      {/* Inquiry Modal */}
      <InquiryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
      />
    </>
  )
}