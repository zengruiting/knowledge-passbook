"use client";
export const runtime = 'edge'; 
import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Clock, CheckCircle2, History, 
  Bot, User, ChevronRight, Quote, Network,
  Trash2, PenLine, MoreHorizontal, Share2, Download, Wand2 
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import InsightCard from '@/components/InsightCard';
import GalaxyGraph from '@/components/GalaxyGraph';
import { supabase } from '@/lib/supabaseClient';
import { CONFIG } from '@/lib/config';
import html2canvas from 'html2canvas'; // 引入截图库
import ContentFactoryModal from '@/components/ContentFactoryModal';



// --- 🛡️ 1. 升级版安全渲染函数 ---
// 无论传进来是什么，都转成字符串，绝对不崩
function safeRender(content: any): string {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (typeof content === 'object') return JSON.stringify(content); // 如果是对象，转 JSON 字符串显示
    return String(content);
}

// 辅助渲染章节组件
function renderSection(title: string, content: any, highlight = false) {
    if (!content) return null;
    // 使用 safeRender 处理内容
    const safeContent = safeRender(content);
    
    return (
        <div className="group">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 md:mb-3 flex items-center gap-2">
                {title}
            </h3>
            <div className={`p-4 md:p-6 rounded-xl md:rounded-2xl text-base md:text-lg leading-relaxed text-slate-800 transition-all ${
                highlight 
                ? 'bg-primary-50 border border-primary-100 shadow-sm' 
                : 'bg-slate-50 group-hover:bg-white group-hover:shadow-md border border-transparent group-hover:border-slate-100'
            }`}>
                {safeContent}
            </div>
        </div>
    );
}

// 历史草稿视图
function HistoryDraftView({ data }: { data: any }) {
  const c = data?.content || {};
  return (
    // 👇👇👇 修改：手机端 p-4，电脑端 p-8
    <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 p-4 md:p-8 opacity-90">
      <div className="flex items-center gap-2 mb-6 text-slate-400 font-mono text-sm uppercase tracking-widest border-b border-slate-200 pb-4">
        <Clock size={16}/> 
        历史草稿 - v{data.version_num}
      </div>
      <div className="space-y-6 md:space-y-8">
         <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 mb-2">核心洞见</h3>
            <p className="text-slate-700 leading-relaxed text-lg font-serif">
                “{safeRender(c.understand || c.what)}”
            </p>
         </div>
         {/* 👇👇👇 这里改成了响应式 Grid：手机单列，电脑双列 👇👇👇 */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 mb-1">触发场景</h3>
                <p className="text-sm text-slate-600">{safeRender(c.where)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 mb-1">如何使用</h3>
                <p className="text-sm text-slate-600">{safeRender(c.action)}</p>
            </div>
         </div>
      </div>
    </div>
  );
}

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams?.id;
  const router = useRouter();
  
  const [asset, setAsset] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<any[]>([]);
  // 控制删除弹窗显隐
  const [showDeleteModal, setShowDeleteModal] = useState(false); 
  // 新增：用于滚动定位的锚点引用
  const contentTopRef = useRef<HTMLDivElement>(null);

  // 计算当前选中的版本在列表中的序号（用于显示 v1.0, v2.0）
  const currentDisplayVer = versions.findIndex(v => v.version_num === selectedVersion?.version_num) + 1;
  // 定义一个 Ref，用来钩住那个“洞见卡片”
  const cardRef = useRef<HTMLDivElement>(null);

  // 内容工厂相关的状态 
  const [showFactory, setShowFactory] = useState(false); 
  const [aiConfig, setAiConfig] = useState<any>(null);
  const [userEmail, setUserEmail] = useState('');

  // 新增：加载 AI 配置和用户信息 (为了传给内容工厂) 
  useEffect(() => {
    // 读取本地存储的 AI Key
    const configStr = localStorage.getItem('ai_config');
    if (configStr) setAiConfig(JSON.parse(configStr));
    
    // 读取用户信息用于海报署名
    supabase.auth.getUser().then(({data}) => {
         if(data.user?.email) setUserEmail(data.user.email);
    });
  }, []);

  useEffect(() => {
    if (!id || id === 'undefined') return;

    const fetchData = async () => {
      try {
        // 👇 2. 获取用户凭证
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            router.push('/login');
            return;
        }

        // 👇 3. 准备带有 Token 的请求头
        const headers = {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
        };

        // 并行请求：资产详情 + 版本历史 + 关联星系
        const [assetRes, versionsRes, relatedRes] = await Promise.all([
            fetch(`${CONFIG.api.baseURL}/api/knowledge/assets/${id}`, { headers }),
            fetch(`${CONFIG.api.baseURL}/api/knowledge/assets/${id}/versions`, { headers }),
            fetch(`${CONFIG.api.baseURL}/api/knowledge/assets/${id}/related`, { headers })
        ]);

        if (assetRes.ok) {
            const assetData = await assetRes.json();
            setAsset(assetData);

            // 解析关联数据
            let relatedData = [];
            if (relatedRes.ok) {
                relatedData = await relatedRes.json();
            }
            setRelated(relatedData);

            // 解析版本历史
            let versionsData = [];
            if (versionsRes.ok) {
                versionsData = await versionsRes.json();
            }

            // --- 🛡️ 兜底方案：如果版本列表为空，手动补一个初始版本 ---
            if (versionsData.length === 0) {
                versionsData = [{
                    id: 'initial-' + assetData.id,
                    version_num: 1,
                    created_at: assetData.created_at,
                    content: assetData.content || {
                        title: assetData.title,
                        what: '', understand: '', where: '', action: '', why: ''
                    },
                    version_type: 'draft'
                }];
            }
            
            setVersions(versionsData);
            
            // 默认选中最后一个版本（最新版）
            setSelectedVersion(versionsData[versionsData.length - 1]);
        } else {
            if (assetRes.status === 401) {
                toast.error("登录过期，请重新登录");
                router.push('/login');
            } else {
                toast.error("加载资产失败");
            }
        }
      } catch (e) {
        console.error(e);
        toast.error("网络请求错误");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  // 👇 🛡️ 修改点 2：监听 selectedVersion 变化，自动滚屏
  useEffect(() => {
    // 只有在非加载状态，且是移动端（简单判断宽度，或者直接滚反正电脑端滚一下也没事）时生效
    // 为了体验更好，我们只在 window 存在且宽度小于 768 (md) 时强制滚动
    if (typeof window !== 'undefined' && window.innerWidth < 768 && contentTopRef.current) {
        // 稍微延迟一点点，等待渲染完成
        setTimeout(() => {
            contentTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
  }, [selectedVersion]); // 只要版本变了，就触发

  // 判断是否是最新版
  const isLatest = selectedVersion && versions.length > 0 && 
                   selectedVersion.version_num === versions[versions.length - 1].version_num;

  // A. 继续打磨 (升级资产)
  const handleEdit = () => {
    router.push(`/refine/${id}`);
  };

  // B. 销毁资产 (删除)
  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  // B. 确认删除：执行真正的 API 请求
  const confirmDelete = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${CONFIG.api.baseURL}/api/knowledge/assets/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${session.access_token}` // 删除也要带 Token
        }
      });
      
      if (res.ok) {
        toast.success("资产已彻底销毁");
        setShowDeleteModal(false);
        router.push('/assets'); 
      } else {
        throw new Error("删除失败");
      }
    } catch (e) {
      toast.error("操作失败，请重试");
      setShowDeleteModal(false);
    }
  };

   // 👇 2. 核心功能：生成图片并分享
 const handleShare = async () => {
    if (!cardRef.current) return;

    const toastId = toast.loading("正在生成高清卡片...");

    try {
      // --- 1. 创建替身 (Ghost Element) ---
      // 克隆当前的卡片节点
      const clone = cardRef.current.cloneNode(true) as HTMLElement;
      
      // 创建一个临时容器，放在 body 下面，脱离当前的滚动区域
      const container = document.createElement('div');
      
      // 设置容器样式：绝对固定，位置归零，背景白色
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      // 这里的 zIndex 设为 -9999 让用户看不见，但 html2canvas 能看见
      container.style.zIndex = '-9999'; 
      container.style.backgroundColor = '#ffffff';
      container.style.width = `${cardRef.current.offsetWidth}px`; // 锁定宽度，防止变形
      
      // 把克隆体塞进去
      container.appendChild(clone);
      document.body.appendChild(container);

      // --- 2. 对替身进行截图 ---
      // 等待一点点时间让 DOM 渲染
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(clone, {
        scale: 3, // 高清
        useCORS: true, 
        backgroundColor: '#ffffff',
        logging: false,
        // 因为是固定在 (0,0) 的替身，所以不需要算滚动条了，直接画
        scrollX: 0,
        scrollY: 0,
      });

      // --- 3. 销毁替身 (清理现场) ---
      document.body.removeChild(container);

      // --- 4. 导出与分发 (保持不变) ---
      canvas.toBlob(async (blob) => {
        if (!blob) {
            toast.dismiss(toastId);
            toast.error("生成失败");
            return;
        }

        const fileName = `${asset.title}知识存折洞见卡.png`;
        const file = new File([blob], fileName, { type: 'image/png' });
        
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        const canShare = navigator.canShare && navigator.canShare({ files: [file] });

        if (isMobile && canShare) {
            try {
                await navigator.share({
                    files: [file],
                    title: '知识存折洞见卡',
                    text: '我刚才存入了一个新知识，分享给你看看。'
                });
                toast.dismiss(toastId);
                toast.success("分享面板已唤起");
            } catch (err: any) {
                // 用户取消分享不报错
                if (err.name !== 'AbortError') {
                    console.error("分享失败，转为下载", err);
                    triggerDownload(blob, fileName); // 降级处理
                }
                toast.dismiss(toastId);
            }
        }  else {
            triggerDownload(blob, fileName);
            toast.dismiss(toastId);
            toast.success("卡片已下载");
        }

      }, 'image/png', 1.0);

    } catch (e) {
      console.error(e);
      toast.dismiss(toastId);
      toast.error("生成图片失败");
      // 万一出错，也要尝试清理容器，防止页面残留
      const container = document.querySelector('body > div[style*="z-index: -9999"]');
      if (container) document.body.removeChild(container);
    }
  };
  // 辅助函数：触发下载
  const triggerDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-slate-400">正在回溯时光...</div>;
  if (!asset || !selectedVersion) return <div className="flex h-screen items-center justify-center text-slate-400">未找到数据</div>;

  return (
    <div className="flex flex-col-reverse md:flex-row h-auto md:h-[calc(100vh-6rem)] gap-8 animate-in fade-in duration-500">
      
      {/* --- 左侧：时光轴 (Time Machine) --- */}
      {/* 👇👇👇 2. 修改左侧宽度：手机全宽，电脑固定宽 👇👇👇 */}
      <div className="w-full md:w-64 flex-shrink-0 flex flex-col">
        <Link href="/assets" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors font-bold text-sm">
            <ArrowLeft size={16}/> 返回存折
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex-1 overflow-y-auto custom-scrollbar">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <History size={18} className="text-primary-600"/>
                版本演进
            </h3>

            <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-10">
                {versions.map((ver, index) => {
                    const isSelected = selectedVersion.version_num === ver.version_num;
                    const isLast = index === versions.length - 1;
                    const displayVersion = index + 1;

                    return (
                        <div key={ver.id} className="relative pl-6 cursor-default group">
                            {/* 时间轴节点 */}
                            <div 
                                onClick={() => setSelectedVersion(ver)}
                                className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 transition-all duration-300 cursor-pointer ${
                                isSelected 
                                ? 'bg-primary-500 border-primary-500 scale-110 shadow-lg shadow-primary-500/30' 
                                : 'bg-white border-slate-300 group-hover:border-primary-400'
                            }`}></div>

                            {/* 版本卡片本体 */}
                            <div 
                                onClick={() => setSelectedVersion(ver)}
                                className={`transition-all duration-300 cursor-pointer ${isSelected ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                            >
                                <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    v{displayVersion}.0 
                                    {isLast && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-mono">CURRENT</span>}
                                </div>
                                <div className="text-xs text-slate-400 mt-1">
                                    {new Date(ver.created_at).toLocaleString()}
                                </div>
                                
                                <div className="mt-2 text-xs font-medium mb-2">
                                    {index === 0 ? (
                                        <span className="text-slate-500 flex items-center gap-1"><User size={12}/> 初始草稿</span>
                                    ) : (
                                        <span className="text-primary-600 flex items-center gap-1"><Bot size={12}/> AI 审计打磨</span>
                                    )}
                                </div>

                                {/* 操作栏 (只在最新版显示) */}
                                {isLast && (
                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 animate-in slide-in-from-top-2">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit();
                                            }}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-primary-50 text-primary-700 rounded-md text-[10px] font-bold hover:bg-primary-100 transition-colors"
                                            title="在此版本基础上继续打磨"
                                        >
                                            <PenLine size={12} />
                                            继续打磨
                                        </button>

                                        <button 
                                            onClick={handleDeleteClick} // 👈 修改这里
                                            className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl transition-all"
                                            title="销毁资产"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                )}   
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>

      {/* --- 右侧：内容展示区 (Content) --- */}
      {/* 👇👇👇 3. 修改右侧：手机端去掉圆角可能更好看，这里暂时保持圆角 加上 ref 标记，用于自动滚动👇👇👇 */}
      <div ref={contentTopRef} className="flex-1 bg-white md:rounded-3xl md:border md:border-slate-200 md:shadow-sm overflow-hidden flex flex-col relative h-auto md:h-full w-full">
         
         {/* 顶部 Header */}
         <div className="px-6 py-6 md:px-10 md:py-8 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row justify-between items-start gap-4 md:gap-0">
            {/* 标题和版本号 (左边) */}
            <div className="w-full md:w-auto">
                <div className="flex justify-between items-start">
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">{asset.title}</h1>
                    {/* 手机端的操作区：直接把分享放这里，只显示图标 */}
                    <div className="flex md:hidden gap-2 shrink-0">
                            {isLatest && (
                                <button 
                                    onClick={handleShare}
                                    className="p-2 bg-slate-900 text-white rounded-full shadow-lg active:scale-95 transition-all"
                                >
                                    <Share2 size={16} />
                                </button>
                            )}
                                {/* 手机端编辑删除也可以放这里，或者收进 ... 菜单 */}
                    </div>
                </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className={`px-3 py-1 rounded-full font-bold text-xs border ${
                        isLatest 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                        {isLatest ? '✅ 当前知识资产' : `📜 历史记录 v${currentDisplayVer ?? 0}.0`}
                    </span>
                <span className="flex items-center gap-1">
                    <Clock size={14}/> {new Date(selectedVersion.created_at).toLocaleString()}
                </span>
            </div>
          </div>
          

            {/* 👇👇👇 右上角操作区 (包含分享) 👇👇👇 */}
            <div className="hidden md:flex gap-2">
                {/* 只要是最新版，就允许分享 */}
                {isLatest && (
                    <button 
                        onClick={handleShare}
                        className="p-2.5 text-white bg-slate-900 hover:bg-black rounded-xl shadow-lg shadow-slate-900/20 transition-all flex items-center gap-2 px-4"
                        title="生成分享卡片"
                    >
                        <Share2 size={18} />
                        <span className="text-xs font-bold">分享</span>
                    </button>
                )}
            </div>
           
         </div>

         {/* 核心内容 Scroll 手机端 p-4，电脑端 p-10 (释放巨大空间)*/}
         <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
            <div className="max-w-3xl space-y-12 mx-auto">
                
                {/* 1. 核心资产卡片 (The Receipt) */}
                <section className="flex justify-center">
                    {/* 👇👇👇 截图专用容器 👇👇👇 */}
                    <div 
                        ref={cardRef} 
                        className="relative bg-white rounded-xl overflow-hidden w-full max-w-2xl"
                        // 这里的 style 是为了防止截图时样式丢失，强制白色背景
                        style={{ backgroundColor: '#ffffff' }} 
                    > 
                        {isLatest ? (
                            <InsightCard 
                                data={selectedVersion} 
                                version={currentDisplayVer} 
                                date={asset.minted_at || selectedVersion.created_at}
                                title={asset.title} // 核心：把主表的标题传给子组件
                            />
                        ) : (
                            <HistoryDraftView data={selectedVersion} />
                        )}
                        
                        {/* 隐形水印 (仅截图时存在感强，平时看不见或很淡) */}
                        <div className="absolute bottom-2 left-0 w-full text-center text-[10px] text-slate-100 opacity-0">
                            Generated by 知识存折
                        </div>
                    </div>
                </section>

                {/* 2. 关联图：只在最新版显示 */}
                {isLatest && (
                    <section className="mt-12">
                        <div className="flex items-center justify-between mb-6 px-2">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                                    <Network size={18}/>
                                </div>
                                知识星系图
                            </h3>
                        </div>
                        <div className="rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-200">
                            <GalaxyGraph centerTitle={asset.title} relatedNodes={related} />
                        </div>
                    </section>
                )}

                {/* 3. 详细文本内容 (Common) */}
                <div className="space-y-10 pt-8 border-t border-slate-100">
                    {/* 👇👇👇 修改这里：标题栏变成左右布局，放入【内容工厂】入口 👇👇👇 */}
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-900">完整思维快照</h3>
                        
                        {/* 内容变现入口 */}
                        {isLatest && (
                            <button 
                                onClick={() => setShowFactory(true)}
                                className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-full shadow-lg shadow-purple-500/20 transition-all hover:scale-105 active:scale-95"
                            >
                                <Wand2 size={14} className="animate-pulse" />
                                <span className="text-xs font-bold">生成自媒体文案</span>
                            </button>
                        )}
                    </div>

                    <div className="space-y-10">
                        {renderSection("核心定义 (What)", selectedVersion.content?.what)}
                        {renderSection("深度理解 (Understand)", selectedVersion.content?.understand)}
                        {renderSection("触发场景 (Where)", selectedVersion.content?.where)}
                        {renderSection("第一动作 (Action)", selectedVersion.content?.action, true)}
                        {renderSection("底层价值 (Why)", selectedVersion.content?.why)}
                    </div>
                </div>

                {/* 4. AI 的评价 */}
                {selectedVersion.coach_feedback && selectedVersion.coach_feedback.feedback && (
                    <div className="mt-12 p-6 bg-amber-50 rounded-2xl border border-amber-100">
                        <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                            <Bot size={18}/> 当时 AI 教练的建议：
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <span className="font-bold text-slate-800 block mb-1">指出问题：</span> 
                                <p className="text-slate-700 text-sm leading-relaxed">
                                    {/* 这里用 safeRender 防止 feedback 是对象 */}
                                    {safeRender(selectedVersion.coach_feedback.feedback)}
                                </p>
                            </div>
                            <div>
                                <span className="font-bold text-slate-800 block mb-1">修改建议：</span> 
                                <p className="text-slate-700 text-sm leading-relaxed">
                                    {safeRender(selectedVersion.coach_feedback.suggestion)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

            </div>
         </div>
      </div>
      {/* 统一风格的删除确认弹窗 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 transform scale-100 border border-slate-100">
            
            <div className="flex flex-col items-center text-center">
              {/* 红色警告图标 */}
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
                <Trash2 size={24} />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-2">确定销毁资产？</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                这将<span className="text-red-600 font-bold">永久删除</span>该资产及其所有历史版本。<br/>
                此操作不可恢复，您确定吗？
              </p>

              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-600/20 transition-colors"
                >
                  彻底销毁
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
      {/*  新增：渲染内容工厂弹窗 */}
      {showFactory && (
          <ContentFactoryModal 
              isOpen={showFactory}
              onClose={() => setShowFactory(false)}
              // 组合数据：把主表信息和当前版本内容拼在一起传过去
              data={selectedVersion ? { ...asset, content: selectedVersion.content } : asset}
              apiKeyConfig={aiConfig}
              userName={userEmail.split('@')[0]} // 截取邮箱前缀作为署名
          />
      )}

    </div>
  );
}

