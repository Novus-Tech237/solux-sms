/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['next-cloudinary'],
  },
  images: {
    domains: ['res.cloudinary.com', 'img.clerk.com'],
  },
};

export default nextConfig;