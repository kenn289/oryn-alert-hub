/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@supabase/supabase-js'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    // Use environment variable for backend URL in production
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3002';
    
    return [
      {
        source: '/api/stock/:path*',
        destination: `${backendUrl}/api/stock/:path*`
      },
      {
        source: '/api/support/:path*',
        destination: `${backendUrl}/api/support/:path*`
      },
      {
        source: '/api/portfolio',
        destination: `${backendUrl}/api/portfolio`
      },
      {
        source: '/api/watchlist',
        destination: `${backendUrl}/api/watchlist`
      },
      {
        source: '/api/health',
        destination: `${backendUrl}/api/health`
      }
    ]
  }
};

module.exports = nextConfig;