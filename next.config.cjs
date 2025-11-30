/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Externalize pg and related modules to avoid webpack bundling issues
  experimental: {
    serverComponentsExternalPackages: ['pg', 'pg-pool', 'bcryptjs'],
  },
}

module.exports = nextConfig
