"use client";
import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

export default function WelcomeModal() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // 检查本地缓存，是否已经读过信了
        // 使用 'welcome_v1' 作为key，以后如果你改了信的内容想让用户再看一遍，改成 'welcome_v2' 即可
        const hasRead = localStorage.getItem('has_read_welcome_v1');
        if (!hasRead) {
            // 延迟 1.5 秒弹出，让用户先看到界面，体验更自然
            const timer = setTimeout(() => setIsOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem('has_read_welcome_v1', 'true');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-500">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative scale-100 animate-in zoom-in-95 duration-300">

                {/* 顶部装饰图：黑金风格 */}
                <div className="h-32 bg-slate-900 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-200 via-slate-900 to-slate-900"></div>
                    <div className="relative z-10 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 backdrop-blur mb-3 border border-white/20">
                            <Sparkles className="text-amber-400" size={24} />
                        </div>
                        <h2 className="text-2xl font-serif text-white font-bold tracking-widest">
                            致公测用户
                        </h2>
                    </div>

                    {/* 关闭按钮 */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* 信件内容 */}
                <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="text-sm md:text-base text-slate-600 leading-relaxed space-y-4 font-sans">
                        <p className="font-bold text-slate-900 text-lg">
                            你好，我是 <span className="text-amber-600">存了么·知识存折</span> 的开发者三百。
                        </p>

                    </div>

                    <div className="space-y-3">
                        <p>
                            我们总是在不停地阅读与思考，但大部分知识都像指缝间的沙子一样流失了。
                            我打造这个系统，是希望通过 AI 的力量，让你的每一份思考都能在时间的复利下，变得更有价值。
                        </p>

                        {/* 关键提醒：API Key 配置 */}
                        <div className="bg-amber-50 border border-amber-100 p-3 rounded-md">
                            <p className="text-sm text-amber-800 leading-relaxed">
                                <span className="font-bold">⚠️ 激活 AI 大脑的关键一步：</span><br />
                                在存入第一笔资产前，请务必前往 <span className="font-bold text-amber-600">「配置中心」</span> 配置您的大模型 API Key。
                                开启您的AI智能助手。
                            </p>
                        </div>

                        <p>
                            我们期待你的：<strong>吐槽、反馈、建议以及关于 AI 辅助学习的新想法。</strong>。
                            除知识存折外，同平台的「节日祝福助手」与「LifeOS 人生规划」亦可同步体验。
                        </p>
                    </div>


                    <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3">
                        <button
                            onClick={handleClose}
                            className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-black shadow-lg shadow-slate-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            开启知识复利之旅 <Sparkles size={16} />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}