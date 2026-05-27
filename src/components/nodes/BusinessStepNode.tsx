import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { getNodeIcon } from './getNodeIcon';

export interface BusinessStepNodeProps {
  data: {
    title: string;
    description: string;
    stepNumber: number;
    involvedNodesInfo?: Array<{ name: string; type: string; layerId: string }>;
    isActive: boolean;
    hasActiveStep: boolean;
  };
}

export const BusinessStepNodeComponent: React.FC<BusinessStepNodeProps> = ({ data }) => {
  const { title, description, stepNumber, involvedNodesInfo, isActive, hasActiveStep } = data;

  let borderGlowClass = 'border-white/10 hover:border-white/20';
  let dimClass = '';

  if (isActive) {
    borderGlowClass = 'border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-[1.02]';
  } else if (hasActiveStep) {
    dimClass = 'opacity-20 grayscale brightness-[0.7] blur-[0.2px] scale-[0.98] pointer-events-none transition-all duration-300';
  }

  return (
    <div
      className={`p-5 rounded-2xl border business-card flex flex-col transition-all duration-300 relative overflow-visible w-[340px] min-h-[190px] text-left shadow-lg cursor-pointer select-none ${borderGlowClass} ${dimClass}`}
    >
      <Handle type="target" position={Position.Left} className="opacity-0 pointer-events-none" id="target-left" />
      <Handle type="source" position={Position.Right} className="opacity-0 pointer-events-none" id="source-right" />

      <div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-amber-500 font-bold uppercase tracking-widest font-sans">Step {stepNumber}</span>
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" style={{ boxShadow: '0 0 8px #f59e0b' }} />
        </div>

        <h4 className="text-[14px] font-bold text-white mt-3 tracking-normal leading-snug break-words">{title}</h4>
        <p className="text-[12px] text-gray-300 mt-2 leading-relaxed break-words whitespace-normal">{description}</p>
      </div>

      {involvedNodesInfo && involvedNodesInfo.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-col gap-1 select-none">
          <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest font-sans">Involved Systems:</span>
          <div className="flex flex-wrap gap-1.5 items-center mt-0.5">
            {involvedNodesInfo.map((node: any, idx: number) => (
              <div 
                key={idx} 
                className="flex items-center gap-1 bg-slate-950/60 border border-white/5 px-1.5 py-0.5 rounded text-[8px] font-mono text-gray-400 hover:text-white transition-colors"
                title={`${node.name} (${node.type})`}
              >
                {getNodeIcon(node.type, node.layerId)}
                <span className="truncate max-w-[65px]">{node.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
