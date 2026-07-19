"use client";

interface XhsPosterProps {
  data: any;
  authorName?: string;
  aiDesign?: {
    main_title: string;
    sub_title: string;
  } | null;
  style?: string;
}

export default function XhsPoster({
  data,
  authorName = "知识存折",
  aiDesign,
  style = "notion"
}: XhsPosterProps) {
  if (!data) return null;
  const c = data.content || {};

  const displayTitle = aiDesign?.main_title || data.title;
  const displayQuote = aiDesign?.sub_title || c.understand || c.what || "暂无核心洞见";
  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  // 根据风格渲染不同的模板
  switch (style) {
    case 'knowledge':
      return <KnowledgeStyle title={displayTitle} quote={displayQuote} date={today} />;
    case 'notion':
      return <NotionStyle title={displayTitle} quote={displayQuote} date={today} />;
    case 'book':
      return <BookStyle title={displayTitle} quote={displayQuote} date={today} />;
    case 'blackboard':
      return <BlackboardStyle title={displayTitle} quote={displayQuote} date={today} />;
    case 'minimal':
      return <MinimalStyle title={displayTitle} quote={displayQuote} date={today} />;
    case 'highlight':
      return <HighlightStyle title={displayTitle} quote={displayQuote} date={today} />;
    default:
      return <NotionStyle title={displayTitle} quote={displayQuote} date={today} />;
  }
}

interface StyleProps {
  title: string;
  quote: string;
  date: string;
}

// 📚 知识干货风格 - 温暖优雅
function KnowledgeStyle({ title, quote, date }: StyleProps) {
  return (
    <div id="xhs-poster" className="relative w-[600px] h-[800px] shrink-0 overflow-hidden">
      {/* 奶白色背景 */}
      <div className="absolute inset-0 bg-[#faf6f0]" />

      {/* 装饰圆形 - 左上角橙色 */}
      <div className="absolute -top-24 -left-24 w-[300px] h-[300px] bg-gradient-to-br from-orange-200/90 via-amber-100/80 to-orange-50/60 rounded-full" />

      {/* 装饰圆形 - 右下角粉色 */}
      <div className="absolute -bottom-16 -right-16 w-[240px] h-[240px] bg-gradient-to-tl from-pink-300/70 via-rose-200/60 to-pink-100/40 rounded-full" />

      {/* 内容 */}
      <div className="relative z-10 h-full flex flex-col px-10 py-8">
        {/* 顶部信息栏 */}
        <div className="flex justify-between items-start text-gray-500 text-sm tracking-wider mb-16">
          <span className="border-b border-gray-300 pb-1" style={{ fontFamily: 'STKaiti, KaiTi, serif' }}>
            存了么·知识存折 拒绝伪学习
          </span>
          <span>{date}</span>
        </div>

        {/* 标题 - 更大更粗，深蓝色 */}
        <h1 className="text-[52px] font-black text-slate-700 leading-[1.2] mb-20 mt-4"
          style={{ fontFamily: 'STHeiti, "Microsoft YaHei", sans-serif' }}>
          {title}
        </h1>

        {/* 内容区域 - 更大字号，深蓝色 */}
        <div className="flex-1 flex items-start">
          <p className="text-[26px] text-slate-600 leading-[1.8] whitespace-pre-wrap"
            style={{ fontFamily: 'STSong, SimSun, serif' }}>
            {quote}
          </p>
        </div>

        {/* 分隔线 */}
        <div className="w-full h-[1px] bg-gray-200 my-6" />

        {/* 底部信息 */}
        <div className="pb-2">
          <p className="text-slate-800 font-bold text-sm mb-1">
            别让知识只是经过大脑·每天进步一点
          </p>
          <p className="text-gray-500 text-sm tracking-wider">
            https://mashangfa.site
          </p>
        </div>
      </div>
    </div>
  );
}

// 📝 Notion笔记风格 - 米白手绘 (类似AI生成的效果)
function NotionStyle({ title, quote, date }: StyleProps) {
  return (
    <div id="xhs-poster" className="relative w-[600px] h-[800px] shrink-0 overflow-hidden font-serif">
      {/* 米白纸张背景 */}
      <div className="absolute inset-0 bg-[#fdf8f3]" />

      {/* 手绘边框效果 */}
      <div className="absolute inset-6">
        <svg className="w-full h-full" viewBox="0 0 548 748" fill="none">
          <rect x="2" y="2" width="544" height="744" rx="8"
            stroke="#2d2d2d" strokeWidth="3" strokeDasharray="8 4"
            className="opacity-40" />
        </svg>
      </div>

      {/* 回形针装饰 */}
      <div className="absolute top-4 right-16 w-8 h-16">
        <svg viewBox="0 0 32 64" fill="none" className="w-full h-full">
          <path d="M16 4 L16 52 C16 56 20 60 24 60 C28 60 28 56 28 52 L28 16 C28 12 24 8 20 8 C16 8 16 12 16 16 L16 44"
            stroke="#888" strokeWidth="2" fill="none" />
        </svg>
      </div>

      {/* 内容 */}
      <div className="relative z-10 h-full flex flex-col px-14 py-16">
        <div className="text-gray-500 text-xs tracking-[0.2em] mb-10 border-b border-gray-300 pb-2">
          存了么·知识存折 拒绝伪学习 | {date}
        </div>


        <h1 className="text-5xl font-black text-gray-800 leading-tight mb-12"
          style={{ fontFamily: 'serif' }}>
          {title}
        </h1>

        {/* 内容框 */}
        <div className="flex-1 flex items-start mt-4">
          <div className="relative bg-white/50 rounded-2xl p-8 border-2 border-gray-300/60"
            style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.05)' }}>
            <p className="text-2xl text-gray-700 leading-relaxed whitespace-pre-wrap"
              style={{ fontFamily: 'serif' }}>
              {quote}
            </p>
            {/* 小表情装饰 */}
            <div className="absolute -top-3 right-8 text-2xl">📝</div>
          </div>
        </div>

        <div className="text-gray-400 text-sm tracking-wider mt-8">
          别让知识只是经过大脑 | https://mashangfa.site
        </div>
      </div>
    </div>
  );
}

// 📖 读书笔记风格 - 复古纸张
function BookStyle({ title, quote, date }: StyleProps) {
  return (
    <div id="xhs-poster" className="relative w-[600px] h-[800px] shrink-0 overflow-hidden">
      {/* 复古纸张背景 */}
      <div className="absolute inset-0 bg-[#f5efe6]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_95%,#e8dfd0_95%)] bg-[size:100%_32px]" />

      {/* 装订线 */}
      <div className="absolute top-0 left-12 w-[2px] h-full bg-red-400/50" />
      <div className="absolute top-0 left-14 w-[1px] h-full bg-red-400/30" />

      {/* 书签装饰 */}
      <div className="absolute top-0 right-20 w-10 h-32 bg-gradient-to-b from-amber-600 to-amber-500 rounded-b-lg shadow-lg" />

      {/* 内容 */}
      <div className="relative z-10 h-full flex flex-col px-20 py-16">
        <div className="text-gray-500 text-xs tracking-[0.2em] mb-10 border-gray-300 pb-2 flex justify-between">
          <span>存了么·知识存折 拒绝伪学习</span>
          <span>{date}</span>
        </div>

        <h1 className="text-5xl font-bold text-amber-900 leading-tight mb-8 mt-4 italic"
          style={{ fontFamily: 'Georgia, serif' }}>
          「{title}」
        </h1>

        <div className="flex-1 flex items-start pt-12">
          <div className="relative">
            <span className="absolute -left-8 -top-4 text-6xl text-amber-300 font-serif">"</span>
            <p className="text-2xl text-amber-800 leading-loose whitespace-pre-wrap font-serif indent-8">
              {quote}
            </p>
            <span className="absolute -right-4 bottom-0 text-6xl text-amber-300 font-serif">"</span>
          </div>
        </div>

        <div className="text-amber-600/60 text-sm font-serif ">
          存了么·知识存折 | https://mashangfa.site
        </div>
      </div>
    </div>
  );
}


// 🎓 黑板报风格
function BlackboardStyle({ title, quote, date }: StyleProps) {
  return (
    <div id="xhs-poster" className="relative w-[600px] h-[800px] shrink-0 overflow-hidden">
      {/* 黑板背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a3a2a] via-[#234232] to-[#1a3a2a]" />

      {/* 黑板纹理 */}
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.3)_100%)]" />

      {/* 木质边框 */}
      <div className="absolute inset-0 border-[16px] border-amber-800/80 rounded-sm" />
      <div className="absolute inset-3 border-2 border-amber-600/40 rounded-sm" />

      {/* 粉笔灰效果 */}
      <div className="absolute bottom-20 left-20 w-32 h-2 bg-white/10 blur-sm rounded-full" />
      <div className="absolute bottom-24 right-32 w-20 h-1 bg-white/10 blur-sm rounded-full" />

      {/* 内容 */}
      <div className="relative z-10 h-full flex flex-col px-16 py-20">
        <div className="text-gray-500 text-xs tracking-[0.2em] mb-10 border-gray-300 pb-2 flex justify-between">
          <span>存了么·知识存折 拒绝伪学习</span>
          <span>{date}</span>
        </div>

        <h1 className="text-5xl font-bold text-white leading-tight mb-8 mt-4"
          style={{
            textShadow: '2px 2px 0px rgba(255,255,255,0.1)',
            fontFamily: 'STKaiti, KaiTi, serif'
          }}>
          {title}
        </h1>

        {/* 粉笔下划线 */}
        <div className="w-48 h-1 bg-yellow-300/40 rounded-full mb-12" />

        <div className="flex-1 flex items-start pt-8">
          <p className="text-2xl text-amber-100/90 leading-loose whitespace-pre-wrap"
            style={{
              textShadow: '1px 1px 0px rgba(255,255,255,0.05)',
              fontFamily: 'STKaiti, KaiTi, serif'
            }}>
            {quote}
          </p>
        </div>

        <div className="text-amber-200/40 text-sm font-mono">
          别让知识只是经过大脑 | https://mashangfa.site
        </div>
      </div>
    </div>
  );
}


// ✨ 极简主义风格 - 今日金句
function MinimalStyle({ title, quote, date }: StyleProps) {
  return (
    <div id="xhs-poster" className="relative w-[600px] h-[800px] shrink-0 overflow-hidden bg-[#fdfcfa]">
      {/* 内容 */}
      <div className="relative z-10 h-full flex flex-col items-center px-12 py-16">
        {/* 顶部标题 */}
        <h1 className="text-5xl text-slate-700 mb-16"
          style={{ fontFamily: 'STKaiti, KaiTi, serif' }}>
          {title}
        </h1>

        {/* 手绘边框容器 */}
        <div className="flex-1 w-full relative">
          {/* 手绘风格边框 */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 520 480" fill="none" preserveAspectRatio="none">
            <rect x="8" y="8" width="504" height="464" rx="4"
              stroke="#4a4a4a" strokeWidth="1.5"
              strokeDasharray="none" className="opacity-60" />
            <rect x="16" y="16" width="488" height="448" rx="2"
              stroke="#4a4a4a" strokeWidth="0.5" className="opacity-30" />
          </svg>

          {/* 内容区域 */}
          <div className="absolute inset-8 flex items-center justify-center">
            <p className="text-3xl text-slate-700 leading-relaxed whitespace-pre-wrap text-center"
              style={{ fontFamily: 'STKaiti, KaiTi, serif' }}>
              {quote}
            </p>
          </div>

          {/* 橄榄枝装饰 */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-24 h-20">
            <svg viewBox="0 0 100 80" fill="none" className="w-full h-full">
              {/* 主茎 */}
              <path d="M50 75 C45 55, 35 40, 30 20" stroke="#7c9a6d" strokeWidth="1.5" fill="none" />
              <path d="M50 75 C55 55, 65 40, 70 20" stroke="#7c9a6d" strokeWidth="1.5" fill="none" />
              {/* 左边叶子 */}
              <ellipse cx="28" cy="25" rx="8" ry="4" fill="#a8c99a" transform="rotate(-30 28 25)" />
              <ellipse cx="32" cy="35" rx="7" ry="3.5" fill="#b5d4a8" transform="rotate(-20 32 35)" />
              <ellipse cx="38" cy="45" rx="6" ry="3" fill="#a8c99a" transform="rotate(-15 38 45)" />
              <ellipse cx="42" cy="55" rx="5" ry="2.5" fill="#b5d4a8" transform="rotate(-10 42 55)" />
              {/* 右边叶子 */}
              <ellipse cx="72" cy="25" rx="8" ry="4" fill="#a8c99a" transform="rotate(30 72 25)" />
              <ellipse cx="68" cy="35" rx="7" ry="3.5" fill="#b5d4a8" transform="rotate(20 68 35)" />
              <ellipse cx="62" cy="45" rx="6" ry="3" fill="#a8c99a" transform="rotate(15 62 45)" />
              <ellipse cx="58" cy="55" rx="5" ry="2.5" fill="#b5d4a8" transform="rotate(10 58 55)" />
              {/* 蝴蝶结 */}
              <path d="M42 70 Q50 65 58 70" stroke="#d4a8b5" strokeWidth="2" fill="none" />
              <ellipse cx="42" cy="72" rx="6" ry="4" fill="#e8c4cf" transform="rotate(-20 42 72)" />
              <ellipse cx="58" cy="72" rx="6" ry="4" fill="#e8c4cf" transform="rotate(20 58 72)" />
            </svg>
          </div>
        </div>

        {/* 底部信息 */}
        <div className="text-slate-400 text-sm mt-6">
          存了么·知识存折 | {date}
        </div>
      </div>
    </div>
  );
}

// 🖍️ 荧光笔记风格 - 蓝绿渐变+荧光标记
function HighlightStyle({ title, quote, date }: StyleProps) {
  return (
    <div id="xhs-poster" className="relative w-[600px] h-[800px] shrink-0 overflow-hidden">
      {/* 奶白色背景 */}
      <div className="absolute inset-0 bg-[#faf6f0]" />

      {/* 横线纹理 */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_95%,#94a3b8_95%)] bg-[size:100%_40px] opacity-20" />

      {/* 荧光装饰块 */}
      <div className="absolute top-12 right-8 w-20 h-16 bg-yellow-300/80 rounded-sm rotate-6" />
      <div className="absolute bottom-24 right-12 w-16 h-12 bg-lime-300/80 rounded-sm -rotate-3" />
      <div className="absolute top-40 left-4 w-12 h-10 bg-yellow-300/60 rounded-sm rotate-12" />

      {/* 内容 */}
      <div className="relative z-10 h-full flex flex-col px-12 py-16">
        {/* 标题区域 */}
        <div className="mb-12 mt-8">
          <h1 className="text-5xl font-black text-slate-800 leading-tight tracking-wide"
            style={{ fontFamily: 'STHeiti, "Microsoft YaHei", sans-serif' }}>
            {title}
          </h1>
          {/* 标题下划线 */}
          <div className="mt-4 flex items-center gap-2">
            <div className="w-full h-[3px] bg-slate-600/60 rounded-full" />
          </div>
        </div>

        {/* 引用内容 */}
        <div className="flex-1 flex items-start pt-20">
          <div className="relative">
            {/* 引号装饰 */}
            <span className="absolute -left-6 -top-2 text-4xl text-slate-400/50 font-serif">"</span>

            {/* 内容文字带下划线效果 */}
            <div className="space-y-6">
              <p className="text-3xl text-slate-700 leading-relaxed whitespace-pre-wrap font-bold"
                style={{ fontFamily: 'STHeiti, "Microsoft YaHei", sans-serif' }}>
                {quote}
              </p>

              {/* 装饰性下划线 */}
              <div className="flex flex-col gap-3 mt-8">
                <div className="h-1 bg-gradient-to-r from-yellow-400 via-yellow-300 to-transparent rounded-full w-4/5" />
                <div className="h-1 bg-gradient-to-r from-red-400 via-red-300 to-transparent rounded-full w-3/5" />
              </div>
            </div>
          </div>
        </div>

        {/* 底部信息 */}
        <div className="text-slate-500 text-sm tracking-wider">
          存了么·知识存折 | {date}
        </div>
      </div>
    </div>
  );
}