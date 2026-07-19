"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Coffee, Plus, ArrowRight, Loader2, X, Trash2 } from 'lucide-react'; // 引入 Trash2
import { toast } from 'sonner'; // 引入 toast
// 引入 Supabase 客户端
import { supabase } from '@/lib/supabaseClient';
import { CONFIG } from '@/lib/config';
import WelcomeModal from '@/components/WelcomeModal';

export default function Dashboard() {
  const router = useRouter();
  const [incubating, setIncubating] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  // 新增：控制删除确认弹窗的状态
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);
  // 新增：统计数据状态
  const [stats, setStats] = useState({ 
    focus_minutes: 0, 
    minted_count: 0, 
    total_assets: 0 
  });

  useEffect(() => {
    // 定义一个异步函数来处理所有逻辑
    const initDashboard = async () => {
      
      // 1. 先检查登录状态
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // 没登录，踢回登录页，并停止后续数据加载
        router.push('/login');
        return;
      }

      // 👇 准备请求头，带上 Token
      const headers = {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
      };

      try {
        // 👇 在 fetch 中加入 headers
        const [resIncubator, resStats] = await Promise.all([
          fetch(`${CONFIG.api.baseURL}/api/knowledge/incubator`, { headers }),
          fetch(`${CONFIG.api.baseURL}/api/knowledge/stats/daily`, { headers })
        ]);

        if (resIncubator.ok) {
          const dataIncubator = await resIncubator.json();
          setIncubating(dataIncubator);
        }

        if (resStats.ok) {
          const dataStats = await resStats.json();
          setStats(dataStats);
        }
      } catch (error) {
        console.error("加载数据失败:", error);
      }
    };

    // 执行这个函数
    initDashboard();
  }, [router]);

  const handleStartFocus = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      // 1. 👇 新增：获取用户身份凭证 (Token)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // 如果没登录，直接踢走
        router.push('/login');
        return;
      }

      // 获取本地存储的 AI 配置
      const configStr = localStorage.getItem('ai_config');
      const config = configStr ? JSON.parse(configStr) : {};

      // 2. 👇 修改：请求头加入 Authorization
      const res = await fetch(`${CONFIG.api.baseURL}/api/knowledge/start_session`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`, // 👈 必须带上这个！
          'x-api-key': config.apiKey || '', 
        },
        body: JSON.stringify({ title: topic }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('currentAssetId', data.id);
        router.push('/focus');
      } else {
        if (res.status === 401) {
            toast.error("登录已过期，请重新登录");
            router.push('/login');
        } else {
            toast.error("启动失败，请检查后端服务");
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("网络请求错误");
    } finally {
      setLoading(false);
      setIsModalOpen(false); 
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, assetId: string) => {
    e.preventDefault(); 
    e.stopPropagation();
    setAssetToDelete(assetId); // 记住要删哪个
    setDeleteModalOpen(true);  // 打开弹窗
  };

  // 2. 点击弹窗里的“确认删除”：执行真正的 API 请求
  const confirmDelete = async () => {
    if (!assetToDelete) return;

    // 新增：获取 Token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        toast.error("登录已过期，请重新登录");
        return;
    }

    // 乐观更新 UI
    setIncubating(prev => prev.filter(item => item.id !== assetToDelete));
    setDeleteModalOpen(false); 

    try {
      const res = await fetch(`${CONFIG.api.baseURL}/api/knowledge/assets/${assetToDelete}`, {
        method: 'DELETE',
        // 👇 新增：必须带上请求头
        headers: {
            'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (res.ok) {
        toast.success("已丢弃该草稿");
      } else {
        throw new Error("删除失败");
      }
    } catch (err) {
      toast.error("删除出错，请刷新重试");
      // 失败时建议刷新页面恢复数据，或者在这里回滚 state
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* 顶部状态条 */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-full border border-amber-100 text-sm font-bold">
          <Coffee size={16} /> 沉浸学习模式就绪...
        </div>
      </div>

      {/* 核心行动区 (Hero Section) */}
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow duration-500">
        
        {/* 顶部装饰条 */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-400"></div>
        
        {/* Slogan 区域 */}
        <div className="mb-8 space-y-4">
            {/* 主标题：感性号召 */}
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight font-serif leading-tight">
              别让知识只是<span className="relative inline-block mx-2 text-slate-300 line-through decoration-primary-500 decoration-4 decoration-wavy">经过</span>
            </h2>
            
            {/* 副标题：价值主张 */}
            <p className="text-slate-500 text-base font-medium">
              拒绝大脑虚胖，只存认知
              <span className="text-primary-700 font-bold mx-1 border-b-2 border-primary-200">干货</span>
            </p>
        </div>

        {/* 👇👇👇 核心修复：加回了操作指引，架起通往按钮的桥梁 👇👇👇 */}
        <div className="max-w-xl mx-auto mb-8">
            <p className="text-slate-400 text-sm leading-relaxed">
                开启 30 分钟认知闭环，将瞬时的思考固化为永久的智力资产。
            </p>
        </div>
        
        {/* 行动按钮 */}
        <button 
          onClick={() => { setIsModalOpen(true); setTimeout(() => document.getElementById('topic-input')?.focus(), 100); }}
          className="group relative inline-flex items-center justify-center px-10 py-4 font-bold text-white transition-all duration-200 bg-slate-900 text-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 hover:bg-slate-800 hover:scale-105 shadow-xl shadow-slate-900/20"
        >
          <span className="mr-2">存入 30 分钟专注</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* 双栏布局：计时器入口 vs 孵化器 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* 左侧：数据看板 (Data Dashboard) - 升级版 */}
        
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[300px] hover:border-primary-200 transition-colors relative overflow-hidden group">
           {/* 背景装饰：动态光斑 */}
           <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-50 to-amber-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-60 pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
           
           {/* 标题栏 */}
           <div>
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
               我的经营状况
             </h3>
             <p className="text-slate-400 text-sm mt-1">日拱一卒，功不唐捐！</p>
           </div>

           {/* 核心数据区：双列布局 */}
           {/* grid-cols-2 表示分成两列，gap-8 增加中间间距 */}
           <div className="grid grid-cols-2 gap-8 mt-6">
             
             {/* 左边一半：今日投入 */}
             <div>
                <div className="text-xs text-slate-400 font-medium mb-1">今日投入时间</div>
                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-slate-900 tracking-tighter">
                        {stats.focus_minutes}
                    </span>
                    <span className="text-sm text-slate-500 font-bold">分钟</span>
                </div>
                <div className="mt-2 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-block">
                    今日铸造: {stats.minted_count} 个
                </div>
             </div>

             {/* 右边一半：知识总资产 */}
             {/* 这里的 div 会自动占据右半边区域，内容默认靠左对齐（紧贴中轴线） */}
             <div>
                <div className="text-xs text-slate-400 font-medium mb-1">知识总资产</div>
                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-amber-500 tracking-tighter">
                        {stats.total_assets || 0}
                    </span>
                    <span className="text-sm text-amber-600/60 font-bold">条</span>
                </div>
                <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded inline-block">
                    持续复利中
                </div>
             </div>

           </div>

           {/* 底部进度条 (仅针对今日目标) */}
           <div className="space-y-2 mt-6 pt-6 border-t border-slate-50">
              <div className="flex justify-between text-xs font-bold text-slate-400">
                <span>每日专注目标 (1小时)</span>
                <span>{Math.round((stats.focus_minutes / 60) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                    className="bg-slate-900 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min((stats.focus_minutes / 60) * 100, 100)}%` }}
                ></div>
              </div>
           </div>
        </div>

        {/* 右侧：待打磨资产 */}
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm min-h-[300px]">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Loader2 className="animate-spin-slow text-primary-500"/> 待打磨的“半成品”
          </h3>
          
          <div className="space-y-3">
            {incubating.length === 0 && (
              <div className="text-center py-10 text-slate-400 italic">
                目前没有孵化中的资产...
              </div>
            )}
            {incubating.map((asset) => (
              <Link href={`/refine/${asset.id}`} key={asset.id} className="block group relative" prefetch={false}> {/* group 和 relative 很重要 */}
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all cursor-pointer">
                  <div>
                    <div className="font-bold text-slate-700 group-hover:text-primary-700 transition-colors">{asset.title}</div>
                    <div className="text-xs text-slate-400 mt-1">创建于 {new Date(asset.created_at).toLocaleDateString()}</div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* ➡️ 箭头图标 (正常显示) */}
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-300 group-hover:text-primary-500 border border-slate-100 transition-colors">
                        <ArrowRight size={14} />
                    </div>
                  </div>
                </div>

                {/* 🗑️ 删除按钮 (悬停浮现) */}
                <button 
                    onClick={(e) => handleDeleteClick(e, asset.id)}
                    className="absolute top-1/2 -translate-y-1/2 right-4 md:right-16 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full 
                    opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200"
                    title="丢弃草稿"
                >
                    <Trash2 size={18} />
                </button>

              </Link>
            ))}

          </div>
        </div>
      </div>

      {/* Modal 弹窗 (保持逻辑不变，只微调样式) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 transform scale-100">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">定义资产标的</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"><X/></button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">学习主题</label>
                <input
                  id="topic-input"
                  type="text"
                  autoFocus
                  placeholder="例如：毛泽东选集..."
                  className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-bold text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none placeholder:text-slate-300 placeholder:font-normal"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStartFocus()}
                />
              </div>
              <button 
                onClick={handleStartFocus} disabled={loading}
                className="w-full py-5 bg-primary-600 text-white rounded-2xl font-bold text-lg hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/20 disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin"/> : <Plus strokeWidth={3}/>}
                {loading ? '环境初始化...' : '开始专注'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新增：删除确认弹窗 (Delete Confirmation Modal) */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 transform scale-100 border border-slate-100">
            
            <div className="flex flex-col items-center text-center">
              {/* 红色警告图标背景 */}
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
                <Trash2 size={24} />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-2">确认丢弃？</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                您确定要删除这个“半成品”资产吗？<br/>
                <span className="text-red-500 font-medium">此操作无法撤销。</span>
              </p>

              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  再想想
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-600/20 transition-colors"
                >
                  确定删除
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
      {/* 👇👇👇加上信息公告栏 👇👇👇 */}
      <WelcomeModal />
    </div>
  );
}