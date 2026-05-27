import React from 'react';

export interface LayerHeaderNodeProps {
  data: {
    title: string;
    colorClass: string;
    number: number;
  };
}

export const LayerHeaderNodeComponent: React.FC<LayerHeaderNodeProps> = ({ data }) => {
  const { title, colorClass, number } = data;
  return (
    <div 
      className="flex items-center gap-3 bg-slate-950/90 border border-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-md shadow-2xl pointer-events-none select-none text-left min-w-[200px] border-l-4"
      style={{ borderLeftColor: colorClass.split(' ')[1] === 'bg-violet-500' ? '#8b5cf6' : colorClass.split(' ')[1] === 'bg-teal-500' ? '#14b8a6' : colorClass.split(' ')[1] === 'bg-amber-500' ? '#f59e0b' : '#3b82f6' }}
    >
      <div className={`w-2 h-2 rounded-full ${colorClass.split(' ')[1] || 'bg-cyan-500'} animate-pulse`} style={{ boxShadow: '0 0 10px currentColor' }} />
      <div className="flex flex-col font-mono">
        <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Tier {number}</span>
        <span className={`text-[10px] font-extrabold uppercase tracking-[0.12em] ${colorClass.split(' ')[0] || 'text-cyan-400'}`}>{title}</span>
      </div>
    </div>
  );
};
