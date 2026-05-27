'use client';

import React from 'react';
import { Agent } from './types';

interface AgentGridProps {
  agents: Agent[];
  activeAgentId: string;
  onSelectAgent: (id: string) => void;
}

export const AgentGrid: React.FC<AgentGridProps> = ({
  agents,
  activeAgentId,
  onSelectAgent,
}) => {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3 w-full select-none">
      {agents.map((agent) => {
        const isActive = activeAgentId === agent.id;
        return (
          <div
            key={agent.id}
            onClick={() => onSelectAgent(agent.id)}
            className={`hud-agent-card p-4 rounded-[var(--border-radius-lg)] border-[0.5px] bg-[var(--color-background)] cursor-pointer transition-all duration-[180ms] ease-out flex flex-col justify-center min-h-[104px] select-none ${
              isActive
                ? 'hud-agent-active border-[#534AB7] ring-[0.5px] ring-[#534AB7]'
                : 'border-[var(--color-border-tertiary)] hover:bg-[var(--color-background-secondary)]'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {/* 32x32 Icon Container */}
                <div
                  className={`w-8 h-8 rounded-[var(--border-radius-md)] flex items-center justify-center shrink-0 shadow-inner shadow-white/5 ${
                    agent.status === 'active' ? 'ring-1 ring-emerald-300/40 shadow-emerald-500/20' : ''
                  }`}
                  style={{ backgroundColor: agent.iconTint }}
                >
                  <i className={`ti ${agent.icon} text-[16px]`} style={{ color: agent.color }} />
                </div>
                {/* Agent Name */}
                <span className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate">
                  {agent.name}
                </span>
              </div>
              {/* Description */}
              <p className="text-[11.5px] text-[var(--color-text-muted)] line-clamp-2 leading-snug text-left font-normal pl-1">
                {agent.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
