"use client";
export const runtime = 'edge';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import TextareaAutosize from 'react-textarea-autosize'; 
import { 
  ArrowLeft, 
  Save, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Bot, 
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import VoiceInput from '@/components/VoiceInput';
import { supabase } from '@/lib/supabaseClient';   // 引入 supabase
import { CONFIG } from '@/lib/config';


// 预设一些推荐的，但允许用户不选
const SUGGESTED_TAGS = ['决策', '技能', '心态', '沟通', '商业', '健康'];
// 防止数据库里存了脏数据（对象）导致页面白屏
function safeRender(content: any): string {
    if (!content) return '';
    // 1. 如果是字符串，尝试清理一下可能残留的数组符号
    if (typeof content === 'string') {
        // 如果后端没洗干净，这里做个兜底，去掉开头结尾的 [" "]
        if (content.trim().startsWith('["') && content.trim().endsWith('"]')) {
             try {
                 const parsed = JSON.parse(content);
                 if (Array.isArray(parsed)) return parsed.join('\n'); // 换行显示
             } catch(e) {}
        }
        return content;
    }
    
    // 2. 如果本身就是数组，用换行符拼接
    if (Array.isArray(content)) {
        return content.join('\n');
    }
    
    // 3. 如果是对象，转 JSON 但【不再截断】
    if (typeof content === 'object') {
        return JSON.stringify(content, null, 2); // 格式化显示
    }
    
    return String(content);
}

export default function RefinePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams?.id;
  const router = useRouter();
  // 表单状态
  const [form, setForm] = useState({
    title: '加载中...', 
    what: '',
    understand: '',
    where: '',
    action: '',
    why: ''
  });
  
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(false); // AI 思考中
  const [minting, setMinting] = useState(false); // 入库中
  // 新增一个状态来显示当前版本
  const [currentVersion, setCurrentVersion] = useState(0);
  // 新增：选中的标签状态 (默认空)
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  // 👇 新增：控制校验弹窗的类型 ('tags' | 'content' | null)
  const [validationError, setValidationError] = useState<'tags' | 'content' | null>(null);

  // ✅ 真实实现：从后端获取资产详情
  // 获取详情并回显数据 (Restore Data)
  useEffect(() => {
    if (!id || id === 'undefined') return;
    const fetchAssetDetail = async () => {
      try {
        // 👇 获取 Token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            router.push('/login');
            return;
        }

        const res = await fetch(`${CONFIG.api.baseURL}/api/knowledge/assets/${id}`, {
            headers: {
                'Authorization': `Bearer ${session.access_token}` // 👈 加上这行
            }
        });

        if (res.ok) {
          const data = await res.json();
          
          setForm(prev => ({ ...prev, title: data.title || '未命名资产' }));
          
          if (data.tags && Array.isArray(data.tags)) {
            setSelectedTags(data.tags);
          }

          if (data.content) {
            setForm(prev => ({
                ...prev,
                what: data.content.what || '',
                understand: data.content.understand || '',
                where: data.content.where || '',
                action: data.content.action || '',
                why: data.content.why || '',
            }));
          }

          if (data.coach_feedback && Object.keys(data.coach_feedback).length > 0) {
             setFeedback(data.coach_feedback);
          }
          
          // 如果有 current_version，也可以在这里设置初始值
          if (data.current_version) setCurrentVersion(data.current_version);

        } else {
          // 401 会在这里被捕获
          if (res.status === 401) {
              toast.error("登录过期，请重新登录");
              router.push('/login');
          } else {
              toast.error("读取存档失败");
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchAssetDetail();
  }, [id, router]);

  // 提交给 AI 教练
  const handleSubmit = async () => {
    // 1. 检查配置
    const configStr = localStorage.getItem('ai_config');
    if (!configStr) {
      // 👇 高级交互：带操作按钮的 Toast
      toast.warning("AI 教练未就位", {
        description: "您需要先配置 API Key 才能使用审计功能。",
        action: {
          label: "去配置",
          onClick: () => router.push('/settings')
        },
        duration: 5000,
      });
      return; 
    }
    const config = JSON.parse(configStr);
    // 获取 Token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }

    setLoading(true);
    // 使用 toast.promise 来展示加载状态，体验极佳
    const promise = fetch(`${CONFIG.api.baseURL}/api/knowledge/refine`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'x-api-key': config.apiKey || '',
            'x-base-url': config.baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            'x-model': config.model || 'qwen-plus'
        },
        body: JSON.stringify({
            asset_id: id,
            content: form,
        }),
    }).then(async (res) => {
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || "审计失败，请检查 AI 配置或网络连接");
        }
        const data = await res.json();
        setFeedback(data); // 注意：后端直接返回的就是 {feedback, suggestion}
        // 如果后端返回了版本号，可以在这里更新
        if (data.version) setCurrentVersion(data.version);
        return data;
    });

    toast.promise(promise, {
        loading: 'AI 教练正在深度审计您的思考...',
        success: (data) => `审计完成！当前版本 v${data.version}`,
        error: (err) => `审计失败: ${err.message}`
    });
    
    setLoading(false);
  };

  // 保存草稿 (Real Save)
  const handleSaveDraft = async () => {
    if (!id || id === 'undefined') {
        toast.error("保存失败：无效的资产ID");
        return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    // 简单的保存加载动画
    const promise = fetch(`${CONFIG.api.baseURL}/api/knowledge/draft/${id}`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
         },
        body: JSON.stringify({
            content: form,
            tags: selectedTags,
            coach_feedback: feedback || {} //关键：把当前界面上的 AI 建议也传回去存起来
        })
    }).then(async (res) => {
        if (!res.ok) throw new Error("保存失败");
        return res.json();
    });

    toast.promise(promise, {
        loading: '正在同步到云端...',
        success: () => {
            // 保存成功后延迟跳转，体验更好
            setTimeout(() => router.push('/'), 500);
            return "草稿已保存 (v" + (currentVersion + 1) + ")";
        },
        error: "保存失败，请重试"
    });
  };  

  // 盖章入库
  const handleMint = async () => {
    if (!id || id === 'undefined') {
        toast.error("入库失败：无效的资产ID");
        return;
    }
    // 增加校验：必须选一个标签才能入库
    // 🛡️ 强校验：必须有标签
    if (selectedTags.length === 0) {
        setValidationError('tags'); // 👈 改为打开弹窗
        return;
        }
    if (!form.what.trim() || !form.understand.trim()) {
        setValidationError('content'); // 触发内容错误弹窗
        return;
    }
    // 获取配置
    const configStr = localStorage.getItem('ai_config');
    const config = configStr ? JSON.parse(configStr) : {};
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setMinting(true);
    // 同样使用 promise toast
    toast.promise(
        fetch(`${CONFIG.api.baseURL}/api/knowledge/mint/${id}`, { 
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
                // 关键：带上 Key，后端才能生成向量
                'x-api-key': config.apiKey || '', // 允许为空(不生成向量),
                'x-base-url': config.baseUrl || ''
             },
            body: JSON.stringify({ 
                content: form,
                tags: selectedTags // 发送真实标签

             })
        }),
        {
            loading: '正在铸造知识资产...',
            success: () => {
                setTimeout(() => router.push('/assets'), 1000);
                return "🎉 知识资产铸造成功！已存入您的永久知识存折。";
            },
            error: "入库失败，请重试"
        }
    );
    
    setMinting(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-auto md:h-[calc(100vh-6rem)] gap-6 animate-in fade-in duration-500 relative pt-6">
      
      {/* --- 左侧栏：AI 认知教练 (Fixed Sidebar Style) --- */}
      {/* 返回按钮 */}
        <Link href="/" className="absolute top-0 left-4 z-50 inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 -mt-4">
            <div className="p-2 rounded-full bg-white border border-slate-200 hover:border-primary-500">
            <ArrowLeft size={16} />
            </div>
            <span className="font-bold text-sm">返回工作台</span>
        </Link>
    
      {/*  修改左侧宽度：手机全宽，电脑1/3  */}
      <div className="w-full md:w-1/3 flex flex-col gap-4 order-2 md:order-1 pt-1">

        {/* 教练面板 */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
                <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
                    <Bot size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">认知教练</h3>
                </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
                {feedback ? (
                    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                        {/* 发现问题 */}
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex-shrink-0 flex items-center justify-center text-amber-600">
                                <AlertCircle size={16} />
                            </div>
                            <div className="bg-amber-50 p-4 rounded-2xl rounded-tl-none text-slate-700 text-sm border border-amber-100">
                                <p className="font-bold text-amber-800 mb-1">发现模糊点：</p>
                                "{safeRender(feedback.feedback)}"
                            </div>
                        </div>

                        {/* 给出建议 */}
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-100 flex-shrink-0 flex items-center justify-center text-primary-600">
                                <Sparkles size={16} />
                            </div>
                            <div className="bg-white p-4 rounded-2xl rounded-tl-none text-slate-700 text-sm border border-primary-100 shadow-sm">
                                <p className="font-bold text-primary-700 mb-1">建议修改方向：</p>
                                {safeRender(feedback.suggestion)}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-8">
                        <Bot size={48} className="mb-4 text-slate-200" />
                        <p className="text-sm">
                            你好，我是你的 AI 教练。<br/>
                            请在右侧完善你的思考，完成后点击底部按钮，我会帮你进行<b>“知识内化打磨”</b>。
                        </p>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* --- 右侧栏：资产铸造工作台 --- */}
      {/* 👇👇👇 3. 修改右侧高度：手机给定高(防止无限长)，电脑自动 👇👇👇 */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative h-[80vh] md:h-auto order-1 md:order-2">
         {/* 顶部状态栏 */}
         <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
            <div>
                <div className="flex items-center gap-2 text-xs font-bold text-primary-600 uppercase tracking-wider mb-1">
                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
                    知识铸造中
                </div>
                <h1 className="text-xl font-bold text-slate-900">{safeRender(form.title)}深度学习</h1>
            </div>
            
            <div className="flex gap-3">
                <button 
                    onClick={handleSaveDraft} 
                    className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                >
                    <Save size={16}/> 存入草稿
                </button>
                {feedback && (
                    <button 
                        onClick={handleMint}
                        disabled={minting}
                        className="px-6 py-2 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-lg text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                    >
                        {minting ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>}
                        盖章入库
                    </button>
                )}
            </div>
         </div>

         {/* 表单滚动区 */}
         <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-8 pb-10">
                {/* 新增：标签选择区 */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <label className="block text-sm font-bold text-slate-500 mb-3">
                        0. 资产分类 (Tags) <span className="text-red-400">*</span>
                    </label>
                    
                    {/* 已选标签展示 */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {selectedTags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-slate-900 text-white rounded-lg text-sm font-bold flex items-center gap-2">
                                {tag}
                                <button 
                                    onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                                    className="hover:text-red-300"
                                >
                                    &times;
                                </button>
                            </span>
                        ))}
                    </div>

                    {/* 输入 + 推荐 */}
                    <div className="flex gap-2 mb-3 w-full">
                        {/* 输入框：flex-1 自动缩放，min-w-0 防止溢出 */}
                        <input 
                            type="text" 
                            placeholder="输入新标签 (回车添加)" 
                            className="flex-1 min-w-0 px-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
                                        setSelectedTags([...selectedTags, newTag.trim()]);
                                        setNewTag('');
                                    }
                                }
                            }}
                        />
                        {/* 按钮：flex-shrink-0 禁止被挤扁 */}
                        <button 
                            onClick={() => {
                                if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
                                    setSelectedTags([...selectedTags, newTag.trim()]);
                                    setNewTag('');
                                }
                            }}
                            className="flex-shrink-0 px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-sm font-bold text-slate-600 whitespace-nowrap"
                        >
                            添加
                        </button>
                    </div>

                    {/* 推荐候选区 */}
                    <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-slate-400 py-1">推荐:</span>
                        {SUGGESTED_TAGS.filter(t => !selectedTags.includes(t)).map(tag => (
                            <button
                                key={tag}
                                onClick={() => setSelectedTags([...selectedTags, tag])}
                                className="px-3 py-1 border border-slate-200 rounded-full text-xs text-slate-500 hover:border-primary-500 hover:text-primary-600 bg-white transition-colors"
                            >
                                + {tag}
                            </button>
                        ))}
                    </div>
                </div>
                {/* 5问循环渲染 */}
                {[
                    { id: 'what', label: '1. 它的核心定义', placeholder: '用一句话描述这个核心概念...' },
                    { id: 'understand', label: '2. 怎么理解', placeholder: '拒绝书面语，用自己的大白话解释一遍...' },
                    { id: 'where', label: '3. 触发场景', placeholder: '在什么具体情况下能用到它？' },
                    { id: 'action', label: '4. 第一动作', placeholder: '下次遇到这种情况，5分钟内可执行的具体动作是什么？' },
                    { id: 'why', label: '5. 为什么值得存', placeholder: '它解决了你的什么痛点？' },
                ].map((field) => (
                    <div key={field.id} className="group">
                        {/* 标题栏：左标题，右语音 (仅电脑端显示语音) */}
                        <div className="flex justify-between items-center mb-3 px-1">
                            <label className="block text-sm font-bold text-slate-500 group-focus-within:text-primary-600 transition-colors">
                                {field.label}
                            </label>
                            
                            {/* 语音按钮：手机隐藏(hidden)，中屏以上显示(md:block) */}
                            <div className="hidden md:block">
                                <VoiceInput 
                                    onResult={(text) => {
                                        const currentVal = (form as any)[field.id];
                                        const newVal = currentVal ? currentVal + " " + text : text;
                                        setForm(prev => ({...prev, [field.id]: newVal}));
                                    }}
                                />
                            </div>
                        </div>
                        
                        {/* 输入框区域 */}
                        <div className="relative">
                            <TextareaAutosize
                                className="w-full p-5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all resize-none shadow-sm placeholder:text-slate-300 text-base leading-relaxed"
                                minRows={3}   // 默认显示 3 行的高度
                                placeholder={field.placeholder}
                                value={(form as any)[field.id]}
                                onChange={(e) => setForm({...form, [field.id]: e.target.value})}
                            />
                            {/* 装饰性文件图标 */}
                            <div className="absolute right-4 top-4 text-slate-300 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none">
                                <FileText size={18}/>
                            </div>
                        </div>
                    </div>
                ))}


                {/* 提交按钮 (仅在未获得反馈时显示) */}
                {!feedback && (
                    <div className="pt-4">
                        <button 
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-600/30 transition-all active:scale-[0.99] flex justify-center items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin"/>
                                    AI 教练正在深度审计...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={20} />
                                    提交给 AI 教练审计
                                </>
                            )}
                        </button>
                        <p className="text-center text-xs text-slate-400 mt-3">
                            完善输入后点击上方按钮，教练将为你提供打磨建议。
                        </p>
                    </div>
                )}
            </div>
         </div>
      </div>

      {/* 统一风格的校验警告弹窗 (包含标签校验 + 内容校验)  */}
      {validationError && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 transform scale-100 border border-slate-100">
            
            <div className="flex flex-col items-center text-center">
              {/* 统一的琥珀色警告图标 */}
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-4 text-amber-500">
                <AlertCircle size={24} />
              </div>
              
              {/* 动态标题 */}
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {validationError === 'tags' ? '资产无法入库' : '内容不完整'}
              </h3>
              
              {/* 动态描述文案 */}
              <p className="text-slate-500 text-sm mb-6 leading-relaxed px-2">
                {validationError === 'tags' ? (
                  <>
                    为了方便未来建立知识星系，<br/>
                    请至少选择一个 <span className="text-slate-800 font-bold">分类标签 (Tag)</span>。
                  </>
                ) : (
                  <>
                    为了保证资产质量，请务必填写<br/>
                    <span className="text-slate-800 font-bold">“核心定义”</span> 和 <span className="text-slate-800 font-bold">“大白话理解”</span>。
                  </>
                )}
              </p>

              {/* 统一风格的按钮 */}
              <button 
                onClick={() => {
                    // 1. 关闭弹窗
                    const errorType = validationError; // 暂存类型以便判断滚动位置
                    setValidationError(null);

                    // 2. 智能滚动定位
                    if (errorType === 'tags') {
                        // 滚到标签区
                        document.querySelector("label")?.scrollIntoView({ behavior: "smooth" });
                    } else {
                        // 滚到第一个输入框
                        document.querySelector("textarea")?.scrollIntoView({ behavior: "smooth" });
                    }
                }}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black shadow-lg shadow-slate-900/20 transition-colors"
              >
                {validationError === 'tags' ? '好的，去选标签' : '好的，去补充内容'}
              </button>
            </div>

          </div>
        </div>
      )}


    </div>
  );
}