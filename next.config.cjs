/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Externalize native modules that can't be bundled by webpack
  serverExternalPackages: ['pg', 'pg-native', 'pg-pool', 'bcryptjs'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent pg and related modules from being bundled
      config.externals = [...(config.externals || []), 'pg', 'pg-native', 'pg-pool'];
    }
    return config;
  },
}

module.exports = nextConfig
