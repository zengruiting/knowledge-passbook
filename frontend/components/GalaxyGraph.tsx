"use client";
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { Maximize2, Minimize2, Zap, X } from 'lucide-react'; // 引入 Minimize2 和 X

interface Node {
  id: string;
  title: string;
  reason: string;
  similarity?: number;
}

interface GalaxyGraphProps {
  centerTitle: string;
  relatedNodes: Node[];
}

export default function GalaxyGraph({ centerTitle, relatedNodes }: GalaxyGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // 👇 新增：全屏状态
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 1. 响应式计算：自动获取容器宽高
  const updateDimensions = () => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight
      });
    }
  };

  useEffect(() => {
    window.addEventListener('resize', updateDimensions);
    // 稍微延迟一下以确保全屏动画结束后获取准确尺寸
    const timer = setTimeout(updateDimensions, 600);
    return () => {
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(timer);
    }
  }, [isFullscreen]); // 依赖 isFullscreen，切换时重新计算中心点

  // 监听 ESC 退出全屏
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  if (relatedNodes.length === 0) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
        <div className="p-4 bg-slate-100 rounded-full mb-3">
          <Zap className="text-slate-300" />
        </div>
        <p>暂无关联资产</p>
        <p className="text-xs mt-1 text-slate-400">存入更多知识后，星系将自动生成</p>
      </div>
    );
  }

  // --- 📐 核心适配逻辑 ---

  // 1. 判断是否是窄屏模式 (宽度小于 640px 视为手机)
  const isMobile = dimensions.width < 640;

  // 2. 动态定义尺寸 (手机全屏不能跟电脑全屏一样大)
  const centerSize = isMobile
    ? (isFullscreen ? 110 : 80)    // 手机: 全屏110px / 普通80px
    : (isFullscreen ? 160 : 112);  // 电脑: 全屏160px / 普通112px

  const satelliteSize = isMobile
    ? (isFullscreen ? 75 : 60)     // 手机: 全屏75px / 普通60px
    : (isFullscreen ? 100 : 80);   // 电脑: 全屏100px / 普通80px
  // 3. 计算半径
  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;
  const minDimension = Math.min(dimensions.width, dimensions.height);

  // 手机端留边少一点(50px)，电脑端留边多一点(80px)，让球尽量撑开
  const padding = isMobile ? 50 : 80;
  const radius = isFullscreen
    ? minDimension / (isMobile ? 2.6 : 3)
    : (minDimension / 2) - padding;

  // 4. 字体大小适配
  const centerTextSize = isMobile
    ? (isFullscreen ? 'text-xs' : 'text-[10px]')
    : (isFullscreen ? 'text-lg' : 'text-xs');

  const satTextSize = isMobile
    ? (isFullscreen ? 'text-[10px]' : 'text-[8px]')
    : (isFullscreen ? 'text-sm' : 'text-[10px]');

  return (
    <div
      ref={containerRef}
      // 👇 核心逻辑：根据状态切换 CSS 类
      className={`transition-all duration-500 ease-in-out flex items-center justify-center group/canvas overflow-hidden
            ${isFullscreen
          ? 'fixed inset-0 z-[9999] w-screen h-screen bg-slate-950' // 全屏样式：最高层级，黑底
          : 'relative w-full h-[400px] md:h-[500px] bg-slate-900 rounded-2xl shadow-2xl' // 手机高度稍微改小一点
        }
        `}
    >
      {/* --- 背景装饰 --- */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
          backgroundSize: isMobile ? '30px 30px' : '40px 40px'
        }}>
      </div>
      <div className="absolute inset-0 bg-radial-gradient from-indigo-500/10 to-transparent pointer-events-none"></div>

      {/* --- SVG 连线层 --- */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
        {relatedNodes.map((node, i) => {
          const angle = (i * (360 / relatedNodes.length)) * (Math.PI / 180);
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);

          const isHovered = hoveredNode === node.id;

          // 👇 计算连线中点坐标20260707新增在svg连线上显示关联度
          const midX = (centerX + x) / 2;
          const midY = (centerY + y) / 2;
          // 计算连线方向向量（用于将文字偏移到连线上方）
          const dx = x - centerX;
          const dy = y - centerY;
          const len = Math.sqrt(dx * dx + dy * dy);
          // 垂直偏移量：连线上方 12px（根据字体大小调整）
          const offset = 12;
          const offsetX = -dy / len * offset;
          const offsetY = dx / len * offset;

          // 👇 判断是否是移动端，调整字体大小20260707新增在svg连线上显示关联度
          const isMobile = dimensions.width < 640;
          const labelFontSize = isMobile ? '8px' : '10px';
          // 文字位置：在连线中点的基础上，沿垂直方向偏移
          const textX = midX + offsetX;
          const textY = midY + offsetY;

          return (
            <g key={`link-${i}`}>
              <line
                x1={centerX} y1={centerY}
                x2={x} y2={y}
                stroke={isHovered ? "#fbbf24" : "#475569"}
                strokeWidth={isHovered ? (isFullscreen ? 3 : 2) : 1}
                strokeDasharray={isHovered ? "0" : "4"}
                className="transition-colors duration-300"
              />

              {/* 关联原因（第一行） */}
              {node.similarity !== undefined && node.similarity > 0 && (
                <text
                  x={textX}
                  y={textY - 4}
                  textAnchor="middle"
                  fill={isHovered ? "#fbbf24" : "#94a3b8"}
                  fontSize={isMobile ? "8" : "10"}
                  fontWeight="bold"
                  className="transition-colors duration-300"
                  style={{
                    textShadow: '0 1px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)'
                  }}
                >
                  {node.reason || '关联'}
                </text>
              )}

              {/* 关联度百分比（第二行） */}
              {node.similarity !== undefined && node.similarity > 0 && (
                <text
                  x={textX}
                  y={textY + 6}
                  textAnchor="middle"

                  fill={isHovered ? "#fcd34d" : "#fbbf24"}
                  fontSize={isMobile ? "7" : "9"}
                  fontWeight="600"
                  className="transition-colors duration-300"
                  style={{
                    textShadow: '0 1px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)'
                  }}
                >
                  {Math.round(node.similarity * 100)}%
                </text>
              )}

              {isHovered && (
                <circle r={isFullscreen ? "4" : "2"} fill="#fbbf24">
                  <animateMotion dur="1s" repeatCount="indefinite" path={`M${centerX},${centerY} L${x},${y}`} />
                </circle>
              )}
            </g>
          );
        })}
      </svg>

      {/* --- 中心恒星 --- */}
      <div className={`absolute z-20 flex flex-col items-center justify-center bg-amber-500 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.5)] border-4 border-slate-800 animate-pulse-slow transition-all duration-500`}
        style={{
          width: centerSize,
          height: centerSize,
          left: centerX - centerSize / 2, // 动态居中
          top: centerY - centerSize / 2
        }}
      >
        {/* 使用动态字体 */}
        <span className={`${centerTextSize} font-black text-slate-900 text-center px-2 leading-tight line-clamp-2`}>
          {centerTitle}
        </span>
        <div className={`absolute ${isMobile ? '-bottom-4' : '-bottom-6'} text-[8px] md:text-[10px] text-amber-500 font-mono tracking-widest uppercase opacity-80`}>
          当前
        </div>
      </div>

      {/* --- 卫星行星 --- */}
      {relatedNodes.map((node, i) => {
        const angle = (i * (360 / relatedNodes.length)) * (Math.PI / 180);
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        return (
          <Link href={`/assets/${node.id}`} key={node.id}>
            <div
              className="absolute z-30 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110"
              style={{
                left: x - satelliteSize / 2,
                top: y - satelliteSize / 2,
                width: satelliteSize,
                height: satelliteSize
              }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <div className={`w-full h-full rounded-full border-2 flex items-center justify-center p-1 text-center transition-all duration-300 shadow-lg ${hoveredNode === node.id
                ? 'bg-slate-800 border-amber-400 shadow-amber-500/20'
                : 'bg-slate-800 border-slate-600 shadow-black/50'
                }`}>
                <span className={`${satTextSize} font-bold leading-tight line-clamp-2 ${hoveredNode === node.id ? 'text-white' : 'text-slate-400'
                  }`}>
                  {node.title}
                </span>
              </div>
            </div>
          </Link>
        );
      })}

      {/* --- 右下角控制按钮 (现在是真的了) --- */}

      {/* 👇👇👇 新增：移动端专属关闭按钮 (右上角 X) 👇👇👇 */}
      {/* 逻辑：只在全屏(isFullscreen) 且 手机端(md:hidden) 显示 */}
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-6 right-6 p-3 bg-slate-800/80 text-white rounded-full shadow-xl border border-slate-600 md:hidden z-50 animate-in fade-in zoom-in duration-300"
        >
          <X size={24} />
        </button>
      )}

      {/* --- 右下角控制按钮 (原有逻辑微调) --- */}
      <div className="absolute bottom-6 right-6 flex gap-2 z-50">
        {/* 电脑端提示 ESC */}
        {isFullscreen && (
          <div className="hidden md:flex px-4 py-2 bg-slate-800/80 backdrop-blur text-slate-300 rounded-lg text-sm mr-4 items-center">
            按 ESC 退出
          </div>
        )}

        {/* 缩放切换按钮 (手机电脑都保留) */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all border border-slate-700"
          title={isFullscreen ? "退出全屏" : "全屏沉浸"}
        >
          {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={20} />}
        </button>
      </div>

    </div>
  );
}