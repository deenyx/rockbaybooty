/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    qualities: [70, 70, 70, 75, 95],
  },
  turbopack: {
    root: __dirname,
  },
}

module.exports = nextConfig
