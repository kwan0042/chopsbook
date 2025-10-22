// next.config.mjs

import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  
  // 新增 images 設定
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/v0/b/chopsbook.firebasestorage.app/o/**",
      },
      // 如果你使用 placehold.co，也可以將其加入
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
