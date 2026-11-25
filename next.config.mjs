/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/forum/:path*',
        destination: '/community',
        permanent: true,
      },
      {
        source: '/forum',
        destination: '/community',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
