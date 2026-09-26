const s3Hostname = process.env.NEXT_PUBLIC_S3_HOSTNAME;
const remotePatterns = [];

if (s3Hostname) {
  remotePatterns.push({ protocol: 'https', hostname: s3Hostname });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'radix-ui'],
    turbopackFileSystemCacheForDev: false,
  },
  images: {
    remotePatterns,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals ?? []), { canvas: 'canvas' }];
    }

    return config;
  },
};

export default nextConfig;
