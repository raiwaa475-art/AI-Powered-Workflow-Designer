'use client';

import React from 'react';
import { Coins, Settings, FileCode, MessageSquare, Sparkles } from 'lucide-react';
import { TokenUsage } from '@/hooks/useGenerate';

interface TopbarProps {
  title: string;
  tokenUsage: TokenUsage;
  language: 'th' | 'en';
  onReverseOpen: () => void;
  onSettingsOpen: () => void;
  onChatOpen: () => void;
  blueprint: any;
  onNew: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  title,
  tokenUsage,
  language,
  onReverseOpen,
  onSettingsOpen,
  onChatOpen,
  blueprint,
  onNew,
}) => {
  return (
    <header className="h-[56px] px-6 bg-[var(--color-background-secondary)] border-b-[0.5px] border-[var(--color-border-tertiary)] flex items-center justify-between shrink-0 select-none z-30">
      {/* Left: Section/Page Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-[14px] font-medium text-[var(--color-text-primary)] tracking-wide">
          {title}
        </h1>
        {blueprint && (
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#534AB7]/10 text-[#534AB7] border border-[#534AB7]/20">
            {blueprint.title || 'Untitled Blueprint'}
          </span>
        )}
      </div>

      {/* Right: SaaS Controls & Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Token Tracker with Hover Breakdown */}
        <div className="relative group flex items-center gap-1.5 py-1 px-2.5 rounded-[var(--border-radius-md)] border-[0.5px] border-emerald-500/20 bg-emerald-500/5 text-emerald-500 text-[11px] font-mono font-bold cursor-help hover:bg-emerald-500/10 transition-all select-none">
          <Coins className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>Tokens: {tokenUsage.totalTokens.toLocaleString()}</span>
          
          <div className="absolute right-0 top-9 w-48 p-3.5 rounded-[var(--border-radius-lg)] bg-[var(--color-background-secondary)] border-[0.5px] border-[var(--color-border-tertiary)] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-[10px] space-y-1.5 normal-case font-normal tracking-normal text-left">
            <p className="font-medium text-[var(--color-text-primary)] uppercase tracking-wider text-center border-b border-[var(--color-border-tertiary)] pb-1.5">
              Token Usage
            </p>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Input:</span>
              <span className="text-emerald-500 font-bold font-mono">{tokenUsage.promptTokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Output:</span>
              <span className="text-emerald-500 font-bold font-mono">{tokenUsage.completionTokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--color-border-tertiary)] pt-1.5 font-bold">
              <span className="text-[var(--color-text-primary)]">Total:</span>
              <span className="text-[#534AB7] font-mono">{tokenUsage.totalTokens.toLocaleString()}</span>
            </div>
          </div>
        </div>



        {/* Import Code / Reverse Eng */}
        <button 
          onClick={onReverseOpen} 
          className="h-[30px] px-2.5 rounded-[var(--border-radius-md)] border-[0.5px] border-[var(--color-border-tertiary)] bg-transparent hover:bg-[var(--color-background-secondary)] text-[11px] text-[var(--color-text-primary)] flex items-center gap-1.5 cursor-pointer transition-all"
          title="Reverse Engineer Code"
        >
          <FileCode className="w-3.5 h-3.5 text-pink-500 shrink-0" />
          <span className="hidden sm:inline">{language === 'th' ? 'ถอดรหัสโค้ด' : 'Reverse Code'}</span>
        </button>

        {/* Settings Toggle */}
        <button 
          onClick={onSettingsOpen} 
          className="p-1.5 rounded-[var(--border-radius-md)] border-[0.5px] border-[var(--color-border-tertiary)] bg-transparent hover:bg-[var(--color-background-secondary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer"
          title="Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* New Blueprint */}
        <button
          onClick={onNew}
          className="h-[30px] px-3 rounded-[var(--border-radius-md)] border-[0.5px] border-[var(--color-border-tertiary)] hover:bg-[var(--color-background-secondary)] text-[11px] text-[var(--color-text-primary)] cursor-pointer transition-all select-none"
        >
          {language === 'th' ? 'สร้างใหม่' : 'New Blueprint'}
        </button>
      </div>
    </header>
  );
};
