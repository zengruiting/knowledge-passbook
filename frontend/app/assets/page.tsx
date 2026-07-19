"use client";
import { useEffect, useState } from 'react';
import { Tag, Calendar, Wallet, ArrowRight, Loader2, AlertTriangle } from 'lucide-react'; // 新增 AlertTriangle
import Link from 'next/link';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { CONFIG } from '@/lib/config';

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  // 新增：动态计算所有用过的标签
  const [allTags, setAllTags] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState('ALL');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false); // 新增错误状态

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. 👇 关键步骤：先获取当前的 Session Token
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            // 如果没登录，数据肯定是空的
            setLoading(false);
            return;
        }

        // 2. 👇 关键步骤：把 Token 放入请求头 Authorization
        const res = await fetch(`${CONFIG.api.baseURL}/api/knowledge/minted_assets`, {
            headers: {
                'Authorization': `Bearer ${session.access_token}`, // 带着身份证去请求
                'Content-Type': 'application/json'
            }
        });
        // 1. 先判断 HTTP 状态码
        if (!res.ok) {
            throw new Error(`API Error: ${res.status}`);
        }

        const data = await res.json();

        // 2. 关键修复：判断拿到的 data 到底是不是数组？
        if (Array.isArray(data)) {
            setAssets(data);
            // 🔥 核心升级：从数据中提取所有不重复的标签
            const tagsSet = new Set<string>();
            data.forEach(item => {
                // 防御性代码：确保 tags 是数组且不为空
                if (item.tags && Array.isArray(item.tags)) {
                    item.tags.forEach((t: string) => {
                        if(t) tagsSet.add(t); // 过滤掉空字符串
                    });
                }
            });
            setAllTags(Array.from(tagsSet)); // 转回数组
        } else {
            console.error("数据格式异常:", data);
            // 如果不是数组（比如是报错信息），强制设为空数组，防止 .map 崩溃
            setAssets([]); 
            toast.error("数据格式错误，请检查后端");
        }
      } catch (err) {
        console.error("加载失败:", err);
        setError(true);
        setAssets([]); // 出错也设为空数组，保命
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 如果 assets 不是数组，直接给空数组，保证 .filter 能跑下去
  const safeAssets = Array.isArray(assets) ? assets : [];

  const filteredAssets = safeAssets.filter(asset => {
    // A. 快速通道：全部显示
    if (activeFilter === 'ALL') return true;
    
    // B. 数据清洗防御：
    // 确保 tags 存在，且是数组。如果不是，视为无标签，直接淘汰
    const tags = asset.tags;
    if (!tags || !Array.isArray(tags)) return false;

    // C. 鲁棒性匹配 (Robust Matching)：
    // 不直接用 includes，而是处理一下空格，防止 "商业 " != "商业" 这种低级错误
    // (如果是英文，建议加上 .toLowerCase())
    return tags.some(t => t.trim() === activeFilter.trim());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-slate-400 gap-2">
        <Loader2 className="animate-spin" /> 正在清算知识资产...
      </div>
    );
  }
  // 错误状态展示
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 gap-4">
        <AlertTriangle size={48} className="text-amber-500"/>
        <p>无法连接到知识金库 (Backend Error)</p>
        <button onClick={() => window.location.reload()} className="text-primary-600 font-bold hover:underline">
            刷新试试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 font-serif">存折明细</h1>
           <p className="text-slate-500 mt-1">这里存放着你所有已完成内化的智力资产。</p>
        </div>
        
        {/* 顶部过滤器 */}
        <div className="flex gap-2 flex-wrap justify-end">
            <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-4 py-2 rounded-full border text-xs font-bold transition-all duration-200 ${
                    activeFilter === 'ALL' 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                    : 'bg-white border-slate-200 text-slate-500 hover:border-primary-500'
                }`}
            >
                全部
            </button>

            {allTags.map((tag) => (
                <button
                    key={tag}
                    onClick={() => setActiveFilter(tag)}
                    className={`px-4 py-2 rounded-full border text-xs font-bold transition-all duration-200 ${
                        activeFilter === tag 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md transform scale-105' 
                        : 'bg-white border-slate-200 text-slate-500 hover:border-primary-500 hover:text-primary-600'
                    }`}
                >
                    {tag}
                </button>
            ))}
        </div>
      </div>

      {/* 核心内容区 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        
        {filteredAssets.length === 0 ? (
            /* --- 空状态 Empty State --- */
            <div className="flex flex-col items-center justify-center h-[400px] text-center p-8">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <Wallet size={48} className="text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">存折还是空的</h3>
                <p className="text-slate-500 max-w-md mb-8">
                    {activeFilter === 'ALL' 
                        ? "你还没有任何“已入库”的知识资产。去开启一个专注时刻，把知识打磨成资产吧。" 
                        : `没有找到“${activeFilter}”标签的资产`}
                </p>
                {activeFilter === 'ALL' && (
                    <Link href="/" prefetch={false}>
                        <button className="px-8 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 flex items-center gap-2">
                            去铸造第一笔知识资产 <ArrowRight size={18}/>
                        </button>
                    </Link>
                )}
            </div>
        ) : (
            /* --- 真实数据展示 (桌面+移动) --- */
            <> 
                {/* 1. 桌面端视图 (Table) - 仅在 md 以上显示 */}
                <div className="hidden md:block w-full">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="text-left py-5 px-8 text-xs font-bold text-slate-500 uppercase tracking-wider">知识资产名称</th>
                                <th className="text-left py-5 px-8 text-xs font-bold text-slate-500 uppercase tracking-wider">分类标签</th>
                                <th className="text-left py-5 px-8 text-xs font-bold text-slate-500 uppercase tracking-wider">状态</th>
                                <th className="text-left py-5 px-8 text-xs font-bold text-slate-500 uppercase tracking-wider">复利值</th>
                                <th className="text-left py-5 px-8 text-xs font-bold text-slate-500 uppercase tracking-wider">入库时间</th>
                                <th className="text-right py-5 px-8"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredAssets.map((asset) => (
                                <tr key={asset.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                                    <td className="py-6 px-8">
                                        <Link href={`/assets/${asset.id}`} className="block" prefetch={false}>
                                            <div className="font-bold text-slate-800 text-lg group-hover:text-primary-700 transition-colors cursor-pointer">
                                                {asset.title}
                                            </div>
                                            <div className="text-xs text-slate-400 mt-1 font-mono">{asset.id.slice(0, 8)}...</div>
                                        </Link>
                                    </td>
                                    <td className="py-6 px-8">
                                        <div className="flex gap-2 flex-wrap">
                                            {asset.tags && asset.tags.length > 0 ? (
                                                asset.tags.map((tag: string) => (
                                                    <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                                                        <Tag size={10} className="mr-1"/> {tag}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-slate-300 text-xs italic">无标签</span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="py-6 px-8">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            已入库
                                        </span>
                                    </td>

                                    <td className="py-6 px-8">
                                        <span className="inline-flex items-center justify-center w-auto px-3 h-8 rounded-full bg-amber-100 text-amber-700 font-bold text-sm">
                                            🔥 {asset.compound_score || 10}
                                        </span>
                                    </td>
                                    <td className="py-6 px-8">
                                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                                            <Calendar size={14}/>
                                            {new Date(asset.minted_at || asset.created_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="py-6 px-8 text-right">
                                        <Link href={`/assets/${asset.id}`} prefetch={false}>
                                            <button className="text-slate-300 hover:text-primary-600 transition-colors">
                                                <ArrowRight size={20} />
                                            </button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 2. 移动端视图 (Cards) - 仅在 md 以下显示 */}
                <div className="md:hidden p-4 space-y-4">
                    {filteredAssets.map((asset) => (
                        <Link href={`/assets/${asset.id}`} key={asset.id} className="block" prefetch={false}>
                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 shadow-sm active:scale-[0.98] transition-transform">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold text-slate-800 text-lg line-clamp-2 leading-tight">
                                        {asset.title}
                                    </h3>
                                    <span className="shrink-0 inline-flex items-center justify-center px-2 py-1 rounded bg-amber-100 text-amber-700 text-xs font-bold ml-2">
                                        🔥 {asset.compound_score || 10}
                                    </span>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {asset.tags?.map((tag: string) => (
                                        <span key={tag} className="inline-flex items-center px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-500 text-xs">
                                            <Tag size={10} className="mr-1"/> {tag}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-200 pt-3">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={12}/>
                                        {new Date(asset.minted_at || asset.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1 text-primary-600 font-bold">
                                        查看详情 <ArrowRight size={12}/>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </>
        )}
      </div>
    </div>
  );
}