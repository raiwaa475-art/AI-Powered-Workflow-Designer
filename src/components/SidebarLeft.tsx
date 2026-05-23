import React, { useState } from 'react';
import { Folder, Trash2, Save, X, Activity, Palette, Sparkles, Wand2 } from 'lucide-react';
import { SavedSession, WorkflowData, ResiliencyData, ScaleData, ChatMessage } from '@/types';

interface SidebarLeftProps {
  isOpen: boolean;
  onClose: () => void;
  savedSessions: SavedSession[];
  onLoadSession: (session: SavedSession) => void;
  onDeleteSession: (id: string) => void;
  onSaveCurrentSession: () => void;
  blueprint: any | null;
  onApplyPreset: (preset: any) => void;
  language: 'th' | 'en';
  resiliency?: any;
  scaleInfo?: any;
  chatHistory?: any[];
  techStack?: string;
  prompt?: string;
}

const PRESETS = [
  {
    id: 'obsidian-glass',
    name: 'Space Obsidian Glass',
    nameTh: 'Obsidian โทนอวกาศหรู',
    desc: 'Deep space dark mode with glass cards and cyan-purple glowing accents.',
    descTh: 'โหมดมืดลึกอวกาศ พร้อมการ์ดโปร่งแสงและประกายสีไซอัน-ม่วง',
    theme: {
      styleName: 'glassmorphism',
      backgroundCss: 'linear-gradient(135deg, #030712 0%, #0f172a 50%, #1e1b4b 100%)',
      primaryColor: '#06b6d4',
      secondaryColor: '#a855f7',
      textColor: '#ffffff',
      cardBackground: 'rgba(255, 255, 255, 0.03)'
    },
    typography: {
      headingFont: 'Outfit',
      bodyFont: 'Plus Jakarta Sans',
      importUrl: 'https://fonts.googleapis.com/css2?family=Outfit:wght@700;900&family=Plus+Jakarta+Sans:wght@300;400;600&display=swap'
    }
  },
  {
    id: 'emerald-radial',
    name: 'Vision 3D Emerald',
    nameTh: 'Emerald รัศมีมรกต 3D',
    desc: 'Deep velvet green radial gradients with gorgeous serif typography.',
    descTh: 'ไล่ระดับสีเขียวมรกตกำมะหยี่ลึก พร้อมฟอนต์เซริฟคลาสสิกสุดพรีเมียม',
    theme: {
      styleName: 'bento-grid',
      backgroundCss: 'radial-gradient(circle at center, #022c22 0%, #042f1a 40%, #020617 100%)',
      primaryColor: '#10b981',
      secondaryColor: '#06b6d4',
      textColor: '#f0fdf4',
      cardBackground: 'rgba(2, 44, 34, 0.4)'
    },
    typography: {
      headingFont: 'Cinzel',
      bodyFont: 'Josefin Sans',
      importUrl: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Josefin+Sans:wght@300;400;600&display=swap'
    }
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    nameTh: 'Cyberpunk นีออนล้ำอนาคต',
    desc: 'Futuristic high-contrast bold dark mode with screaming magenta highlights.',
    descTh: 'โหมดมืดคอนทราสต์สูง ตัดด้วยสีชมพูมาเจนตาและเหลืองนีออนแสบตา',
    theme: {
      styleName: 'neobrutalism',
      backgroundCss: 'linear-gradient(135deg, #09090b 0%, #020617 100%)',
      primaryColor: '#f43f5e',
      secondaryColor: '#d946ef',
      textColor: '#f8fafc',
      cardBackground: 'rgba(9, 9, 11, 0.8)'
    },
    typography: {
      headingFont: 'Syne',
      bodyFont: 'JetBrains Mono',
      importUrl: 'https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=JetBrains+Mono:wght@300;400;600&display=swap'
    }
  },
  {
    id: 'sunset-pastel',
    name: 'Sunset Pastel',
    nameTh: 'Sunset พาสเทลยามเย็น',
    desc: 'Soft warm luxury gradient with elegant playfair serif headings.',
    descTh: 'การไล่สีอุ่นหรูหราแบบโรแมนติก พร้อมฟอนต์หัวเรื่อง Playfair หรูคลาสสิก',
    theme: {
      styleName: 'minimalism',
      backgroundCss: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)',
      primaryColor: '#fb7185',
      secondaryColor: '#f43f5e',
      textColor: '#fff1f2',
      cardBackground: 'rgba(255, 255, 255, 0.04)'
    },
    typography: {
      headingFont: 'Playfair Display',
      bodyFont: 'Plus Jakarta Sans',
      importUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;600&display=swap'
    }
  },
  {
    id: 'warm-alabaster',
    name: 'Warm Alabaster (Light)',
    nameTh: 'Alabaster หินหรู (โหมดสว่าง)',
    desc: 'Premium warm stone color light mode for highly-readable clean portfolios.',
    descTh: 'โหมดสว่างโทนหินอุ่นระดับลักชัวรี อ่านง่าย สบายตา เหมาะสำหรับเว็บพอร์ตโฟลิโอ',
    theme: {
      styleName: 'minimalism',
      backgroundCss: 'radial-gradient(circle at top right, #fafaf9 0%, #f5f5f4 50%, #e7e5e4 100%)',
      primaryColor: '#1c1917',
      secondaryColor: '#78716c',
      textColor: '#1c1917',
      cardBackground: 'rgba(255, 255, 255, 0.85)'
    },
    typography: {
      headingFont: 'Outfit',
      bodyFont: 'Inter',
      importUrl: 'https://fonts.googleapis.com/css2?family=Outfit:wght@700;800&family=Inter:wght@300;400;600&display=swap'
    }
  },
  {
    id: 'neo-brutalism',
    name: 'Vibrant Neo-Brutalism',
    nameTh: 'Neo-Brutalism บล็อกสีนีออนเข้ม',
    desc: 'High-contrast block layouts with deep structural borders, Archivo headers, and bright orange CTAs.',
    descTh: 'บล็อกสไตล์โครงสร้างหนาตัดขอบเด่นชัด พร้อมฟอนต์ Archivo และปุ่ม Call-to-Action สีส้มร้อนแรง',
    theme: {
      styleName: 'neobrutalism',
      backgroundCss: 'linear-gradient(135deg, #0b0f19 0%, #111827 50%, #1e293b 100%)',
      primaryColor: '#3B82F6',
      secondaryColor: '#60A5FA',
      textColor: '#f8fafc',
      cardBackground: 'rgba(15, 23, 42, 0.75)'
    },
    typography: {
      headingFont: 'Archivo',
      bodyFont: 'Space Grotesk',
      importUrl: 'https://fonts.googleapis.com/css2?family=Archivo:wght@700;900&family=Space+Grotesk:wght@300;400;600&display=swap'
    }
  }
];

export const SidebarLeft: React.FC<SidebarLeftProps> = ({
  isOpen,
  onClose,
  savedSessions,
  onLoadSession,
  onDeleteSession,
  onSaveCurrentSession,
  blueprint,
  onApplyPreset,
  language
}) => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'presets'>('presets');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 w-80 bg-slate-950/95 border-r border-white/5 z-40 flex flex-col backdrop-blur-xl shadow-2xl animate-fade-in-node select-none">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-cyan-400" />
          <span className="font-semibold text-white tracking-wide">
            {language === 'th' ? 'แผงควบคุมสไตล์และเซสชัน' : 'Style & Sessions'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 p-1 bg-slate-950 shrink-0">
        <button
          onClick={() => setActiveTab('presets')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'presets' 
              ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/20 shadow-md' 
              : 'text-gray-500 hover:text-white'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>{language === 'th' ? 'Preset สี & ธีม' : 'Aesthetic Presets'}</span>
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'sessions' 
              ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/20 shadow-md' 
              : 'text-gray-500 hover:text-white'
          }`}
        >
          <Folder className="w-3.5 h-3.5" />
          <span>{language === 'th' ? 'ประวัติงานเซฟ' : 'Saved Sessions'}</span>
        </button>
      </div>

      {/* Conditionally Render Tabs */}
      {activeTab === 'presets' ? (
        /* PRESET THEMES LIST */
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          <div className="p-3 rounded-2xl bg-cyan-950/20 border border-cyan-500/10 text-left space-y-1.5">
            <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {language === 'th' ? 'สไตล์พรีเมียม 3D และกระจก' : 'Instant 3D & Glass Presets'}
            </h4>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              {language === 'th' 
                ? 'คลิกPresetใดๆ เพื่อเปลี่ยนสีพื้นหลังและชุดฟอนต์โดยทันที หากยังไม่ได้สร้างเว็บ ระบบจะสร้างเว็บตัวอย่างเริ่มต้นให้ทันที!'
                : 'Click any premium preset card to instantly switch gradients, colors, and typography settings in real-time.'}
            </p>
          </div>

          <div className="space-y-3">
            {PRESETS.map((preset) => {
              const isLight = preset.id === 'warm-alabaster';
              return (
                <button
                  key={preset.id}
                  onClick={() => onApplyPreset(preset)}
                  className="w-full text-left p-3.5 rounded-2xl border border-white/5 bg-slate-900/35 hover:bg-slate-900/70 hover:border-white/10 transition-all group flex flex-col gap-2 cursor-pointer shadow-lg relative overflow-hidden"
                >
                  {/* Theme Gradient Preview Strip */}
                  <div 
                    className="absolute top-0 right-0 w-3 h-full opacity-80" 
                    style={{ background: preset.theme.backgroundCss }}
                  />

                  <div>
                    <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                      {language === 'th' ? preset.nameTh : preset.name}
                    </span>
                    <p className="text-[10px] text-gray-500 mt-1 pr-4 leading-relaxed line-clamp-2">
                      {language === 'th' ? preset.descTh : preset.desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[8px] font-mono font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded">
                      {preset.theme.styleName}
                    </span>
                    <span className="text-[8px] font-mono font-bold uppercase tracking-wider bg-slate-800 text-cyan-400 border border-slate-700 px-1.5 py-0.5 rounded">
                      {preset.typography.headingFont}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* WORKSPACE SESSIONS LIST */
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-4 border-b border-white/5 bg-slate-900/40 shrink-0">
            <button
              onClick={onSaveCurrentSession}
              disabled={!blueprint}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {language === 'th' ? 'บันทึกดีไซน์ปัจจุบัน' : 'Save Current Design'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {savedSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
                <Activity className="w-8 h-8 text-gray-600 animate-pulse" />
                <p className="text-[10px] text-gray-400">
                  {language === 'th' ? 'ยังไม่มีดีไซน์ที่เซฟไว้' : 'No saved sessions found.'}
                </p>
              </div>
            ) : (
              savedSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-3.5 rounded-xl border border-white/5 bg-slate-900/35 hover:bg-slate-900/70 hover:border-white/10 transition-all group flex flex-col justify-between space-y-2 cursor-pointer"
                  onClick={() => onLoadSession(session)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-white truncate group-hover:text-cyan-400 transition-colors">
                        {session.title || 'Untitled Session'}
                      </span>
                      <span className="text-[10px] text-gray-500 mt-0.5 truncate">
                        {session.prompt || 'Custom prompt'}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="p-1.5 hover:bg-rose-950/20 rounded-lg text-gray-500 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-gray-400 pt-1">
                    <span className="bg-slate-800/80 px-2 py-0.5 rounded font-mono uppercase text-cyan-300 border border-slate-700/50">
                      {language === 'th' ? 'ดีไซน์เว็บบอร์ด' : 'Web Blueprint'}
                    </span>
                    <span>
                      {new Date(session.timestamp).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
