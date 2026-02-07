/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Remotion compatibility: allow .mjs imports
    config.resolve.extensions.push('.mjs');
    return config;
  },
};

export default nextConfig;
