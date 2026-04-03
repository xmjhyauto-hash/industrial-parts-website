/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove powered by header
  poweredByHeader: false,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Security headers are handled by middleware.ts
  // But we can also add some here for extra protection

  output: 'standalone',

  // Experimental features for security
  experimental: {
    // Enable strict mode for better security
    typedRoutes: false,
  },

  // Webpack configuration for security
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent server code from being bundled into client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
