import type { Metadata} from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
// 👇 引入新的客户端布局组件
import ClientLayout from "@/components/ClientLayout";
import Script from 'next/script';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "存了么|知识存折",
  description: "将时间转化为智力资产",
  icons: {
    icon: "/icon.png", // 引用 public/icon.png
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} bg-slate-50 text-slate-900`} suppressHydrationWarning={true}>
        {/* 加载 GA 脚本库 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-T189SW6J94"
          strategy="afterInteractive" // 策略：页面可交互后再加载，不阻塞渲染
        />
        
        {/* 初始化 GA 配置 */}
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-T189SW6J94');
          `}
        </Script>
        {/* 👇 把复杂的布局逻辑移交给 ClientLayout 处理 */}
        <ClientLayout>
          {children}
        </ClientLayout>

        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
