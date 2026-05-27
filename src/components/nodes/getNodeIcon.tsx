import React from 'react';
import {
  Globe,
  Shield,
  Cpu,
  Zap,
  Activity,
  HardDrive,
  Database,
  Server
} from 'lucide-react';

export const getNodeIcon = (type: string | undefined, layerId: string) => {
  if (!type) return <Server className="w-4 h-4 text-cyan-400" />;
  const t = type.toLowerCase();
  
  if (layerId === 'presentation') {
    if (t.includes('cdn') || t.includes('cloudflare')) return <Globe className="w-4 h-4 text-violet-400" />;
    return <Shield className="w-4 h-4 text-violet-400" />;
  }
  
  if (layerId === 'application') {
    return <Cpu className="w-4 h-4 text-teal-400" />;
  }
  
  if (layerId === 'queue') {
    return <Zap className="w-4 h-4 text-amber-400" />;
  }
  
  if (layerId === 'data') {
    if (t.includes('cache') || t.includes('redis')) return <Activity className="w-4 h-4 text-blue-400" />;
    if (t.includes('replica') || t.includes('read')) return <HardDrive className="w-4 h-4 text-blue-400" />;
    return <Database className="w-4 h-4 text-blue-400" />;
  }
  
  return <Server className="w-4 h-4 text-cyan-400" />;
};
