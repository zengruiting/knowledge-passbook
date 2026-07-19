"use client";
import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, Trash2, Server, Key, Cpu, Zap, HelpCircle, ExternalLink } from 'lucide-react';

export default function SettingsPage() {
  const [config, setConfig] = useState({
    provider: 'tongyi', // 默认通义千问
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: '',
    model: 'qwen-plus'
  });
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ai_config');
    if (saved) setConfig(JSON.parse(saved));
  }, []);

  const handleSave = () => {
    localStorage.setItem('ai_config', JSON.stringify(config));
    alert('配置已保存！AI 教练已就位。');
  };

  const providers = [
    {
      id: 'tongyi',
      name: '通义千问',
      desc: '阿里 Qwen-Plus (Chat + 1536维向量)',
      url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      model: 'qwen-plus',
      models: [
        { id: 'qwen-plus', name: 'qwen-plus (标准)' },
        { id: 'qwen-turbo', name: 'qwen-turbo (极速)' },
        { id: 'qwen-max', name: 'qwen-max (最强)' }
      ]
    },
    {
      id: 'openai',
      name: 'OpenAI',
      desc: 'GPT-4o (Chat + 1536维向量，需魔法)',
      url: 'https://api.openai.com/v1',
      model: 'gpt-4o',
      models: [
        { id: 'gpt-4o', name: 'gpt-4o (旗舰)' },
        { id: 'gpt-4-turbo', name: 'gpt-4-turbo (性能)' },
        { id: 'gpt-3.5-turbo', name: 'gpt-3.5-turbo (高速)' }
      ]
    },
    {
      id: 'SiliEvo',
      name: 'SiliEvo中转平台',
      desc: 'SiliEvo中转平台，提供文本、图像、视频、音频等多模态生成能力的中转服务，支持接入多个大模型供应商，方便用户统一管理和调用不同供应商的生成能力。',
      url: 'https://api.numspirit.com/v1',
      model: 'qwen3.6-plus',
      actionLink: 'https://numspirit.com//register?code=E9JD9S3J',
      actionText: '前往SiliEvo中转平台',
      models: [
        { id: 'qwen3.6-plus', name: 'qwen3.6-plus (通义标准推理)' },
        { id: 'qwen3.6-flash', name: 'qwen3.6-flash (通义极速推理)' },
        { id: 'deepseek-v4-flash', name: 'deepseek-v4-flash (高频低成本)' },
        { id: 'deepseek-v4-pro', name: 'deepseek-v4-pro (深度推理)' },
        { id: 'gpt-5.4', name: 'gpt-5.4 (深度推理)' }

      ]
    },
  ];

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in zoom-in duration-300">
      {/* API key支持 BYOK (Bring Your Own Key) 模式 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">云端配置中心</h1>
        <p className="text-slate-500 mt-2">连接你的 AI 认知教练。</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* 顶部提示条 */}
        <div className="bg-primary-50 px-8 py-4 border-b border-primary-100 flex items-center gap-3">
          <Zap className="text-primary-600 w-5 h-5" />
          <p className="text-sm text-primary-800">
            <strong>隐私承诺：</strong> API Key 仅存储在您的本地浏览器中，绝不上传至我们的服务器。
          </p>
        </div>

        <div className="p-8 space-y-8">
          {/* 1. 选择供应商 */}
          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Server size={20} className="text-slate-400" /> 选择模型供应商
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {providers.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setConfig({ ...config, provider: p.id, baseUrl: p.url, model: p.model, apiKey: '' })}
                  className={`cursor-pointer border-2 rounded-xl p-4 transition-all relative ${config.provider === p.id
                    ? 'border-primary-500 bg-primary-50/30'
                    : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                >
                  <div className="font-bold text-slate-800">{p.name}</div>
                  <div className="text-xs text-slate-500 mt-1 mb-2">{p.desc}</div>
                  {/* @ts-ignore */}
                  {p.actionLink && (
                    <div className="mt-2">
                      <a
                        href={p.actionLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-primary-600 text-xs font-semibold hover:text-primary-700 hover:underline bg-primary-50 px-2 py-1 rounded"
                      >
                        {p.actionText} <ExternalLink size={12} />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 2. API Key */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Key size={20} className="text-slate-400" /> 配置 API Key
              </h3>
              <a
                href="https://oahvw93j6te.feishu.cn/wiki/TUQMwZ6K5iwwmZkrxMbcHYcOnTK?fromScene=spaceOverview" // ← 换成你的飞书文档地址
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-500 hover:text-primary-500 flex items-center gap-1"
                title="如何获取通义千问 API Key"
              >
                <HelpCircle size={16} />
                如何获取Key？
              </a>
            </div>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                placeholder={`请输入 ${providers.find(p => p.id === config.provider)?.name} 的 API Key`}
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              />
              <Key className="absolute left-4 top-4 text-slate-400" size={20} />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
              >
                {showKey ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </section>

          {/* 3. 高级参数 */}
          <section className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <Cpu size={18} className="text-slate-500" />
              <span className="font-medium text-slate-700">高级参数 (Base URL & Model ID)</span>
            </div>
            <div className="grid grid-cols-2 gap-6 pl-1">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Base URL</label>
                <input
                  type="text"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-600"
                  value={config.baseUrl}
                  onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Model ID</label>
                </div>
                <select
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-600 focus:ring-2 focus:ring-primary-400 outline-none transition-all"
                  value={config.model}
                  onChange={(e) => setConfig({ ...config, model: e.target.value })}
                >
                  {providers.find(p => p.id === config.provider)?.models?.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-8">
                <p className="text-slate-500 mt-2 text-sm">注：如果是中转/代理，Base URL 填代理商提供的地址</p>
              </div>
            </div>
          </section>
        </div>

        {/* 底部按钮 */}
        <div className="bg-slate-50 px-8 py-6 border-t border-slate-100 flex justify-between items-center">
          <button
            onClick={() => {
              localStorage.removeItem('ai_config');
              setConfig({ ...config, apiKey: '' });
              alert('已重置');
            }}
            className="text-slate-400 hover:text-red-500 text-sm flex items-center gap-2"
          >
            <Trash2 size={16} /> 清除配置
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-3 bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-600/30 hover:bg-primary-700 hover:scale-105 transition-all flex items-center gap-2"
          >
            <Save size={20} /> 保存生效
          </button>
        </div>
      </div>
    </div>
  );
}