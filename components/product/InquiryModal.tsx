'use client'

import { useState, useEffect } from 'react'
import { X, Mail, Send, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface InquiryModalProps {
  isOpen: boolean
  onClose: () => void
  product: {
    id: string
    name: string
    model?: string | null
    brand?: string | null
  }
}

export function InquiryModal({ isOpen, onClose, product }: InquiryModalProps) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formCreatedAt] = useState(Date.now())

  // Honeypot field - hidden from users, bots might fill it
  const [honeypot, setHoneypot] = useState('')

  if (!isOpen) return null

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required')
      return
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address')
      return
    }
    setEmailError('')

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          productModel: product.model,
          productBrand: product.brand,
          customerEmail: email,
          customerMessage: message,
          formCreatedAt,
          website: honeypot, // Honeypot field
        }),
      })

      if (response.ok) {
        setIsSuccess(true)
        setEmail('')
        setMessage('')
        setTimeout(() => {
          onClose()
          setIsSuccess(false)
        }, 2000)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to submit inquiry. Please try again.')
      }
    } catch (error) {
      alert('Failed to submit inquiry. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Inquire About Product</h2>
            <p className="text-sm text-gray-500 mt-0.5">{product.name}</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {isSuccess ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Inquiry Sent!</h3>
              <p className="text-gray-500">We will get back to you soon.</p>
            </div>
          ) : (
            <>
              {/* Product Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  {product.brand && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                      {product.brand}
                    </span>
                  )}
                </div>
                <p className="font-medium text-gray-900">{product.name}</p>
                {product.model && (
                  <p className="font-mono text-sm text-gray-500 mt-1">Model: {product.model}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="mb-4">
                <Input
                  id="email"
                  type="email"
                  label="Email *"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={emailError}
                  disabled={isSubmitting}
                />
              </div>

              {/* Message Field */}
              <div className="mb-6">
                <Textarea
                  id="message"
                  label="Your Requirements (Optional)"
                  placeholder="Please let us know your requirements, quantity needed, intended application, etc. We will respond within 24 hours."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>

              {/* Honeypot - hidden from users, bots might fill it */}
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="absolute opacity-0 pointer-events-none"
                tabIndex={-1}
                autoComplete="off"
              />

              {/* Submit Button */}
              <Button
                type="submit"
                variant="accent"
                size="lg"
                className="w-full"
                loading={isSubmitting}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Inquiry
              </Button>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
