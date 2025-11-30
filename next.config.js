/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Externalize native modules that can't be bundled by Turbopack/webpack
  serverExternalPackages: ['pg', 'pg-native', 'pg-pool', 'bcryptjs'],
  // Empty turbopack config to silence Next.js 16 warning
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent pg and related modules from being bundled
      config.externals = [...(config.externals || []), 'pg', 'pg-native', 'pg-pool'];
    }
    return config;
  },
}

export default nextConfig;
