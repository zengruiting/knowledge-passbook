"use client";
import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, Bell, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

export default function Timer({ onComplete }: { onComplete: () => void }) {
  const [timeLeft, setTimeLeft] = useState(30 * 60); 
  const [isActive, setIsActive] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    // 初始化音频
    audioRef.current = new Audio(SOUND_URL);
    
    // 🛡️ 核心修复：先判断浏览器是否支持 Notification，防止手机端崩溃
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === "default") {
        setTimeout(() => {
          toast("开启沉浸式提醒？", {
            description: "我们将通过系统通知，在专注结束时提醒您。",
            action: {
              label: "开启通知",
              onClick: () => {
                Notification.requestPermission().then(permission => {
                  if (permission === 'granted') toast.success("已开启通知提醒");
                });
              }
            },
            duration: 8000, 
          });
        }, 1000);
      }
    }
  }, []);

  useEffect(() => {
    let interval: any;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimeUp();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleTimeUp = () => {
    setIsActive(false);
    
    // 播放声音 (手机端可能需要用户交互才能播放，加 catch 防止报错)
    if (audioRef.current) {
        audioRef.current.play().catch(e => console.log("自动播放被拦截:", e));
    }
    
    // 发送通知 (安全检查)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === "granted") {
        try {
            new Notification("专注结束！", { body: "开始收割知识..." });
        } catch (e) {
            console.error("通知发送失败", e);
        }
    }

    toast.success("专注目标达成！开始收割...");
    setTimeout(() => {
        onComplete();
    }, 1500);
  };

  const handleSkipClick = () => {
    setIsActive(false);
    setShowConfirm(true);
  };

  const confirmFinish = () => {
    setShowConfirm(false);
    setTimeLeft(0);
  };

  const cancelFinish = () => {
    setShowConfirm(false);
    setIsActive(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalTime = 30 * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto animate-in zoom-in duration-500">
      
      {/* 倒计时圆环 */}
      <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center mb-10">
        <svg className="absolute w-full h-full transform -rotate-90">
            <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
            <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="8" fill="transparent"
                strokeDasharray={2 * Math.PI * 110} // 约等于 r 的周长，这里做近似适配
                strokeDashoffset={2 * Math.PI * 110 * (1 - progress / 100)}
                className="text-amber-500 transition-all duration-1000 ease-linear" strokeLinecap="round" />
        </svg>
        <div className="text-center z-10">
            <div className="text-5xl md:text-7xl font-mono font-bold text-white tracking-tighter tabular-nums">{formatTime(timeLeft)}</div>
            <div className="text-amber-500 font-bold mt-2 uppercase tracking-widest text-sm animate-pulse">
                {isActive ? '专注学习中...' : '暂停学习中...'}
            </div>
        </div>
      </div>

      {/* 按钮组 */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => setIsActive(!isActive)}
          className={`flex flex-col items-center gap-2 group transition-all ${isActive ? 'opacity-80' : 'opacity-100'}`}
        >
          <div className={`p-4 md:p-5 rounded-full border-2 transition-all ${
              isActive 
              ? 'border-slate-700 text-slate-400 group-hover:border-amber-500 group-hover:text-amber-500' 
              : 'border-amber-500 bg-amber-500 text-black shadow-[0_0_30px_rgba(245,158,11,0.4)]'
          }`}>
            {isActive ? <Pause size={28} fill="currentColor"/> : <Play size={28} fill="currentColor" className="ml-1"/>}
          </div>
          <span className="text-xs font-bold text-slate-500 group-hover:text-slate-300 uppercase tracking-wider">
            {isActive ? '暂停学习' : '继续学习'}
          </span>
        </button>

        <button
          onClick={handleSkipClick}
          className="flex flex-col items-center gap-2 group"
        >
          <div className="p-4 md:p-5 rounded-full border-2 border-slate-700 text-slate-400 group-hover:border-white group-hover:text-white group-hover:bg-slate-800 transition-all">
            <SkipForward size={28} fill="currentColor"/>
          </div>
          <span className="text-xs font-bold text-slate-500 group-hover:text-slate-300 uppercase tracking-wider">
            我已学完
          </span>
        </button>
      </div>

      <p className="mt-12 text-slate-600 text-sm flex items-center gap-2">
        <Bell size={14}/> 结束时将播放提示音
      </p>

      {/* 确认弹窗 */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 transform scale-100 border border-slate-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-4 text-amber-500">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">完成学习了？</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                提前结束将停止计时，直接进入<br/>
                <span className="text-slate-800 font-bold">知识打磨与收割</span> 阶段。
              </p>
              <div className="flex gap-3 w-full">
                <button onClick={cancelFinish} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">继续倒计时</button>
                <button onClick={confirmFinish} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black shadow-lg shadow-slate-900/20 transition-colors">确认完成</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}