import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['exifr'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
}

export default nextConfig
