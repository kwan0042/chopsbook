// next.config.mjs (修正後的範例)
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 您的其他 Next.js 配置
  // 例如：
  // output: 'standalone', // 如果您要部署到 Workers，可能需要此設定，請參考 Next.js 文件
};

export default withBundleAnalyzer(nextConfig);
