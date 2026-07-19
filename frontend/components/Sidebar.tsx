"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Wallet, Layers, Settings, 
  BookOpen, LogOut, User, Users, X, MessageCircle, Video 
} from 'lucide-react'; // 👈 引入新图标
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

const menuItems = [
  { name: '智能工作台', icon: LayoutDashboard, href: '/' },
  { name: '孵化器', icon: Layers, href: '/incubator' },
  { name: '我的存折', icon: Wallet, href: '/assets' },
];

export default function Sidebar() { 
  const pathname = usePathname();
  const router = useRouter();
  
  const [userEmail, setUserEmail] = useState<string>("");
  
  // 👇 新增：控制社区弹窗的状态
  const [showCommunity, setShowCommunity] = useState(false);

  useEffect(() => {
    const initSidebar = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (session.user?.email) {
        setUserEmail(session.user.email);
      }

    };
    initSidebar();
  }, [pathname]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("退出失败");
    } else {
      localStorage.removeItem('currentAssetId');
      toast.success("已安全退出");
      router.push('/login');
    }
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 shadow-2xl z-50 transition-all">
      {/* Brand Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg shadow-white/10">
          <BookOpen className="text-slate-900 w-5 h-5" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">知识存折</span>
      </div>

      {/* 导航Navigation */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group ${
                isActive 
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}>
                <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
                <span className="font-medium">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        
        {/* Settings */}
        <Link href="/settings">
          <div className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer hover:bg-slate-800 ${
            pathname === '/settings' ? 'text-white' : 'text-slate-400 group-hover:text-white'
          }`}>
            <Settings size={18} />
            <span className="text-sm font-medium text-white">配置中心</span>
          </div>
        </Link>

        {/* 👇👇👇 新增：加入社区按钮 👇👇👇 */}
        <button 
          onClick={() => setShowCommunity(true)}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer text-slate-400 hover:bg-slate-800 group hover:text-amber-400"
        >
          <Users size={18} />
          <span className="text-sm font-medium text-white">加入社区</span>
        </button>


        {/* 新增：用户个人信息卡片 (User Profile) */}
        <div className="flex items-center gap-3 pt-2 pl-2">
            {/* 头像 (用邮箱首字母) */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md border border-slate-700">
                {userEmail ? userEmail.charAt(0).toUpperCase() : <User size={16}/>}
            </div>
            
            {/* 邮箱显示 */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate" title={userEmail}>
                    {userEmail || <span className="text-slate-500 text-xs">Loading...</span>}
                </p>
            </div>

            <button 
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="退出登录"
            >
                <LogOut size={18} />
            </button>
        </div>
      </div>

      {/* 👇👇👇 社区弹窗 (Modal) 👇👇👇 */}
      {showCommunity && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl p-0 overflow-hidden relative">
            
            {/* Header */}
            <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary-600/20 to-transparent pointer-events-none"></div>
                <h2 className="text-2xl font-bold text-white relative z-10">连接·共生·进化</h2>
                <p className="text-slate-400 mt-2 text-sm relative z-10">加入「知识存折」核心圈，获取最新干货与更新</p>
                <button 
                    onClick={() => setShowCommunity(false)}
                    className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors bg-slate-800/50 p-2 rounded-full z-50 cursor-pointer"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Content Grid */}
            <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* 1. 公众号 */}
                <div className="flex flex-col items-center group">
                    <div className="w-40 h-40 bg-slate-100 rounded-xl mb-4 flex items-center justify-center border-2 border-slate-100 group-hover:border-primary-500 transition-colors overflow-hidden relative">
                        {/* 🔴 请替换这里的 src 为你的真实二维码图片地址 */}
                        <img src="hellosAI.jpg" alt="公众号" className="w-full h-full object-cover mix-blend-multiply" />
                        <div className="absolute inset-0 bg-primary-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-white text-primary-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">扫码关注</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        <BookOpen size={16} className="text-primary-600"/>
                        <h3 className="font-bold text-slate-800">官方公众号</h3>
                    </div>
                    <p className="text-xs text-slate-400 text-center">深度思考文章 & 技术干货</p>
                </div>

                {/* 2. 抖音 */}
                <div className="flex flex-col items-center group">
                    <div className="w-40 h-40 bg-slate-100 rounded-xl mb-4 flex items-center justify-center border-2 border-slate-100 group-hover:border-black transition-colors overflow-hidden relative">
                        <img src="dy.png" alt="抖音" className="w-full h-full object-cover mix-blend-multiply" />
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">去围观</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        <Video size={16} className="text-black"/>
                        <h3 className="font-bold text-slate-800">抖音/视频号</h3>
                    </div>
                    <p className="text-xs text-slate-400 text-center">开发直播 & 认知干货</p>
                </div>

                {/* 3. 交流群 */}
                <div className="flex flex-col items-center group">
                    <div className="w-40 h-40 bg-slate-100 rounded-xl mb-4 flex items-center justify-center border-2 border-slate-100 group-hover:border-green-500 transition-colors overflow-hidden relative">
                        <img src="qq.png" alt="交流群" className="w-full h-full object-cover mix-blend-multiply" />
                        <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">加入组织</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        <MessageCircle size={16} className="text-green-600"/>
                        <h3 className="font-bold text-slate-800">用户交流群</h3>
                    </div>
                    <p className="text-xs text-slate-400 text-center">产品反馈 & 学习打卡</p>
                </div>

            </div>
          </div>
        </div>
      )}

    </aside>
  );
}