"use client";
import { useState, useRef, useEffect } from 'react';
import { X, Copy, Download, Wand2, Loader2, RefreshCw, Smartphone, Video, Type, PenTool, ChevronUp, ChevronDown, Quote, Sparkles, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import XhsPoster from '@/components/XhsPoster';
import InsightCard from '@/components/InsightCard';
import { CONFIG } from '@/lib/config';
import { supabase } from '@/lib/supabaseClient';
import TextareaAutosize from 'react-textarea-autosize';


interface ContentFactoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any;
    apiKeyConfig: any;
    userName: string;
}

// 定义缓存结构
interface ContentCache {
    text: string;
    design?: {
        main_title: string;
        sub_title: string;
    } | null;
}

export default function ContentFactoryModal({ isOpen, onClose, data, apiKeyConfig, userName }: ContentFactoryModalProps) {
    const [mode, setMode] = useState<'xiaohongshu' | 'douyin'>('xiaohongshu');
    const [loading, setLoading] = useState(false);
    const captureRef = useRef<HTMLDivElement>(null);
    // 需要一个 exportRef 用于截图 (预览用的 ref 不需要了)
    const exportRef = useRef<HTMLDivElement>(null);

    // 控制封面编辑面板的折叠/展开
    const [showCoverEditor, setShowCoverEditor] = useState(false);
    // 👇 新增：控制文案区域折叠 (默认展开)
    const [showTextEditor, setShowTextEditor] = useState(true);

    // 👇 新增：海报风格状态
    const [posterStyle, setPosterStyle] = useState('notion');  // 默认Notion风格

    // 可选的海报风格
    const posterStyles = [
        { value: 'knowledge', label: '📚 知识干货' },
        { value: 'notion', label: '📝 Notion笔记' },
        { value: 'book', label: '📖 读书笔记' },
        { value: 'blackboard', label: '🎓 黑板报' },
        { value: 'minimal', label: '✨ 极简主义' },
        { value: 'highlight', label: '🖍️ 荧光笔记' },
    ];
    // 👇 辅助函数：互斥切换
    const toggleSection = (section: 'text' | 'cover') => {
        if (section === 'text') {
            setShowTextEditor(!showTextEditor);
            // 如果打开文案，建议把封面关掉，给文案腾地方（可选）
            if (!showTextEditor) setShowCoverEditor(false);
        } else {
            setShowCoverEditor(!showCoverEditor);
            // 如果打开封面编辑器，强烈建议把文案关掉，因为用户此时关注的是视觉
            if (!showCoverEditor) setShowTextEditor(false);
        }
    };


    // 缓存状态
    const [cache, setCache] = useState<{
        xiaohongshu: ContentCache;
        douyin: ContentCache;
    }>({
        xiaohongshu: {
            text: '',
            design: {
                main_title: data.title,
                sub_title: data.content?.understand || data.content?.what || ''
            }
        },
        douyin: { text: '' }
    });

    const currentContent = cache[mode].text;
    const currentDesign = cache['xiaohongshu'].design || { main_title: data.title, sub_title: '' };

    useEffect(() => {
        // 首次打开且无内容时自动生成
        if (isOpen && !currentContent && !loading) {
            generateContent();
        }
    }, [isOpen, mode]);

    const generateContent = async () => {
        if (!apiKeyConfig?.apiKey) {
            toast.error("请先在配置中心设置 API Key");
            return;
        }

        setLoading(true);
        // 注意：这里不清空 text，只显示 loading 状态，体验更好

        try {
            const { data: { session } } = await supabase.auth.getSession();

            const res = await fetch(`${CONFIG.api.baseURL}/api/knowledge/generate_content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                    'x-api-key': apiKeyConfig.apiKey,
                    'x-base-url': apiKeyConfig.baseUrl,
                    'x-model': apiKeyConfig.model
                },
                body: JSON.stringify({
                    title: data.title,
                    what: data.content.what,
                    understand: data.content.understand,
                    where: data.content.where,
                    action: data.content.action,
                    why: data.content.why,
                    platform: mode
                })
            });

            if (!res.ok) throw new Error("生成失败");
            const json = await res.json();
            const rawContent = json.content;

            if (mode === 'xiaohongshu') {
                try {
                    const cleanJson = rawContent.replace(/```json|```/g, '').trim();
                    const parsed = JSON.parse(cleanJson);

                    setCache(prev => ({
                        ...prev,
                        xiaohongshu: {
                            text: parsed.note_content || rawContent,
                            design: parsed.cover_design || prev.xiaohongshu.design
                        }
                    }));
                } catch (e) {
                    setCache(prev => ({
                        ...prev,
                        xiaohongshu: { ...prev.xiaohongshu, text: rawContent }
                    }));
                }
            } else {
                setCache(prev => ({
                    ...prev,
                    douyin: { text: rawContent }
                }));
            }

        } catch (e) {
            toast.error("AI 思考超时，请重试");
        } finally {
            setLoading(false);
        }
    };

    const copyText = () => {
        if (!currentContent) return;
        navigator.clipboard.writeText(currentContent);
        toast.success("文案已复制");
    };

    const downloadImage = async () => {
        const element = exportRef.current;

        // 检查局部变量
        if (!element) return;
        // if (!captureRef.current) return;
        const toastId = toast.loading("正在渲染高清海报...");
        try {
            await new Promise(r => setTimeout(r, 500));
            const scale = mode === 'xiaohongshu' ? 2 : 3;
            const bgColor = mode === 'xiaohongshu' ? '#fdfbf7' : '#ffffff';

            // 截取那个没有被缩放的、看不见的 DOM
            const canvas = await html2canvas(element, {
                scale: scale,
                useCORS: true,
                backgroundColor: bgColor,
                logging: false,
                x: 0,
                y: 0,
                scrollX: 0,
                scrollY: 0,
                // 👇👇👇 显式指定宽高，防止计算偏差 👇👇👇
                width: 600,
                height: 800,
                windowWidth: 1920, // 假装在一个大屏幕上渲染
                windowHeight: 1080
            });

            const url = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.download = `${mode}-${data.title}.png`;
            link.href = url;
            link.click();
            toast.dismiss(toastId);
            toast.success("图片已保存");
        } catch (e) {
            toast.dismiss(toastId);
            toast.error("保存失败");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-0 md:p-4 animate-in fade-in duration-300">

            <div className="bg-white w-full max-w-6xl h-full md:h-[90vh] md:rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative">

                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full z-50 transition-colors">
                    <X size={20} />
                </button>

                {/* ================= 移动端布局 (md:hidden) ================= */}
                {/* 思路：顶部 Tabs -> 中间滚动区 -> 底部固定操作栏 */}
                <div className="flex flex-col h-full md:hidden">

                    {/* 1. 顶部 Header & Tabs */}
                    <div className="shrink-0 bg-white border-b border-slate-100 z-20">
                        <div className="flex items-center gap-2 px-4 py-3">
                            <div className="p-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg"><Wand2 size={16} /></div>
                            <h2 className="text-base font-bold text-slate-900">内容工厂</h2>
                        </div>
                        <div className="flex px-1 pb-2 gap-2">
                            <button onClick={() => setMode('xiaohongshu')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${mode === 'xiaohongshu' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>小红书</button>
                            <button onClick={() => setMode('douyin')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${mode === 'douyin' ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-500'}`}>抖音</button>
                        </div>
                    </div>

                    {/* 2. 中间滚动内容区 (flex-1) */}
                    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-6 pb-32"> {/* pb-32 为了防止被底部栏遮挡 */}

                        {/* 文案展示 */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
                            <button
                                onClick={() => toggleSection('text')}
                                className="w-full flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-100"
                            >
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase">
                                    <Type size={14} />
                                    {mode === 'douyin' ? '拍摄脚本' : '笔记正文'}
                                    {/* 如果折叠了，显示字数提示 */}
                                    {!showTextEditor && currentContent && <span className="text-slate-400 font-normal">({currentContent.length}字)</span>}
                                </div>
                                {showTextEditor ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                            </button>

                            {showTextEditor && (
                                <div className="p-3 animate-in slide-in-from-top-2 border-t border-slate-100">
                                    <TextareaAutosize
                                        className="w-full bg-transparent resize-none outline-none text-sm leading-relaxed text-slate-700 min-h-[150px]"
                                        minRows={13}
                                        value={currentContent}
                                        onChange={(e) => setCache(prev => ({ ...prev, [mode]: { ...prev[mode], text: e.target.value } }))}
                                        placeholder="AI 生成中..."
                                    />
                                </div>
                            )}
                        </div>



                        {/* 封面编辑 (仅小红书) - 之前被覆盖了，现在加回来 */}
                        {mode === 'xiaohongshu' && (
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 mt-4">
                                <div
                                    className="flex justify-between items-center text-xs font-bold text-slate-500"
                                    onClick={() => setShowCoverEditor(!showCoverEditor)}
                                >
                                    <span>封面文字调整</span>
                                    {showCoverEditor ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </div>

                                {/* 默认展开，或者根据状态 */}
                                {showCoverEditor && (
                                    <div className="space-y-4 pt-2 border-t border-slate-100">
                                        <div className="space-y-2">
                                            <input type="text" value={currentDesign.main_title} onChange={(e) => setCache(prev => ({ ...prev, xiaohongshu: { ...prev.xiaohongshu, design: { ...currentDesign, main_title: e.target.value } } }))} className="w-full p-2 bg-slate-50 rounded text-sm font-bold" placeholder="主标题" />
                                            <TextareaAutosize value={currentDesign.sub_title} onChange={(e) => setCache(prev => ({ ...prev, xiaohongshu: { ...prev.xiaohongshu, design: { ...currentDesign, sub_title: e.target.value } } }))} className="w-full p-2 bg-slate-50 rounded text-sm" minRows={2} placeholder="副标题" />
                                        </div>

                                        {/* 海报风格选择下拉框 */}
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-400">海报风格</label>
                                            <div className="relative">
                                                <select
                                                    value={posterStyle}
                                                    onChange={(e) => setPosterStyle(e.target.value)}
                                                    className="w-full p-2.5 bg-slate-50 rounded-lg text-sm font-bold appearance-none border border-slate-200"
                                                >
                                                    {posterStyles.map((s) => (
                                                        <option key={s.value} value={s.value}>{s.label}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 海报预览 */}
                        {mode === 'xiaohongshu' && (
                            <div className="w-full flex justify-center mt-4">
                                {/* 
                            1. 外层容器：限制高度，隐藏溢出 
                            高度计算：800px * 0.55 ≈ 440px，留一点余量设为 460px
                         */}
                                <div className="relative w-full overflow-hidden" style={{ height: '460px' }}>

                                    {/* 
                                2. 缩放容器：
                                - scale-[0.55]: 600px * 0.55 = 330px (适配大多数手机)
                                - origin-top: 从顶部开始缩放
                                - left-1/2 -translate-x-1/2: 强制水平居中
                            */}
                                    <div
                                        className="absolute top-0 left-1/2 -translate-x-1/2 shadow-xl rounded-lg border-2 border-slate-100 origin-top"
                                        style={{ transform: 'translateX(-50%) scale(0.55)' }}
                                    >
                                        {/* 这里只是预览，不需要 ref，也不需要是高保真，只要用户看个大概 */}
                                        <XhsPoster data={data} authorName={userName} aiDesign={currentDesign} style={posterStyle} />
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* 3. 底部固定操作栏 (Sticky Footer) */}
                    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-3 px-4 z-50 pb-safe">
                        <div className="flex gap-3">
                            {/* 重写按钮 */}
                            <button onClick={generateContent} disabled={loading} className="p-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">
                                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                            </button>

                            {/* 复制文案 */}
                            <button onClick={copyText} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2">
                                <Copy size={18} /> 文案
                            </button>

                            {/* 下载海报 (仅小红书) */}
                            {mode === 'xiaohongshu' && (
                                <button onClick={downloadImage} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 flex items-center justify-center gap-2">
                                    <Download size={18} /> 下载海报
                                </button>
                            )}
                        </div>
                    </div>
                </div>


                {/* ================= 电脑端布局 (hidden md:flex) ================= */}
                {/* --- 左侧：控制台 --- */}
                <div className="hidden md:flex w-full md:w-1/3 p-6 flex flex-col border-r border-slate-100 bg-white z-20">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg"><Wand2 size={20} /></div>
                        <h2 className="text-xl font-bold text-slate-900">内容工厂</h2>
                    </div>

                    {/* 模式切换 */}
                    <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
                        <button
                            onClick={() => setMode('xiaohongshu')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'xiaohongshu' ? 'bg-white text-red-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Smartphone size={16} /> 小红书图文
                        </button>
                        <button
                            onClick={() => setMode('douyin')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'douyin' ? 'bg-white text-black shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Video size={16} /> 抖音文案
                        </button>
                    </div>

                    {/* 文案/脚本 显示区 (占据剩余最大空间) */}
                    <div className="flex-1 min-h-0 w-full flex flex-col">
                        <div className="flex-1 flex flex-col bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative">
                            {/* Loading 遮罩 */}
                            {loading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3 bg-white/80 backdrop-blur-sm z-10">
                                    <Loader2 className="animate-spin text-purple-600" size={32} />
                                    <p className="text-sm font-medium animate-pulse">AI 正在撰写 {mode === 'xiaohongshu' ? '笔记' : '脚本'}...</p>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <TextareaAutosize
                                    className="w-full bg-transparent p-4 resize-none outline-none text-sm leading-relaxed text-slate-700 font-sans min-h-full overflow-hidden"
                                    minRows={10}
                                    value={currentContent}
                                    onChange={(e) => setCache(prev => ({
                                        ...prev,
                                        [mode]: { ...prev[mode], text: e.target.value }
                                    }))}
                                    placeholder="等待 AI 生成..."
                                />
                            </div>
                        </div>
                    </div>
                    {/* 👇👇👇 核心修复：折叠式封面编辑器 👇👇👇 */}
                    {mode === 'xiaohongshu' && (
                        <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden shrink-0 transition-all">
                            {/* 触发条 */}
                            <button
                                onClick={() => setShowCoverEditor(!showCoverEditor)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                            >
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                    <PenTool size={14} /> 调整封面文字
                                </div>
                                {showCoverEditor ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronUp size={16} className="text-slate-400" />}
                            </button>

                            {/* 折叠内容 */}
                            {showCoverEditor && (
                                <div className="p-4 bg-white border-t border-slate-200 space-y-3 animate-in slide-in-from-top-2">
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold mb-1 block uppercase">封面标题</label>
                                        <input
                                            type="text"
                                            value={currentDesign.main_title}
                                            onChange={(e) => setCache(prev => ({
                                                ...prev,
                                                xiaohongshu: {
                                                    ...prev.xiaohongshu,
                                                    design: { ...currentDesign, main_title: e.target.value }
                                                }
                                            }))}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold mb-1 block uppercase">封面内容</label>
                                        <TextareaAutosize
                                            value={currentDesign.sub_title}
                                            onChange={(e) => setCache(prev => ({
                                                ...prev,
                                                xiaohongshu: {
                                                    ...prev.xiaohongshu,
                                                    design: { ...currentDesign, sub_title: e.target.value }
                                                }
                                            }))}
                                            minRows={1}
                                            // rows={3}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-purple-500/20 outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {/* 👆👆👆 修复结束 👆👆👆 */}

                    {/* 底部按钮 */}
                    <div className="mt-4 flex gap-3 ">
                        <button onClick={copyText} className="px-2 py-1 text-sm bg-white border border-slate-200 text-slate-900 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-sm">
                            <Copy size={12} /> 复制文案
                        </button>

                        <button onClick={generateContent} disabled={loading} className="ml-auto px-2 py-1 text-sm border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2">
                            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                            <span >生成文案</span>
                        </button>

                    </div>
                </div>


                {/* --- 右侧：视觉预览区 (保持不变) --- */}
                <div className="flex-1 bg-slate-100 p-8 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"></div>

                    {mode === 'xiaohongshu' ? (
                        <>
                            {/* 预览区域：显示 AI 海报或模板海报 */}
                            <div className="relative shadow-2xl rounded-lg overflow-hidden border-4 border-white transition-all duration-500"
                                style={{
                                    transform: 'scale(0.5)',
                                    transformOrigin: 'top center',
                                    marginBottom: '-50%'
                                }}>
                                {/* 显示模板海报 */}
                                <div ref={captureRef}>
                                    <XhsPoster data={data} authorName={userName} aiDesign={currentDesign} style={posterStyle} />
                                </div>
                            </div>

                            <div className="absolute bottom-8 left-0 w-full flex justify-center items-center gap-4 z-50">
                                <button onClick={downloadImage} className="h-12 px-6 bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95">
                                    <Download size={18} /> 下载高清海报
                                </button>

                                <div className="h-12 relative">
                                    <select
                                        value={posterStyle}
                                        onChange={(e) => setPosterStyle(e.target.value)}
                                        className="h-full px-4 pr-10 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 cursor-pointer shadow-sm hover:bg-slate-50 transition-colors appearance-none"
                                    >
                                        {posterStyles.map((s) => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        <ChevronDown size={14} />
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        // 抖音模式占位
                        <div className="text-slate-400 flex flex-col items-center">
                            <Video size={48} className="mb-2 opacity-50" />
                            <p>视频脚本模式无需海报</p>
                        </div>
                    )}
                    {/* 这里的组件是 1:1 原始尺寸，专门用来截图的，用户看不见 */}
                    <div style={{
                        position: 'fixed',
                        left: '-9999px',
                        top: 0,
                        zIndex: -1,
                        width: '600px',   // 👈 强制宽度
                        height: '800px',  // 👈 强制高度
                        overflow: 'hidden' // 防止溢出
                    }}>
                        <div ref={exportRef} style={{ width: '600px', height: '800px' }}>
                            {mode === 'xiaohongshu' ? (
                                <XhsPoster data={data} authorName={userName} aiDesign={currentDesign} style={posterStyle} />
                            ) : (
                                <InsightCard data={data} version={data.current_version || 1} date={data.minted_at || new Date().toISOString()} title={data.title} />
                            )}
                        </div>
                    </div>
                </div>




            </div>
        </div>
    );
}