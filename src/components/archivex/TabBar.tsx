'use client';

import React from 'react';
import { Tab } from './types';

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  language: 'th' | 'en';
  onLanguageChange: (lang: 'th' | 'en') => void;
  status?: string;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTab,
  onChange,
  language,
  onLanguageChange,
  status = 'IDLE',
}) => {
  return (
    <div className="aether-tabbar h-[48px] px-6 bg-[var(--color-background)] border-b-[0.5px] border-[var(--color-border-tertiary)] flex items-center justify-between shrink-0 select-none">
      {/* Left side: Navigation Tabs */}
      <div className="flex h-full items-center gap-6 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`h-full px-1 flex items-center gap-2 cursor-pointer transition-all duration-[180ms] ease-out border-b-2 relative shrink-0 select-none outline-none ${
                isActive
                  ? 'border-[#534AB7] text-[#534AB7] drop-shadow-[0_0_10px_rgba(34,211,238,0.45)]'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <i className={`ti ${tab.icon} text-[14px] shrink-0`} />
              <span className="text-[14px] font-medium tracking-normal">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right side: Workspace status + language toggle */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="hud-input px-2.5 py-1 rounded-full border border-[var(--color-border-tertiary)] bg-[var(--color-background-secondary)] flex items-center gap-1.5">
          <span
            className={`hud-status-dot w-1.5 h-1.5 rounded-full shrink-0 ${
              status === 'IDLE' ? 'bg-slate-400' : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]'
            }`}
          />
          <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
            {status}
          </span>
        </div>

        <div className="hud-input flex items-center gap-1.5 bg-[var(--color-background-secondary)] px-1.5 py-0.5 rounded-full border border-[var(--color-border-tertiary)]">
          <button
            onClick={() => onLanguageChange('th')}
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider transition-all border-none cursor-pointer select-none outline-none ${
              language === 'th'
                ? 'bg-[#534AB7] text-white shadow-sm shadow-[#534AB7]/25'
                : 'bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            TH
          </button>
          <button
            onClick={() => onLanguageChange('en')}
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider transition-all border-none cursor-pointer select-none outline-none ${
              language === 'en'
                ? 'bg-[#534AB7] text-white shadow-sm shadow-[#534AB7]/25'
                : 'bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            EN
          </button>
        </div>
      </div>
    </div>
  );
};
