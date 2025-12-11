/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    staleTimes: {
      dynamic: 300, // Cache dynamic pages for 5 minutes on client
    },
  },
  // Enable standalone output for Docker deployment
  output: 'standalone',
}

export default nextConfig
