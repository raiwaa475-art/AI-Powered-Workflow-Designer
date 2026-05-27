'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SavedSession } from '@/types';
import { NavItem } from './types';

interface SidebarProps {
  activeId: string;
  onChangeActiveId: (id: string) => void;
  logs?: string[];
  blueprint: any;
  tokenUsage: any;
  language: 'th' | 'en';
  onNew: () => void;
  savedSessions?: SavedSession[];
  onLoadSession?: (session: SavedSession) => void;
  onDeleteSession?: (id: string) => void;
  onSaveSession?: () => void;
  onApplyPreset?: (presetId: string) => void;
}

const SECTION_WORKSPACE: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: 'ti-layout-dashboard' },
  { id: 'blueprint', label: 'Blueprint', icon: 'ti-sitemap', badge: 'New' },
  { id: 'topology', label: 'Tech Topology', icon: 'ti-network' },
  { id: 'simulation', label: 'Live Simulation', icon: 'ti-player-play' },
];

const SECTION_AGENTS: NavItem[] = [
  { id: 'resiliency', label: 'Resiliency', icon: 'ti-shield-check' },
  { id: 'scale', label: 'Scale & Perf', icon: 'ti-trending-up' },
  { id: 'devops', label: 'DevOps / IaC', icon: 'ti-terminal-2' },
  { id: 'reverse-eng', label: 'Reverse Eng.', icon: 'ti-rotate' },
  { id: 'prompts', label: 'Prompt Builder', icon: 'ti-sparkles' },
];

const SECTION_OUTPUT: NavItem[] = [
  { id: 'code', label: 'Code Workspace', icon: 'ti-code' },
];

const FOOTER_ITEMS: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: 'ti-settings' },
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeId, 
  onChangeActiveId, 
  logs = [],
  blueprint,
  tokenUsage,
  language,
  onNew,
  savedSessions = [],
  onLoadSession,
  onDeleteSession,
  onSaveSession,
  onApplyPreset,
}) => {
  const [logsExpanded, setLogsExpanded] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logsExpanded && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, logsExpanded]);

  // Auto-expand logs panel when new logs arrive
  useEffect(() => {
    if (logs.length > 0) {
      setLogsExpanded(true);
    }
  }, [logs.length]);

  const renderItem = (item: NavItem) => {
    const isActive = activeId === item.id;
    return (
      <button
        key={item.id}
        onClick={() => onChangeActiveId(item.id)}
        className={`hud-nav-item w-full h-[38px] px-3 py-2 flex items-center justify-between rounded-lg cursor-pointer transition-all duration-[160ms] ease-out select-none border-none outline-none ${
          isActive
            ? 'hud-nav-item-active bg-white dark:bg-slate-900 border-[0.5px] border-[var(--color-border-tertiary)] shadow-sm'
            : 'bg-transparent hover:bg-[var(--color-background-secondary)]'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <i
            className={`ti ${item.icon} text-[16px] shrink-0 ${
              isActive ? 'text-cyan-300' : 'text-[var(--color-text-muted)]'
            }`}
          />
          <span
            className={`text-[13px] truncate ${
              isActive
                ? 'text-[var(--color-text-primary)] font-medium'
                : 'text-[var(--color-text-muted)] font-normal'
            }`}
          >
            {item.label}
          </span>
        </div>
        {item.badge && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#534AB7]/10 text-[#534AB7] font-medium tracking-wide">
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className="aether-sidebar w-[240px] h-full flex flex-col bg-[var(--color-background-secondary)] border-r-[0.5px] border-[var(--color-border-tertiary)] shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-[60px] px-4 flex items-center gap-2 border-b-[0.5px] border-[var(--color-border-tertiary)] shrink-0">
        <div className="w-[28px] h-[28px] bg-[#534AB7] rounded-lg flex items-center justify-center shrink-0 hud-scanline shadow-lg shadow-cyan-500/20">
          <i className="ti ti-activity text-white text-[14px]" />
        </div>
        <div className="min-w-0 text-left">
          <h2 className="text-[14px] font-semibold text-[var(--color-text-primary)] leading-tight truncate">
            Archivex AI
          </h2>
          <p className="text-[11px] text-[var(--color-text-muted)] leading-tight truncate font-normal">
            Multi-Agent Studio
          </p>
        </div>
      </div>

      {/* Action Buttons & Status Badge */}
      <div className="px-3 pt-3 flex flex-col gap-2 shrink-0">
        {/* "+ New Design" Button */}
        <button
          onClick={onNew}
          className="hud-primary-button w-full h-[40px] rounded-lg bg-[#534AB7] hover:bg-[#4339a2] text-[12px] font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-[#534AB7]/10 select-none border-none outline-none"
        >
          <i className="ti ti-plus text-[12px]" />
          <span>{language === 'th' ? 'ออกแบบระบบใหม่' : 'New System Design'}</span>
        </button>

        {/* Active Blueprint Badge */}
        {blueprint && (
          <div className="hud-panel p-2.5 rounded-lg border border-[#534AB7]/25 bg-[#534AB7]/5 flex flex-col gap-0.5 select-none text-left">
            <span className="text-[8px] font-bold text-[#534AB7] uppercase tracking-wider">
              {language === 'th' ? 'โปรเจกต์ที่เปิดอยู่' : 'Active Project'}
            </span>
            <span className="text-[11px] font-semibold text-[var(--color-text-primary)] truncate" title={blueprint.title || 'Untitled Blueprint'}>
              {blueprint.title || 'Untitled Blueprint'}
            </span>
          </div>
        )}
      </div>

      {/* Navigation scroll area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-none min-h-0">
        {/* Section Workspace */}
        <div className="space-y-1">
          <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block pl-2 mb-1.5 text-left">
            Workspace
          </span>
          {SECTION_WORKSPACE.map(renderItem)}
        </div>

        {/* Section Agents */}
        <div className="space-y-1">
          <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block pl-2 mb-1.5 text-left">
            Agents
          </span>
          {SECTION_AGENTS.map(renderItem)}
        </div>

        {/* Section Output */}
        <div className="space-y-1">
          <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block pl-2 mb-1.5 text-left">
            Output
          </span>
          {SECTION_OUTPUT.map(renderItem)}
        </div>

        {/* Section: Presets (Templates) */}
        {onApplyPreset && (
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block pl-2 mb-1.5 text-left">
              {language === 'th' ? 'เทมเพลตด่วน' : 'Quick Presets'}
            </span>
            <div className="flex flex-col gap-1 px-1">
              <button
                onClick={() => onApplyPreset('concert-booking-1m')}
                className="w-full text-left py-1.5 px-2 rounded hover:bg-[var(--color-background-secondary)] text-[11px] text-[var(--color-text-muted)] flex items-center gap-1.5 transition-colors border-none bg-transparent cursor-pointer"
              >
                <i className="ti ti-ticket text-purple-400" />
                <span className="truncate">{language === 'th' ? 'จองตั๋วคอนเสิร์ต 1M' : '1M Concert Tickets'}</span>
              </button>
              <button
                onClick={() => onApplyPreset('bike-iot-platform')}
                className="w-full text-left py-1.5 px-2 rounded hover:bg-[var(--color-background-secondary)] text-[11px] text-[var(--color-text-muted)] flex items-center gap-1.5 transition-colors border-none bg-transparent cursor-pointer"
              >
                <i className="ti ti-device-imac-cog text-pink-400" />
                <span className="truncate">{language === 'th' ? 'เช่าจักรยานไฟฟ้า IoT' : 'Electric Bike IoT'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Section: Saved Sessions */}
        <div className="space-y-1">
          <div className="flex items-center justify-between pl-2 pr-1 mb-1.5">
            <span className="text-[9px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              {language === 'th' ? 'เซสชันที่บันทึก' : 'Saved Sessions'}
            </span>
            {blueprint && onSaveSession && (
              <button
                onClick={onSaveSession}
                className="text-[9px] text-[#534AB7] hover:underline flex items-center gap-0.5 border-none bg-transparent cursor-pointer"
                title={language === 'th' ? 'บันทึกเซสชันปัจจุบัน' : 'Save Current Session'}
              >
                <i className="ti ti-device-floppy" />
                <span>{language === 'th' ? 'บันทึก' : 'Save'}</span>
              </button>
            )}
          </div>
          {savedSessions.length === 0 ? (
            <p className="text-[10px] text-[var(--color-text-muted)] italic px-2 py-1 text-left">
              {language === 'th' ? 'ไม่มีเซสชันที่บันทึกไว้' : 'No saved sessions'}
            </p>
          ) : (
            <div className="flex flex-col gap-1 max-h-[150px] overflow-y-auto pr-1">
              {savedSessions.map((session) => (
                <div
                  key={session.id}
                  className="group flex items-center justify-between py-1 px-2 rounded hover:bg-[var(--color-background-secondary)] text-[11px] text-[var(--color-text-muted)] transition-colors"
                >
                  <button
                    onClick={() => onLoadSession && onLoadSession(session)}
                    className="flex-1 text-left truncate font-normal text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] border-none bg-transparent cursor-pointer"
                    title={session.title || session.prompt}
                  >
                    {session.title || session.prompt}
                  </button>
                  {onDeleteSession && (
                    <button
                      onClick={() => onDeleteSession(session.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 p-0.5 border-none bg-transparent cursor-pointer"
                      title={language === 'th' ? 'ลบ' : 'Delete'}
                    >
                      <i className="ti ti-trash text-[11px]" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Real-time Engine Logs Panel */}
      {logs.length > 0 && (
        <div className="shrink-0 border-t-[0.5px] border-[var(--color-border-tertiary)]">
          {/* Log Panel Header */}
          <button
            onClick={() => setLogsExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 bg-transparent border-none outline-none cursor-pointer hover:bg-[var(--color-background-secondary)] transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0"
                style={{ boxShadow: '0 0 6px #22d3ee' }}
              />
              <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest">
                Engine Logs
              </span>
              <span className="text-[8px] font-mono text-gray-600 ml-0.5">
                ({logs.length})
              </span>
            </div>
            <i
              className={`ti ${logsExpanded ? 'ti-chevron-down' : 'ti-chevron-up'} text-[12px] text-[var(--color-text-muted)] transition-transform duration-200`}
            />
          </button>

          {/* Log Lines */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              logsExpanded ? 'max-h-44' : 'max-h-0'
            }`}
          >
            <div className="mx-3 mb-3 bg-slate-950/80 border border-white/5 rounded-xl p-2.5 font-mono text-[9px] text-cyan-400 space-y-1 overflow-y-auto max-h-36 select-text scrollbar-thin">
              {logs.map((log, idx) => (
                <div key={idx} className="flex gap-1.5 items-start">
                  <span className="text-gray-600 select-none shrink-0 mt-px">›</span>
                  <span className="break-all leading-relaxed">{log}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* Real-time Token Tracker */}
      {tokenUsage && (
        <div className="px-3 mb-2 shrink-0">
          <div className="relative group p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 text-[10.5px] font-mono font-bold flex items-center justify-between cursor-help transition-all select-none">
            <div className="flex items-center gap-1.5">
              <i className="ti ti-coins text-emerald-400 animate-pulse text-[13px]" />
              <span>Tokens: {tokenUsage.totalTokens.toLocaleString()}</span>
            </div>
            
            {/* Hover Breakdown Tooltip (displays to the right of the sidebar) */}
            <div className="absolute left-[210px] bottom-0 w-48 p-3.5 rounded-xl bg-slate-900 border border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 text-[10px] space-y-1.5 normal-case font-normal tracking-normal text-left">
              <p className="font-bold text-white uppercase tracking-wider text-center border-b border-white/5 pb-1.5">
                {language === 'th' ? 'การใช้งานโทเค็น' : 'Token Usage'}
              </p>
              <div className="flex justify-between">
                <span className="text-gray-400">Input:</span>
                <span className="text-emerald-400 font-bold font-mono">{tokenUsage.promptTokens.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Output:</span>
                <span className="text-emerald-400 font-bold font-mono">{tokenUsage.completionTokens.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-1.5 font-bold">
                <span className="text-white">Total:</span>
                <span className="text-[#534AB7] font-mono">{tokenUsage.totalTokens.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Nav */}
      <div className="p-3 border-t-[0.5px] border-[var(--color-border-tertiary)] shrink-0 bg-transparent">
        {FOOTER_ITEMS.map(renderItem)}
      </div>
    </aside>
  );
};
