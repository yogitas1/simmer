/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase body size limit for video uploads
  experimental: {
    // Allow server routes to use native node packages
    serverComponentsExternalPackages: ["fluent-ffmpeg", "@ffmpeg-installer/ffmpeg"],
  },

  // External image/video domains (add your Vercel Blob hostname here)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
