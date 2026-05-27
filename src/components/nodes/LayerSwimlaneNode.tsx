import React from 'react';

export interface LayerSwimlaneProps {
  data: {
    layerId: 'presentation' | 'application' | 'queue' | 'data' | string;
  };
}

export const LayerSwimlaneComponent: React.FC<LayerSwimlaneProps> = ({ data }) => {
  const { layerId } = data;

  let borderGlowClass = '';
  if (layerId === 'presentation') borderGlowClass = 'border-violet-500/10 shadow-[0_0_50px_rgba(139,92,246,0.015)]';
  if (layerId === 'application') borderGlowClass = 'border-teal-500/10 shadow-[0_0_50px_rgba(20,184,166,0.015)]';
  if (layerId === 'queue') borderGlowClass = 'border-amber-500/10 shadow-[0_0_50px_rgba(245,158,11,0.015)]';
  if (layerId === 'data') borderGlowClass = 'border-blue-500/10 shadow-[0_0_50px_rgba(59,130,246,0.015)]';

  return (
    <div
      className={`obsidian-panel w-[8000px] h-[260px] border-t border-b border-dashed flex items-center justify-start pointer-events-none select-none ${borderGlowClass}`}
      style={{ pointerEvents: 'none' }}
    />
  );
};
