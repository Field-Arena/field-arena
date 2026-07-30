import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // Catalog-document uploads reach the server as base64 in a Server Action
    // body; the default 1 MB cap rejects any real PDF. 8 MB covers a test sheet
    // with room for the ~33% base64 overhead.
    serverActions: { bodySizeLimit: '8mb' },
  },
};

export default nextConfig;
