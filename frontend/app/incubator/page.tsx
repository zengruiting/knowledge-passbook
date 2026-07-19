"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // 引入 router
import { Loader2, ArrowRight, Clock, FileEdit, Egg, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient'; // 引入 supabase
import { toast } from 'sonner';
import { CONFIG } from '@/lib/config';

export default function IncubatorPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 加载孵化中的资产
  useEffect(() => {
    const fetchIncubator = async () => {
      try {
        // 1. 获取用户凭证
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            router.push('/login');
            return;
        }

        // 2. 发起请求 (带上 Token)
        const res = await fetch(`${CONFIG.api.baseURL}/api/knowledge/incubator`, {
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        
        const data = await res.json();

        // 3. 安全检查：确保是数组才渲染
        if (Array.isArray(data)) {
            setAssets(data);
        } else {
            console.error("数据格式错误:", data);
            setAssets([]); // 兜底为空数组，防止 .map 崩溃
        }

      } catch (err) {
        console.error(err);
        setError(true);
        toast.error("加载孵化器失败");
      } finally {
        setLoading(false);
      }
    };

    fetchIncubator();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-slate-400 gap-2">
        <Loader2 className="animate-spin" /> 正在扫描孵化箱...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 顶部标题区 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-serif">孵化器</h1>
          <p className="text-slate-500 mt-2 max-w-2xl">
            这里存放着你的“思维半成品”。它们尚未成为永久资产，等待你随时回来进行深度打磨。
          </p>
        </div>
        <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-full border border-amber-100 text-sm font-bold flex items-center gap-2">
          <Egg size={16} />
          孵化中: {assets.length}
        </div>
      </div>

      {/* 内容列表区 */}
      {assets.length === 0 ? (
        // --- 空状态 ---
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
             <Egg size={40} className="text-slate-300" />
           </div>
           <h3 className="text-xl font-bold text-slate-800 mb-2">孵化箱是空的</h3>
           <p className="text-slate-500 mb-8">说明你所有的思考都已经完成了闭环，或者你还没有开始行动。</p>
           <Link href="/" prefetch={false}>
             <button className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
               + 新建一个任务
             </button>
           </Link>
        </div>
      ) : (
        // --- 资产卡片网格 ---
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <Link href={`/refine/${asset.id}`} key={asset.id} className="group" prefetch={false}>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-primary-400 transition-all cursor-pointer h-full flex flex-col relative overflow-hidden">
                
                {/* 顶部装饰条 */}
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 group-hover:bg-primary-500 transition-colors"></div>

                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                    <FileEdit size={24} />
                  </div>
                  <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">
                    草稿
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-primary-700 line-clamp-2">
                  {asset.title}
                </h3>
                
                <div className="mt-auto pt-6 flex items-center justify-between text-sm text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} />
                    <span>{new Date(asset.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-slate-300 group-hover:text-primary-600 transition-colors">
                    继续打磨 <ArrowRight size={16} />
                  </div>
                </div>

              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}