export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb Skeleton */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-9 w-64 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-5 w-96 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Product Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border p-4">
              {/* Image Skeleton */}
              <div className="aspect-square bg-gray-200 rounded-lg mb-4 animate-pulse" />

              {/* Brand Badge Skeleton */}
              <div className="h-5 w-16 bg-gray-200 rounded mb-2 animate-pulse" />

              {/* Title Skeleton */}
              <div className="h-6 w-full bg-gray-200 rounded mb-2 animate-pulse" />
              <div className="h-6 w-3/4 bg-gray-200 rounded mb-4 animate-pulse" />

              {/* Model Skeleton */}
              <div className="h-4 w-1/2 bg-gray-200 rounded mb-4 animate-pulse" />

              {/* Button Skeleton */}
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}