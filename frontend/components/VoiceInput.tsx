"use client";
import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceInputProps {
  onResult: (text: string) => void;
  className?: string;
}

export default function VoiceInput({ onResult, className = "" }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false); // 启动中的状态
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. 核心兼容：同时检查标准 API 和 Webkit 前缀 (iOS 必须用 webkit)
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        setIsSupported(true);
      } else {
        setIsSupported(false);
        console.warn("当前浏览器不支持语音识别");
      }
    }
  }, []);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error("您的浏览器不支持语音输入", { description: "请尝试使用 Chrome 或 Safari" });
      return;
    }

    try {
      setIsInitializing(true);
      const recognition = new SpeechRecognition();
      
      // 2. 移动端关键配置：必须设为 false，否则 iOS 会报错或没反应
      recognition.continuous = false; 
      // 允许实时返回结果，体验更好
      recognition.interimResults = true; 
      recognition.lang = 'zh-CN';

      recognition.onstart = () => {
        setIsInitializing(false);
        setIsListening(true);
        toast.success("请开始说话...", { duration: 2000 });
      };

      recognition.onend = () => {
        setIsListening(false);
        setIsInitializing(false);
      };

      recognition.onresult = (event: any) => {
        // 获取最新的结果
        const results = event.results;
        const transcript = results[results.length - 1][0].transcript;
        const isFinal = results[results.length - 1].isFinal;

        // 实时回填（有些浏览器不返回 isFinal，所以只要有结果就填）
        if (transcript) {
            onResult(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        setIsInitializing(false);
        console.error("Speech Error:", event.error);
        
        // 3. 详细的错误反馈
        switch(event.error) {
            case 'not-allowed':
                toast.error("麦克风权限被拒绝", { description: "请去手机设置里允许浏览器访问麦克风" });
                break;
            case 'no-speech':
                // 没说话自动关闭，不弹窗打扰
                break;
            case 'network':
                toast.error("网络连接异常", { description: "语音识别需要网络支持" });
                break;
            default:
                toast.error(`语音识别错误: ${event.error}`);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();

    } catch (e) {
      setIsInitializing(false);
      console.error(e);
      toast.error("无法启动麦克风");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    // 不支持时显示灰色图标
    return (
        <button type="button" className={`p-2 text-slate-300 cursor-not-allowed ${className}`} onClick={() => toast.error("当前环境不支持语音")}>
            <MicOff size={18} />
        </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`p-2 rounded-full transition-all duration-200 active:scale-90 ${
        isListening 
          ? 'bg-red-100 text-red-600 animate-pulse' 
          : 'bg-transparent text-slate-400 hover:text-primary-600 hover:bg-slate-100'
      } ${className}`}
    >
      {isInitializing ? (
        <Loader2 size={18} className="animate-spin" />
      ) : isListening ? (
        <Mic size={18} className="fill-current"/> // 录音时实心图标
      ) : (
        <Mic size={18} />
      )}
    </button>
  );
}