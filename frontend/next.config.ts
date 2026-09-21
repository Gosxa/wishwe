import type { NextConfig } from 'next';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: '/admin',
        destination: 'https://wishwe.onrender.com/admin/',
        permanent: false,
      },
      {
        source: '/admin/:path*',
        destination: 'https://wishwe.onrender.com/admin/:path*',
        permanent: false,
      },
    ];
  },
  env: {
    NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID:
      process.env.GOOGLE_OAUTH_CLIENT_ID ?? '',
    NEXT_PUBLIC_GOOGLE_MAPS_KEY:
      process.env.GOOGLE_MAPS_KEY ??
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ??
      '',
  },
};

export default nextConfig;
