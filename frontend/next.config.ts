import type { NextConfig } from 'next';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  env: {
    NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID:
      process.env.GOOGLE_OAUTH_CLIENT_ID ?? '',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'}/api/:path*/`,
      },
    ];
  },
};

export default nextConfig;
