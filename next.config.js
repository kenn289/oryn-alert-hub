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
        source: '/api/ai/:path*',
        destination: `${backendUrl}/api/ai/:path*`
      }
    ]
  }
};

module.exports = nextConfig;