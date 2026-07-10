import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
const s3Hostname = process.env.NEXT_PUBLIC_S3_HOSTNAME;

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'radix-ui'],
    turbopackFileSystemCacheForDev: false,
  },
  images: {
    remotePatterns: [
      ...(s3Hostname
        ? ([{ protocol: 'https', hostname: s3Hostname }] as const)
        : []),
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals ?? []), { canvas: 'canvas' }];
    }

    return config;
  },
};

export default withNextIntl(nextConfig);
