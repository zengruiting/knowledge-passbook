import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 👇 完整的琥珀金 (Amber) 色板，确保 50-900 都有定义
        primary: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a', // 装饰性下划线用这个
          300: '#fcd34d', // 渐变色用这个
          400: '#fbbf24', 
          500: '#f59e0b',
          600: '#d97706', // 按钮默认背景色
          700: '#b45309', // 按钮悬停色
          800: '#92400e',
          900: '#78350f',
        },
        sidebar: {
          bg: '#0f172a', 
          text: '#94a3b8',
          active: '#ffffff',
          hover: '#1e293b',
        }
      },
      // 补充自定义动画
      animation: {
        'spin-slow': 'spin 3s linear infinite', // 孵化器图标慢速旋转
      }
    },
  },
  plugins: [],
};
export default config;