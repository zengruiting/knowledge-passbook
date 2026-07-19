"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, Mail, ArrowRight } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // 控制是登录还是注册模式
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isSignUp ? '/api/knowledge/auth/register' : '/api/knowledge/auth/login';
      const response = await fetch(`${window.location.origin}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "请求失败");
      }

      if (data.access_token) {
        localStorage.setItem('local_auth_token', data.access_token);
        toast.success(isSignUp ? "注册成功！" : "欢迎回来！");
        router.push('/');
      }
      
    } catch (error: any) {
      toast.error(error.message || "认证失败，请检查账号密码");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-amber-500 p-8 text-center">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">知识存折</h1>
          <p className="text-amber-900/80 font-medium mt-2">Knowledge Passbook</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">
            {isSignUp ? '创建新账户' : '登录您的存折'}
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            {/* 邮箱输入 */}
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
              <input
                type="email"
                required
                placeholder="电子邮箱 (Email)"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* 密码输入 */}
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
              <input
                type="password"
                required
                placeholder="密码 (Password)"
                minLength={6}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* 提交按钮 */}
            <button
              disabled={loading}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? '立即注册' : '登 录')}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          {/* 切换模式 */}
          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-slate-500 hover:text-amber-600 font-medium underline underline-offset-4"
            >
              {isSignUp ? '已有账号？去登录' : '没有账号？去注册'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}