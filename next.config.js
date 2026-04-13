/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Enables src/instrumentation.ts for startup environment validation.
    // Stabilized in Next.js 14.2+; the flag is a no-op on newer versions.
    instrumentationHook: true,
  },
}

module.exports = nextConfig
