import React, { useState, useRef, useEffect } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  ConnectionLineType,
  getSmoothStepPath,
  getBezierPath,
  getStraightPath,
  EdgeProps
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Maximize2, 
  Minimize2,
  Download, 
  FileDown,
  Settings, 
  Grid, 
  Play, 
  Pause, 
  Activity, 
  ShieldAlert,
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  Copy
} from 'lucide-react';
import { CollabUser, ResiliencyData } from '@/types';

/* ─────────────────────────────────────────────
   Custom Animated Flow Edge Component
───────────────────────────────────────────── */
const CustomDataFlowEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  className,
  data,
}: any) => {
  // Determine routing dynamically to ensure visual clarity:
  // - Horizontal flows (between side handles left/right) use perfectly straight paths to avoid visual clutter.
  // - Vertical/Cross-layer flows (between top/bottom handles) use rounded orthogonal steps with dynamic Y offsets to completely prevent line overlaps.
  const isHorizontal = 
    sourcePosition === 'left' || 
    sourcePosition === 'right' || 
    targetPosition === 'left' || 
    targetPosition === 'right';

  const edgeOffset = data?.edgeOffset || 0;
  let edgePath = '';

  if (isHorizontal) {
    const [path] = getStraightPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
    });
    edgePath = path;
  } else {
    const baseMidY = (sourceY + targetY) / 2;
    const midY = baseMidY + edgeOffset;

    if (Math.abs(targetX - sourceX) < 1) {
      // Perfectly straight vertical connection
      edgePath = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    } else {
      const r = 12; // 12px rounded corner radius
      const dy = targetY > sourceY ? 1 : -1;
      const dx = targetX > sourceX ? 1 : -1;
      const actualR = Math.min(r, Math.abs(targetX - sourceX) / 2, Math.abs(targetY - sourceY) / 2);

      const firstCornerY = midY - actualR * dy;
      const firstCornerXCurve = sourceX + actualR * dx;
      const secondCornerX = targetX - actualR * dx;
      const secondCornerYCurve = midY + actualR * dy;

      edgePath = `
        M ${sourceX} ${sourceY}
        L ${sourceX} ${firstCornerY}
        Q ${sourceX} ${midY} ${firstCornerXCurve} ${midY}
        L ${secondCornerX} ${midY}
        Q ${targetX} ${midY} ${targetX} ${secondCornerYCurve}
        L ${targetX} ${targetY}
      `;
    }
  }

  return (
    <>
      <path
        id={id}
        className={className}
        d={edgePath}
        style={style}
        markerEnd={markerEnd}
        fill="none"
      />
      {data?.isActive && (
        <>
          {/* Glowing flying packet circle */}
          <circle r="5.5" fill={data.flowColor || '#06b6d4'} className="filter drop-shadow-[0_0_6px_rgba(6,182,212,0.85)]">
            <animateMotion dur="6s" repeatCount="indefinite">
              <mpath href={`#${id}`} />
            </animateMotion>
          </circle>

          {/* Floating transaction label pill */}
          {data.payloadText && (
            <g>
              <animateMotion dur="6s" repeatCount="indefinite">
                <mpath href={`#${id}`} />
              </animateMotion>
              <foreignObject
                width="180"
                height="32"
                x="-90"
                y="-36"
                className="overflow-visible pointer-events-none"
              >
                <div 
                  className="px-2.5 py-1.5 rounded-full text-[9px] font-mono font-bold border backdrop-blur-md shadow-lg shadow-black/85 flex items-center justify-center gap-1.5 select-none text-white whitespace-nowrap animate-pulse"
                  style={{
                    backgroundColor: 'rgba(9, 13, 22, 0.92)',
                    borderColor: `${data.flowColor}50`,
                    boxShadow: `0 0 14px ${data.flowColor}30`,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: data.flowColor }} />
                  <span className="truncate max-w-[150px]" style={{ color: '#f1f5f9' }}>{data.payloadText}</span>
                </div>
              </foreignObject>
            </g>
          )}
        </>
      )}
    </>
  );
};

const edgeTypesMap = {
  customEdge: CustomDataFlowEdge,
};

// Renders individual Figma-style multiplayer cursors
interface CursorOverlayProps {
  user: CollabUser;
}

const CursorOverlay: React.FC<CursorOverlayProps> = ({ user }) => {
  if (!user.cursor) return null;
  
  return (
    <div
      className="absolute pointer-events-none z-50 flex items-center gap-1.5 transition-all duration-75 ease-out select-none"
      style={{
        left: `${user.cursor.x}px`,
        top: `${user.cursor.y}px`,
      }}
    >
      <svg
        className="w-5 h-5 drop-shadow-md shrink-0"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M5.5 3.21V19.45L10.3 14.8L15.6 20.3L18.8 17.2L13.5 11.7L18.8 11.2L5.5 3.21Z"
          fill={user.color || '#06b6d4'}
          stroke="#030712"
          strokeWidth="1.5"
        />
      </svg>
      <div 
        className="px-2 py-0.5 rounded text-[9px] font-bold text-slate-950 font-sans shadow-lg uppercase tracking-wide truncate max-w-[120px]"
        style={{ backgroundColor: user.color || '#06b6d4' }}
      >
        {user.username}
      </div>
    </div>
  );
};

interface CanvasProps {
  nodes: any[];
  edges: any[];
  onNodesChange: any;
  onEdgesChange: any;
  onNodeDragStop: any;
  nodeTypesMap: any;
  blueprint: any; // Holds WorkflowData
  resiliency?: ResiliencyData | null;
  collabUsers: CollabUser[];
  onExportPNG: () => void;
  onCopyMermaid: () => void;
  onDownloadJSON: () => void;
  language: 'th' | 'en';
  isMounted: boolean;
  
  // Playback triggers
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentStepIndex: number;
  onStepClick: (idx: number) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeDragStop,
  nodeTypesMap,
  blueprint,
  resiliency,
  collabUsers,
  onExportPNG,
  onCopyMermaid,
  onDownloadJSON,
  language,
  isMounted,
  isPlaying,
  onTogglePlay,
  currentStepIndex,
  onStepClick
}) => {
  const [gridPattern, setGridPattern] = useState<'dots' | 'lines' | 'none'>('dots');
  const [gridGap, setGridGap] = useState<number>(30);
  const [gridColor, setGridColor] = useState<string>('#ffffff');
  const [showGridSettings, setShowGridSettings] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<any>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Fit view when entering/exiting fullscreen
  useEffect(() => {
    if (!rfInstance) return;
    const timeoutId = setTimeout(() => {
      rfInstance.fitView({ padding: 0.15, duration: 400 });
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [isFullscreen, rfInstance]);

  // Memoize nodeTypes and edgeTypes to silence React Flow re-creation warnings
  const nodeTypes = React.useMemo(() => nodeTypesMap, [nodeTypesMap]);
  const edgeTypes = React.useMemo(() => edgeTypesMap, []);

  // Fit view when blueprint or currentStepIndex changes (guarantees stable hook dependencies)
  useEffect(() => {
    if (!rfInstance || !blueprint) return;
    // Delay slightly to allow React Flow to fully render all nodes before fitting view
    const timeoutId = setTimeout(() => {
      rfInstance.fitView({ padding: 0.2, duration: 600 });
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [blueprint, rfInstance, currentStepIndex]);

  if (!isMounted) return null;

  const steps = blueprint?.steps || [];
  const stepFlows = resiliency?.step_flows || [];

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -260, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 260, behavior: 'smooth' });
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`flex-1 w-full h-full min-h-0 relative overflow-hidden border border-white/15 bg-slate-950 flex flex-col transition-all duration-300 ${
        isFullscreen ? 'rounded-none border-none p-4' : 'rounded-2xl mt-2 shadow-2xl bg-slate-900/90 backdrop-blur-md'
      }`}
    >
      
      {/* Collaboration Users Presence & Toolbar Control Row */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-3 select-none">
        {/* Grid Background Customizer Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowGridSettings(!showGridSettings)}
            className={`p-2 bg-slate-950/95 border border-white/10 hover:border-white/20 rounded-xl backdrop-blur-md shadow-lg transition-all flex items-center justify-center cursor-pointer ${
              showGridSettings ? 'bg-cyan-600/20 text-cyan-400 border-cyan-500/30' : 'text-gray-400 hover:text-white'
            }`}
            title={language === 'th' ? 'ตั้งค่าตารางแคนวาส' : 'Canvas Grid Settings'}
          >
            <Settings className={`w-4 h-4 ${showGridSettings ? 'animate-spin-slow text-cyan-400' : ''}`} />
          </button>

          {showGridSettings && (
            <div className="absolute right-0 top-12 w-56 bg-slate-950/95 border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-2xl z-50 text-left space-y-4 animate-fade-in-node">
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">
                  {language === 'th' ? 'รูปแบบตาราง' : 'Grid Pattern'}
                </span>
                <div className="grid grid-cols-3 gap-1 bg-slate-900/60 p-0.5 rounded-lg border border-white/5">
                  <button
                    onClick={() => setGridPattern('dots')}
                    className={`py-1 text-[9px] font-bold rounded-md transition-all cursor-pointer ${
                      gridPattern === 'dots' ? 'bg-cyan-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {language === 'th' ? 'จุด' : 'Dots'}
                  </button>
                  <button
                    onClick={() => setGridPattern('lines')}
                    className={`py-1 text-[9px] font-bold rounded-md transition-all cursor-pointer ${
                      gridPattern === 'lines' ? 'bg-cyan-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {language === 'th' ? 'เส้น' : 'Lines'}
                  </button>
                  <button
                    onClick={() => setGridPattern('none')}
                    className={`py-1 text-[9px] font-bold rounded-md transition-all cursor-pointer ${
                      gridPattern === 'none' ? 'bg-cyan-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {language === 'th' ? 'ซ่อน' : 'None'}
                  </button>
                </div>
              </div>

              {gridPattern !== 'none' && (
                <>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                      <span>{language === 'th' ? 'ระยะห่างตาราง' : 'Grid Spacing'}</span>
                      <span className="text-cyan-400 font-mono font-bold">{gridGap}px</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="60"
                      step="5"
                      value={gridGap}
                      onChange={(e) => setGridGap(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">
                      {language === 'th' ? 'สีของเส้น/จุดตาราง' : 'Grid Color Tone'}
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { color: '#ffffff', label: 'Light' },
                        { color: '#38bdf8', label: 'Cyan' },
                        { color: '#a855f7', label: 'Purple' },
                        { color: '#10b981', label: 'Emerald' }
                      ].map((t) => (
                        <button
                          key={t.color}
                          onClick={() => setGridColor(t.color)}
                          className={`h-5 rounded border text-[8px] font-semibold transition-all cursor-pointer ${
                            gridColor === t.color 
                              ? 'border-cyan-500 scale-105 shadow-sm shadow-cyan-500/20' 
                              : 'border-white/5 hover:border-white/20'
                          }`}
                          style={{ backgroundColor: t.color === '#ffffff' ? 'rgba(255,255,255,0.1)' : `${t.color}25`, color: t.color === '#ffffff' ? '#e2e8f0' : t.color }}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {collabUsers.length > 0 && (
          <div className="flex items-center gap-1.5 bg-slate-950/95 border border-white/10 p-2 rounded-xl backdrop-blur-md shadow-lg select-none">
            <div className="flex -space-x-2.5">
              {collabUsers.map((user) => (
                <div
                  key={user.id}
                  title={user.username}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-950 border border-slate-950 transition-transform hover:scale-110"
                  style={{ backgroundColor: user.color || '#06b6d4' }}
                >
                  {user.username.split(' ').map(n => n[0]).join('')}
                </div>
              ))}
            </div>
            <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-wider px-1">
              {collabUsers.length} online
            </span>
          </div>
        )}
      </div>

      {/* Floating Design Exporters */}
      {blueprint && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-slate-950/80 border border-white/10 p-2 rounded-xl backdrop-blur-md select-none">
          <button
            onClick={onExportPNG}
            className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
            title={language === 'th' ? 'บันทึกภาพแคนวาส PNG' : 'Export Visual Capture'}
          >
            <Download className="w-4.5 h-4.5 text-cyan-400" />
          </button>
          <button
            onClick={onCopyMermaid}
            className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
            title={language === 'th' ? 'คัดลอก Mermaid Code' : 'Copy Mermaid Markup'}
          >
            <Copy className="w-4.5 h-4.5 text-indigo-400" />
          </button>
          <button
            onClick={onDownloadJSON}
            className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
            title={language === 'th' ? 'ดาวน์โหลดสเปคดีไซน์ JSON' : 'Download Design JSON'}
          >
            <FileDown className="w-4.5 h-4.5 text-amber-500" />
          </button>
          <div className="w-[1px] h-4 bg-white/10 mx-1" />
          <button
            onClick={toggleFullscreen}
            className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? (language === 'th' ? 'ย่อหน้าจอ' : 'Exit Fullscreen') : (language === 'th' ? 'เต็มหน้าจอ' : 'Enter Fullscreen')}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4.5 h-4.5 text-emerald-400 animate-pulse" />
            ) : (
              <Maximize2 className="w-4.5 h-4.5 text-emerald-400" />
            )}
          </button>
        </div>
      )}

      {/* Primary ReactFlow Viewport */}
      <div className="flex-1 w-full h-full min-h-0 relative overflow-hidden flex flex-col">
        {!blueprint ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-4 p-8 z-10 select-none">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 animate-pulse shadow-inner">
              <Layers className="w-7 h-7 text-cyan-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">
                {language === 'th' ? 'ระบบช่วยดีไซน์และจำลองการวิ่งของข้อมูล (Workflow Designer)' : 'AI-Powered Workflow System Designer'}
              </h4>
              <p className="text-xs text-slate-300 max-w-sm mt-1 leading-relaxed">
                {language === 'th'
                  ? 'พิมพ์โจทย์ที่ช่องด้านซ้าย เช่น "ระบบกดบัตรคอนเสิร์ต 1M Users" เพื่อเจนเนอเรตสถาปัตยกรรม 4-Tier, วิเคราะห์หาความเสี่ยง และจำลองทราฟฟิกทันที!'
                  : 'Enter a scenario on the left panel (e.g. "ระบบกดบัตรคอนเสิร์ต 1M Users") to synthesize microservices structure layers and simulate end-to-end data flows.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeDragStop={onNodeDragStop}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onInit={setRfInstance}
              minZoom={0.15}
              maxZoom={1.5}
              connectionLineType={ConnectionLineType.SmoothStep}
            >
              <Background 
                variant={(gridPattern === 'dots' ? 'dots' : gridPattern === 'lines' ? 'lines' : undefined) as any} 
                color={gridColor} 
                gap={gridGap} 
                size={gridPattern === 'dots' ? 1.5 : 1} 
                style={{ opacity: gridPattern === 'none' ? 0 : (gridColor === '#ffffff' ? 0.08 : 0.15) }} 
              />
              <Controls className="!bg-slate-950 !border-white/10 !shadow-2xl" />
              <MiniMap 
                nodeColor={(n: any) => {
                  if (n.data?.layerId === 'presentation') return '#8b5cf6';
                  if (n.data?.layerId === 'application') return '#14b8a6';
                  if (n.data?.layerId === 'queue') return '#f59e0b';
                  if (n.data?.layerId === 'data') return '#3b82f6';
                  return '#06b6d4';
                }}
                maskColor="rgba(3, 7, 18, 0.75)"
                style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </ReactFlow>

            {/* Glowing Step-by-Step Playback Controller */}
            {steps.length > 0 && (
              <div className={`absolute bottom-6 left-6 right-6 z-20 bg-slate-950/95 border border-white/10 p-4 rounded-2xl backdrop-blur-xl shadow-2xl flex flex-col ${isCollapsed ? 'gap-0' : 'gap-3'} text-left transition-all duration-500 ease-in-out hover:border-white/15 animate-fade-in-node`}>
                
                {/* Header controls */}
                <div className={`flex items-center justify-between shrink-0 select-none transition-all duration-300 ${
                  isCollapsed ? 'pb-0 border-b-0' : 'border-b border-white/5 pb-2'
                }`}>
                  <div className="flex items-center gap-2">
                    <Activity className={`w-4 h-4 text-cyan-400 ${isPlaying ? 'animate-pulse' : ''}`} />
                    <h5 className="text-[11px] font-bold text-white uppercase tracking-wider font-sans">
                      {language === 'th' ? '🗺️ แผนภาพสเปกตรัมการวิ่งของข้อมูล (End-to-End Workflow)' : '🗺️ End-to-End Data Transaction Spectrum'}
                    </h5>
                  </div>
                  
                  {/* Play controller controls */}
                  <div className="flex items-center gap-3">
                    {!isCollapsed && (
                      <div className="flex items-center gap-1 bg-slate-900 border border-white/5 p-0.5 rounded-lg animate-fade-in-node">
                        <button 
                          onClick={handleScrollLeft}
                          className="p-1 hover:bg-white/5 text-gray-400 hover:text-white rounded transition-all cursor-pointer"
                          title="Scroll Left"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={handleScrollRight}
                          className="p-1 hover:bg-white/5 text-gray-400 hover:text-white rounded transition-all cursor-pointer"
                          title="Scroll Right"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <button
                      onClick={onTogglePlay}
                      className={`py-1.5 px-3.5 rounded-xl border text-[10px] font-extrabold flex items-center gap-2 cursor-pointer transition-all shadow-md ${
                        isPlaying 
                          ? 'bg-orange-600/10 border-orange-500/30 text-orange-400 hover:bg-orange-600/20 shadow-orange-500/5' 
                          : 'bg-cyan-600/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-600/20 shadow-cyan-500/5'
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-3 h-3 text-orange-400 fill-orange-400" />
                          <span>{language === 'th' ? '⏸️ หยุดชั่วคราว' : '⏸️ PAUSE PLAY'}</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 text-cyan-400 fill-cyan-400 animate-pulse" />
                          <span>{language === 'th' ? '▶️ เล่นเวิร์กโฟลว์' : '▶️ AUTO PLAY'}</span>
                        </>
                      )}
                    </button>

                    {currentStepIndex >= 0 && (
                      <button
                        onClick={() => onStepClick(-1)}
                        className="py-1.5 px-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-extrabold flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-rose-500/5 animate-fade-in-node"
                      >
                        <span>{language === 'th' ? '👁️ แสดงผังทั้งหมด' : '👁️ SHOW ALL'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => setIsCollapsed(!isCollapsed)}
                      className={`p-1.5 hover:bg-white/5 rounded-xl border border-white/5 hover:border-white/15 transition-all duration-300 cursor-pointer flex items-center justify-center ${
                        isCollapsed ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'text-gray-400 hover:text-white'
                      }`}
                      title={isCollapsed ? (language === 'th' ? 'ขยายสเปกตรัม' : 'Expand Spectrum') : (language === 'th' ? 'ย่อเก็บสเปกตรัม' : 'Collapse Spectrum')}
                    >
                      {isCollapsed ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Collapsible Steps Container */}
                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
                  isCollapsed ? 'max-h-0 opacity-0 pointer-events-none mt-0' : 'max-h-[200px] opacity-100 mt-0'
                }`}>
                  {/* Steps Horizontal Row */}
                  <div className="relative mt-1">
                    <div 
                      ref={scrollContainerRef}
                      className="flex gap-3 overflow-x-auto py-1.5 scrollbar-thin select-none scroll-smooth pr-10"
                      style={{ scrollbarWidth: 'thin' }}
                    >
                      {steps.map((step: any, idx: number) => {
                        const isActive = currentStepIndex === idx;
                        const matchingFlow = stepFlows.find((f: any) => f.step_number === step.number);
                        
                        let activeColorClass = 'border-slate-800 bg-slate-900/40 opacity-55 hover:opacity-100';
                        let flowBadge = null;

                        if (isActive) {
                          if (matchingFlow?.flow_type === 'sync') {
                            activeColorClass = 'border-cyan-500/50 bg-cyan-950/25 ring-1 ring-cyan-500/20 shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)] opacity-100';
                            flowBadge = <span className="text-[8px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/20 px-1 rounded">Sync</span>;
                          } else if (matchingFlow?.flow_type === 'async') {
                            activeColorClass = 'border-orange-500/50 bg-orange-950/25 ring-1 ring-orange-500/20 shadow-[0_0_15px_-3px_rgba(249,115,22,0.4)] opacity-100';
                            flowBadge = <span className="text-[8px] font-bold text-orange-400 uppercase tracking-widest bg-orange-500/10 border border-orange-500/20 px-1 rounded">Async</span>;
                          } else if (matchingFlow?.flow_type === 'event') {
                            activeColorClass = 'border-purple-500/50 bg-purple-950/25 ring-1 ring-purple-500/20 shadow-[0_0_15px_-3px_rgba(168,85,247,0.4)] opacity-100';
                            flowBadge = <span className="text-[8px] font-bold text-purple-400 uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-1 rounded">Event</span>;
                          } else {
                            activeColorClass = 'border-cyan-500/40 bg-slate-900/90 ring-1 ring-cyan-500/10 opacity-100';
                          }
                        }

                        return (
                          <div
                            key={step.id || idx}
                            onClick={() => onStepClick(idx)}
                            className={`flex-shrink-0 w-[240px] p-3 rounded-xl border text-[10px] cursor-pointer flex flex-col justify-between transition-all duration-300 font-sans ${activeColorClass}`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-mono text-cyan-400 font-bold uppercase tracking-wider">
                                  {language === 'th' ? `ขั้นที่ ${step.number}` : `Step ${step.number}`}
                                </span>
                                {flowBadge}
                              </div>
                              <h6 className="font-bold text-white line-clamp-1 text-[11px]">{step.title}</h6>
                              <p className="text-gray-400 mt-1 leading-relaxed line-clamp-2 text-[9px]">{step.description}</p>
                            </div>

                            {matchingFlow && matchingFlow.technical_protocol && (
                              <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[8px] text-gray-500 font-mono">
                                <span>Protocol:</span>
                                <span className="font-bold text-slate-300 uppercase">{matchingFlow.technical_protocol}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Gradient Fade Right */}
                    <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-950 to-transparent pointer-events-none z-10" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Render active cursors overlay for collaboration users */}
      {collabUsers.map((user) => (
        <CursorOverlay key={user.id} user={user} />
      ))}
    </div>
  );
};
