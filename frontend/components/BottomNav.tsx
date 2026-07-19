"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { 
  LayoutDashboard, Wallet, Layers, User, Bot,
  LogOut, Users, BarChart3, X, BookOpen, Video, MessageCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  // 状态控制
  const [showMenu, setShowMenu] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('currentAssetId');
    router.push('/login');
  };

  // 导航配置
  const navItems = [
    { name: '工作台', icon: LayoutDashboard, href: '/' },
    { name: '孵化器', icon: Layers, href: '/incubator' },
    { name: '存折', icon: Wallet, href: '/assets' },
    // 第4个按钮比较特殊，它是一个 Trigger
    { name: '我的', icon: User, href: '#profile-trigger' }, 
  ];

  return (
    <>
      {/* 1. 透明遮罩 (点击空白处关闭菜单) */}
      {showMenu && (
        <div 
            className="fixed inset-0 z-40 bg-black/5" 
            onClick={() => setShowMenu(false)}
        ></div>
      )}

      {/* 2. 底部弹出菜单 (Popover) */}
      {showMenu && (
        <div className="fixed bottom-20 right-4 z-50 w-40 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200 origin-bottom-right">
            <div className="flex flex-col">
                {/* A. 资产统计 (跳去个人中心页看详情) */}
                <button 
                    onClick={() => { setShowMenu(false); router.push('/settings'); }} // 👈 新增跳转
                    className="flex items-center gap-3 p-4 hover:bg-slate-50 border-b border-slate-50 transition-colors text-left"
                >
                    <Bot size={18} className="text-slate-500"/>
                    <span className="text-sm font-bold text-slate-700">AI 配置</span>
                </button>

                {/* B. 加入社区 (弹窗) */}
                <button 
                    onClick={() => { setShowMenu(false); setShowCommunity(true); }}
                    className="flex items-center gap-3 p-4 hover:bg-slate-50 border-b border-slate-50 transition-colors text-left"
                >
                    <Users size={18} className="text-indigo-600"/>
                    <span className="text-sm font-bold text-slate-700">加入社区</span>
                </button>

                {/* C. 退出登录 */}
                <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 p-4 hover:bg-red-50 transition-colors text-left group"
                >
                    <LogOut size={18} className="text-slate-400 group-hover:text-red-500"/>
                    <span className="text-sm font-medium text-slate-500 group-hover:text-red-500">退出登录</span>
                </button>
            </div>
            {/* 小三角箭头 (装饰) */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white rotate-45 border-b border-r border-slate-100"></div>
        </div>
      )}

      {/* 3. 底部导航栏本体 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 h-16 flex items-center justify-around z-50 md:hidden shadow-[0_-4px_10px_-2px_rgba(0,0,0,0.05)]">
        {navItems.map((item, index) => {
          // 判断是否激活 (前3个是路由匹配，第4个是菜单状态)
          const isActive = item.href === '#profile-trigger' ? showMenu : pathname === item.href;
          
          return (
            <button 
                key={item.name} 
                onClick={() => {
                    if (item.href === '#profile-trigger') {
                        // 切换菜单显示
                        setShowMenu(!showMenu);
                    } else {
                        // 正常跳转
                        router.push(item.href);
                        setShowMenu(false); // 跳转时关闭菜单
                    }
                }}
                className="flex-1 h-full"
            >
              <div className={`flex flex-col items-center justify-center gap-1 h-full w-full transition-all duration-200 ${
                  isActive ? 'text-primary-600 scale-105' : 'text-slate-400 hover:text-slate-600'
              }`}>
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.name}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 4. 社区弹窗 (复用之前的代码) */}
      {showCommunity && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative">
            <div className="bg-slate-900 p-6 text-center relative">
                <button onClick={() => setShowCommunity(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20}/></button>
                <h2 className="text-xl font-bold text-white">加入核心圈</h2>
                <p className="text-slate-400 text-xs mt-1">连接·共生·进化</p>
            </div>
            <div className="p-6 space-y-3">
                {[
                    { 
                      title: '官方公众号', 
                      icon: BookOpen, 
                      desc: '深度思考文章', 
                      imgSrc: '/hellosAI.jpg' 
                    },
                    { 
                      title: '抖音/视频号', 
                      icon: Video, 
                      desc: '认知干货直播',
                      imgSrc: '/dy.png' 
                    },
                    { 
                      title: '用户交流群', 
                      icon: MessageCircle, 
                      desc: '学习打卡',
                      imgSrc: '/qq.png' 
                    },
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 bg-slate-50 active:scale-95 transition-transform">
                        
                        {/* 👇👇👇 修改这里：把原来的 div 换成 img 👇👇👇 */}
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-slate-200 overflow-hidden">
                            <img 
                                src={item.imgSrc} 
                                alt={item.title} 
                                className="w-full h-full object-cover" // 确保图片填满方框
                            />
                        </div>
                        {/* 👆👆👆 修改结束 👆👆👆 */}

                        <div>
                            <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                <item.icon size={14} className="text-amber-500"/> {item.title}
                            </div>
                            <p className="text-[10px] text-slate-400">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>


          </div>
        </div>
      )}
    </>
  );
}