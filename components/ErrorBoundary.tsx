'use client'

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: string | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      errorInfo: errorInfo.componentStack || null,
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center px-4 py-16 bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-xl border border-red-200 shadow-lg overflow-hidden">
            {/* Error Header */}
            <div className="bg-red-50 border-b border-red-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
                  <p className="text-sm text-red-600">An error occurred while loading this content</p>
                </div>
              </div>
            </div>

            {/* Error Details (collapsible in production) */}
            <div className="px-6 py-4">
              {this.state.error && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Error message:</p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg font-mono break-all">
                    {process.env.NODE_ENV === 'development'
                      ? this.state.error.message
                      : 'An unexpected error occurred. Please try again.'}
                  </p>
                </div>
              )}

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Component Stack:</p>
                  <pre className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg overflow-auto max-h-32 whitespace-pre-wrap">
                    {this.state.errorInfo}
                  </pre>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <Button
                onClick={this.handleReset}
                variant="primary"
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Simple wrapper component for use in layouts
interface ErrorBoundaryWrapperProps {
  children: ReactNode
}

export function ErrorBoundaryWrapper({ children }: ErrorBoundaryWrapperProps) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}