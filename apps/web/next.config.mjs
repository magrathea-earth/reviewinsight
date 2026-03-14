/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@repo/db", "@repo/shared"],
    experimental: {
        serverComponentsExternalPackages: ["lemonsqueezy.ts", "undici"],
    },
};

export default nextConfig;
