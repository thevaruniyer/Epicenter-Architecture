/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile shared workspace packages.
  transpilePackages: ["@epicenter/ui"],
};

export default nextConfig;
