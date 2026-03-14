/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['next-cloudinary'],
  },
  images: {
    domains: ['res.cloudinary.com'],
  },
};

export default nextConfig;
