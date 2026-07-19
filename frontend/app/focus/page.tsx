"use client";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Timer from '@/components/Timer';
import { supabase } from '@/lib/supabaseClient';
import { CONFIG } from '@/lib/config';

export default function FocusPage() {
  const router = useRouter();

  // 安全检查：如果用户直接输入网址进来，但没有关联的任务ID，最好踢回首页
  useEffect(() => {
    const assetId = localStorage.getItem('currentAssetId');
    if (!assetId || assetId === 'undefined') {
       router.push('/'); 
    }
  }, [router]);

  // 当计时器结束时触发
  const handleTimerComplete = async () => {
    // 1. 获取当前专注的任务 ID
    const assetId = localStorage.getItem('currentAssetId');
    
    if (assetId && assetId !== 'undefined') {
        try {
            // 上报专注时长 (默认 30 分钟)
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                await fetch(`${CONFIG.api.baseURL}/api/knowledge/finish_session`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({
                        asset_id: assetId,
                        duration_minutes: 30
                    })
                });
            }
        } catch (e) {
            console.error("上报专注时长失败:", e);
        }

       // 正常流程：跳转到打磨页面 (Refine)
       router.push(`/refine/${assetId}`);
    } else {
       // 异常流程：如果没有 ID，回到首页
       console.warn("未找到任务ID，返回首页");
       router.push('/');
    }
  };

  return (
    // 使用全屏黑色背景，营造绝对专注的氛围
    <div className="min-h-screen bg-black flex items-center justify-center animate-in fade-in duration-700">
      
      {/* 
        这里只渲染 Timer 组件。
        UI 的具体样式（数字大小、按钮）都在 components/Timer.tsx 里控制 
      */}
      <Timer onComplete={handleTimerComplete} />
      
    </div>
  );
}