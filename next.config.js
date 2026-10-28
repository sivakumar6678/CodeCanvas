/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Enable modern image formats (WebP/AVIF) for the built-in Image Optimizer.
  // PNG/JPEG originals from /public are served as WebP or AVIF to supporting
  // browsers, cutting the logo and icon payload by 50-80%.
  images: {
    formats: ['image/avif', 'image/webp'],
    // Preserve existing remote patterns if any were already declared
    remotePatterns: [],
  },
};

export default nextConfig;
