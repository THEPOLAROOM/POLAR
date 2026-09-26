/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Server actions default to a 1 MB request body. Client photos
    // (lib/actions/client-records.ts) and service images accept files up
    // to 5 MB, so allow a little above that for the multipart overhead.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
