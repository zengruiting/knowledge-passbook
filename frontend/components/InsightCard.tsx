import { Share2, Fingerprint, Quote } from 'lucide-react';

interface InsightCardProps {
    data: any;
    version: number;
    date: string;
    title: string; // 新增：明确要求传入标题
}

// Helper to format numbered lists (using circled numbers or semicolons) into premium structures
const renderFormattedContent = (text: string, type: 'insight' | 'action') => {
    if (!text) return null;
    
    // Normalize quotes and pointers
    let cleanText = text.trim();
    if (cleanText.startsWith('“') && cleanText.endsWith('”')) {
        cleanText = cleanText.substring(1, cleanText.length - 1).trim();
    }
    if (cleanText.startsWith('"') && cleanText.endsWith('"')) {
        cleanText = cleanText.substring(1, cleanText.length - 1).trim();
    }
    if (cleanText.startsWith('👉')) {
        cleanText = cleanText.substring(2).trim();
    }
    
    const circledNumbers = /[①②③④⑤⑥⑦⑧⑨⑩]/;
    
    if (circledNumbers.test(cleanText)) {
        const items = cleanText.split(/(?=[①②③④⑤⑥⑦⑧⑨⑩])/g).map(item => item.trim());
        
        return (
            <span className="block space-y-3 mt-1">
                {items.map((item, index) => {
                    let cleaned = item.replace(/[；;，,]$/, '').trim();
                    if (!cleaned) return null;
                    
                    const match = cleaned.match(/^([①②③④⑤⑥⑦⑧⑨⑩])\s*(.*)$/);
                    if (match) {
                        const num = match[1];
                        const content = match[2];
                        
                        // Try to split into title and details based on common separators
                        const separatorRegex = /([（(：:—].*)$/;
                        const sepMatch = content.match(separatorRegex);
                        if (sepMatch) {
                            const details = sepMatch[1];
                            const title = content.substring(0, content.length - details.length);
                            return (
                                <span key={index} className="flex items-start gap-2.5 text-justify">
                                    <span className={`font-bold text-base shrink-0 mt-0.5 ${type === 'insight' ? 'text-amber-500' : 'text-primary-500'}`}>
                                        {num}
                                    </span>
                                    <span className="text-sm md:text-base leading-relaxed">
                                        <strong className="font-semibold text-slate-800">{title}</strong>
                                        <span className="text-slate-500 font-normal">{details}</span>
                                    </span>
                                </span>
                            );
                        } else {
                            return (
                                <span key={index} className="flex items-start gap-2.5 text-justify">
                                    <span className={`font-bold text-base shrink-0 mt-0.5 ${type === 'insight' ? 'text-amber-500' : 'text-primary-500'}`}>
                                        {num}
                                    </span>
                                    <span className="text-sm md:text-base leading-relaxed text-slate-700 font-medium">
                                        {content}
                                    </span>
                                </span>
                            );
                        }
                    }
                    
                    return (
                        <span key={index} className="block text-justify text-sm md:text-base leading-relaxed text-slate-600">
                            {cleaned}
                        </span>
                    );
                })}
            </span>
        );
    }
    
    // Fallback: split by semicolon
    if (cleanText.includes('；') || cleanText.includes(';')) {
        const separator = cleanText.includes('；') ? '；' : ';';
        const items = cleanText.split(separator).map(item => item.trim());
        return (
            <span className="block space-y-2 mt-1">
                {items.map((item, index) => {
                    let cleaned = item.replace(/[；;，,]$/, '').trim();
                    if (!cleaned) return null;
                    return (
                        <span key={index} className="flex items-start gap-2.5 text-justify">
                            <span className={`w-1.5 h-1.5 rounded-full mt-2.5 shrink-0 ${type === 'insight' ? 'bg-amber-400' : 'bg-primary-400'}`}></span>
                            <span className={`text-sm md:text-base leading-relaxed ${type === 'insight' ? 'text-slate-800' : 'text-slate-600'}`}>
                                {cleaned}
                            </span>
                        </span>
                    );
                })}
            </span>
        );
    }
    
    // Default text
    if (type === 'action') {
        return (
            <span className="flex items-start gap-1.5 font-bold text-slate-900 text-sm md:text-base leading-relaxed">
                <span className="shrink-0">👉</span> <span>{cleanText}</span>
            </span>
        );
    }
    return <span className="italic">“{cleanText}”</span>;
};

export default function InsightCard({ data, version, date, title }: InsightCardProps) {
    if (!data) return null;

    return (
        <div className="relative w-full max-w-2xl mx-auto group perspective-1000">
            {/* 卡片主体 */}
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden relative">

                {/* 顶部金边装饰 */}
                <div className="h-3 w-full bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-300"></div>
                {/* 👇👇👇 修改：手机端 p-5，电脑端 p-8 (关键！) */}
                <div className="p-5 md:p-8">
                    {/* Header: 编号与Logo */}
                    <div className="flex flex-row justify-between items-start mb-6 md:mb-8 border-b border-slate-100 pb-4">
                        <div className="flex-1 pr-4"> {/* 手机上增加底部间距 */}
                            <div className="text-[10px] md:text-xs font-black text-slate-400 tracking-[0.2em] uppercase">{title}</div>
                            <h2 className="text-[10px] md:text-xs font-bold text-slate-400 tracking-[0.2em] uppercase">存了么·知识资产证书</h2>

                        </div>
                        <div className="text-right shrink-0">
                            <div className="inline-flex items-center gap-1 bg-slate-900 text-white px-2 py-1 md:px-3 rounded text-[10px] md:text-xs font-bold font-mono shadow-sm">
                                NO. {version.toString().padStart(3, '0')}
                            </div>
                            <div className="text-[10px] md:text-xs text-slate-400 mt-1 font-mono">{date ? date.split('T')[0] : 'Unknown Date'}</div>
                        </div>
                    </div>

                    {/* Core Content: 核心洞见 */}
                    <div className="space-y-5 md:space-y-6">
                        <div className="bg-amber-50/50 p-4 md:p-6 rounded-lg border-l-4 border-amber-400">
                            <div className="flex gap-2 mb-2">
                                <Quote size={14} className="text-amber-400 fill-amber-400" />
                                <span className="text-xs font-bold text-amber-600 uppercase">核心洞见</span>
                            </div>
                            <div className="text-base md:text-lg font-medium text-slate-800 leading-relaxed text-justify">
                                {renderFormattedContent(data.content?.understand || data.content?.what, 'insight')}
                            </div>
                        </div>
                        {/* 手机上改为单列 (grid-cols-1)，电脑双列 (md:grid-cols-2) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">触发场景</h4>
                                <p className="text-sm text-slate-700">{data.content?.where}</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">如何使用</h4>
                                <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                                    {renderFormattedContent(data.content?.action, 'action')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer: 认证信息 */}
                    <div className="mt-10 pt-6 border-t-2 border-dashed border-slate-100 flex justify-between items-end">
                        <div className="flex items-center gap-4">
                            <div className="border-2 border-slate-900 rounded p-1">
                                <Fingerprint size={32} className="text-slate-900 opacity-80" />
                            </div>
                            <div className="text-xs text-slate-400">
                                <p>Authorized by</p>
                                <p className="font-bold text-slate-900 text-sm">Minted Knowledge System</p>
                                <p className="text-[11px] text-slate-800 mt-0.5">https://mashangfa.site</p>
                            </div>
                        </div>

                        <div className="font-serif text-sm md:text-3xl text-slate-100 font-bold select-none absolute bottom-4 right-4 pointer-events-none">
                            MINTED
                        </div>
                    </div>
                </div>
            </div>

            {/* 底部倒影效果 */}
            <div className="absolute -bottom-4 left-4 right-4 h-4 bg-black/20 blur-lg rounded-[50%] -z-10"></div>
        </div>
    );
}