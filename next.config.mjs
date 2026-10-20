/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/imposition',
        destination: '/Impose/',
        permanent: true,
      },
      {
        source: '/imposition/:path*',
        destination: '/Impose/:path*',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    const impositionTarget =
      process.env.IMPOSITION_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_IMPOSITION_URL;

    // If an external dev server or proxy URL is explicitly configured, proxy to it.
    // Otherwise, Next.js route handler /Impose/[[...slug]] serves imposition/dist directly.
    if (!impositionTarget) {
      return [];
    }

    return [
      {
        source: '/Impose/:path*',
        destination: `${impositionTarget}/Impose/:path*`,
      },
      {
        source: '/impose/:path*',
        destination: `${impositionTarget}/Impose/:path*`,
      },
      {
        source: '/Impose',
        destination: `${impositionTarget}/Impose/`,
      },
      {
        source: '/impose',
        destination: `${impositionTarget}/Impose/`,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        child_process: false,
      };
    }
    return config;
  },
};

export default nextConfig;
