"use client";
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav'; // 👈 引入

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullScreenPage = pathname === '/login';

  if (isFullScreenPage) {
    return (
      <main className="w-full h-screen overflow-auto">
        {children}
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* 桌面端侧边栏 (手机隐藏) */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* 核心内容区 */}
      {/* 
          1. md:ml-64: 桌面端左边距 256px
          2. ml-0: 手机端左边距 0
          3. pb-20: 手机端底部留白 (给 BottomNav 腾位置)
          4. md:pb-0: 桌面端不需要底部留白
          5. p-4: 手机端内边距小一点
          6. md:p-12: 桌面端内边距大一点
      */}
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-12 pb-24 md:pb-12 overflow-y-auto min-h-screen transition-all duration-300">
        {children}
      </main>

      {/* 移动端底部栏 (桌面隐藏) */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}