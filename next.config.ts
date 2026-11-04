/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,

  // Hugeicons ships ~6,000 icons behind one barrel file and isn't in Next's
  // default list, so without this every icon import pulls in the whole package.
  experimental: {
    optimizePackageImports: ["@hugeicons/core-free-icons"],
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "**",
      },
    ],
  },
};

export default nextConfig;