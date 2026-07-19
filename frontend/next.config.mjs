/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/knowledge',
  // 禁用 Turbopack 的根目录推导，显式指定当前目录为根
  experimental: {
    turbopack: {
      root: '.',
    },
  },
  // 允许局域网 IP 访问
  allowedDevOrigins: [
    "192.168.0.104:3000",
    "localhost:3000",
    "127.0.0.1:3000"
  ],
};

export default nextConfig;
