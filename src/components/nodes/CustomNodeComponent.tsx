import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { getNodeIcon } from './getNodeIcon';

export interface CustomNodeProps {
  data: {
    name: string;
    type: string;
    description: string;
    layerId: 'presentation' | 'application' | 'queue' | 'data' | string;
    isActive: boolean;
    risk: { risk_level: 'HIGH' | 'MEDIUM' | 'LOW'; risk_title: string; solution: string } | null;
    protocol: { flow_type: 'sync' | 'async' | 'event'; technical_protocol: string } | null;
    isNewlyModified: boolean;
    hasActiveStep: boolean;
  };
}

export const CustomNodeComponent: React.FC<CustomNodeProps> = ({ data }) => {
  const { name, type, description, layerId, isActive, risk, protocol, isNewlyModified, hasActiveStep } = data;

  let borderPulseClass = '';
  let protocolBadge = null;

  // Dynamic layer boundary border glow class
  let glowBorderClass = 'glow-border-data';
  if (layerId === 'presentation') glowBorderClass = 'glow-border-presentation';
  if (layerId === 'application') glowBorderClass = 'glow-border-application';
  if (layerId === 'queue') glowBorderClass = 'glow-border-queue';
  if (layerId === 'data') glowBorderClass = 'glow-border-data';

  if (isNewlyModified) {
    borderPulseClass = 'animate-pulse-glow-green border-emerald-500 bg-emerald-950/30';
  } else if (isActive && protocol) {
    if (protocol.flow_type === 'sync') {
      borderPulseClass = 'animate-pulse-glow-cyan border-cyan-500 bg-cyan-950/20';
      protocolBadge = <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Sync</span>;
    } else if (protocol.flow_type === 'async') {
      borderPulseClass = 'animate-pulse-glow-orange border-orange-500 bg-orange-950/20';
      protocolBadge = <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Async</span>;
    } else if (protocol.flow_type === 'event') {
      borderPulseClass = 'animate-pulse-glow-purple border-purple-500 bg-purple-950/20';
      protocolBadge = <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Event</span>;
    }
  } else if (isActive) {
    borderPulseClass = 'border-cyan-500/60 shadow-md shadow-cyan-500/25 scale-[1.02]';
  } else {
    borderPulseClass = glowBorderClass;
  }

  let accentClass = 'bg-gray-500';
  if (layerId === 'presentation') accentClass = 'bg-violet-500';
  if (layerId === 'application') accentClass = 'bg-teal-500';
  if (layerId === 'queue') accentClass = 'bg-amber-500';
  if (layerId === 'data') accentClass = 'bg-blue-500';

  // Apply visual focus contrast: dim and blur inactive nodes when there's an active step
  let dimClass = '';
  if (hasActiveStep && !isActive) {
    dimClass = 'opacity-20 grayscale brightness-[0.7] blur-[0.3px] scale-[0.98] transition-all duration-500 pointer-events-none';
  }

  return (
    <div
      className={`p-4 rounded-2xl border obsidian-card flex flex-col justify-between transition-all duration-300 relative overflow-hidden w-[240px] min-h-[116px] text-left shadow-2xl cursor-pointer select-none hover:-translate-y-1 ${borderPulseClass} ${dimClass}`}
    >
      {/* Glossy sheen overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/[0.03] to-transparent pointer-events-none rounded-bl-full" />

      {/* Target Handles for multi-directional systematic routing */}
      <Handle type="target" position={Position.Top} className="opacity-0 pointer-events-none" id="target-top-left" style={{ left: '25%' }} />
      <Handle type="target" position={Position.Top} className="opacity-0 pointer-events-none" id="target-top-center" style={{ left: '50%' }} />
      <Handle type="target" position={Position.Top} className="opacity-0 pointer-events-none" id="target-top-right" style={{ left: '75%' }} />
      <Handle type="target" position={Position.Bottom} className="opacity-0 pointer-events-none" id="target-bottom-left" style={{ left: '25%' }} />
      <Handle type="target" position={Position.Bottom} className="opacity-0 pointer-events-none" id="target-bottom-center" style={{ left: '50%' }} />
      <Handle type="target" position={Position.Bottom} className="opacity-0 pointer-events-none" id="target-bottom-right" style={{ left: '75%' }} />
      <Handle type="target" position={Position.Left} className="opacity-0 pointer-events-none" id="target-left" />
      <Handle type="target" position={Position.Right} className="opacity-0 pointer-events-none" id="target-right" />

      <div className="relative z-10 flex-1 flex flex-col justify-between">
        {/* Glow accent bar */}
        <div 
          className={`${accentClass} absolute top-0 left-0 w-1.5 h-full rounded-full opacity-90`} 
          style={{ boxShadow: `0 0 10px ${layerId === 'presentation' ? '#8b5cf6' : layerId === 'application' ? '#14b8a6' : layerId === 'queue' ? '#f59e0b' : '#3b82f6'}` }}
        />

        <div className="pl-2">
          <div className="flex items-start justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              {getNodeIcon(type, layerId)}
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest truncate max-w-[85px]">{type}</span>
            </div>
            <div className="flex gap-1 items-center shrink-0">
              {protocolBadge}
              {risk && (
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-lg border uppercase shrink-0 ${
                  risk.risk_level === 'HIGH'
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`}>
                  {risk.risk_level}
                </span>
              )}
            </div>
          </div>

          <h4 className="text-xs font-extrabold text-white mt-2 tracking-wide line-clamp-1">{name}</h4>
          <p className="text-[9.5px] text-gray-400 mt-1 line-clamp-2 leading-relaxed font-sans">{description}</p>
        </div>
      </div>

      {/* Source Handles for multi-directional systematic routing */}
      <Handle type="source" position={Position.Top} className="opacity-0 pointer-events-none" id="source-top-left" style={{ left: '25%' }} />
      <Handle type="source" position={Position.Top} className="opacity-0 pointer-events-none" id="source-top-center" style={{ left: '50%' }} />
      <Handle type="source" position={Position.Top} className="opacity-0 pointer-events-none" id="source-top-right" style={{ left: '75%' }} />
      <Handle type="source" position={Position.Bottom} className="opacity-0 pointer-events-none" id="source-bottom-left" style={{ left: '25%' }} />
      <Handle type="source" position={Position.Bottom} className="opacity-0 pointer-events-none" id="source-bottom-center" style={{ left: '50%' }} />
      <Handle type="source" position={Position.Bottom} className="opacity-0 pointer-events-none" id="source-bottom-right" style={{ left: '75%' }} />
      <Handle type="source" position={Position.Left} className="opacity-0 pointer-events-none" id="source-left" />
      <Handle type="source" position={Position.Right} className="opacity-0 pointer-events-none" id="source-right" />
    </div>
  );
};
