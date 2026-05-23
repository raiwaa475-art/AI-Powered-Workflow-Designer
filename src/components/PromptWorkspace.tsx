import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  CheckSquare, 
  Square,
  Sparkles,
  RefreshCw,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  Code
} from 'lucide-react';
import { PromptEngineerData, WorkflowData } from '@/types';

interface PromptWorkspaceProps {
  promptInfo: PromptEngineerData | null;
  blueprint: WorkflowData | null;
  language: 'th' | 'en';
  isGenerating: boolean;
  onGeneratePrompts: () => Promise<void>;
  activePhaseIndex: number;
  setActivePhaseIndex: (idx: number) => void;
  checkedDoD: Record<string, boolean>;
  setCheckedDoD: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export const PromptWorkspace: React.FC<PromptWorkspaceProps> = ({
  promptInfo,
  blueprint,
  language,
  isGenerating,
  onGeneratePrompts,
  activePhaseIndex,
  setActivePhaseIndex,
  checkedDoD,
  setCheckedDoD,
}) => {
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Generate solid fallback / client-side dynamic prompt phases if LLM hasn't responded or isn't invoked yet
  const getDynamicFallbackData = (): PromptEngineerData => {
    if (!blueprint) {
      return {
        explanation: language === 'th' 
          ? 'กรุณาออกแบบพิมพ์เขียวระบบก่อนใช้งาน Prompt Workspace'
          : 'Please design a system blueprint first to explore Prompt Workspace.',
        phases: []
      };
    }

    const title = blueprint.title || 'System Ingestion Engine';
    const layers = blueprint.layers || [];
    const dbNodes = layers.find(l => l.id === 'data')?.nodes || [];
    const dbNames = dbNodes.map(n => `${n.name} (${n.type})`).join(', ') || 'Primary Database';
    
    const appNodes = layers.find(l => l.id === 'application')?.nodes || [];
    const appNames = appNodes.map(n => n.name).join(', ') || 'Core API Services';

    const queueNodes = layers.find(l => l.id === 'queue')?.nodes || [];
    const queueNames = queueNodes.map(n => n.name).join(', ') || 'Message Queue';

    const presNodes = layers.find(l => l.id === 'presentation')?.nodes || [];
    const presNames = presNodes.map(n => n.name).join(', ') || 'API Gateway & CDN';

    const explanationTh = `พิมพ์เขียวสำหรับระบบ "${title}" ได้รับการวิเคราะห์โดย Lead Architect แล้ว ระบบแบ่งการพัฒนาและสร้างโค้ดออกเป็น 3 เฟสอย่างเป็นขั้นตอนเพื่อป้องกันความขัดแย้งของฐานข้อมูลและการไหลของข้อมูลขาเข้า`;
    const explanationEn = `The system blueprint for "${title}" has been structured by the Lead Architect. Development is sliced into 3 progressive, isolated phases to prevent database constraint locks and structural mismatches.`;

    return {
      explanation: language === 'th' ? explanationTh : explanationEn,
      phases: [
        {
          phase_number: 1,
          title: language === 'th' ? 'Phase 1: โครงสร้างฐานข้อมูล & แคชคีย์ (Storage & Schema)' : 'Phase 1: Storage Layer & Cache Setup',
          description: language === 'th'
            ? `เริ่มต้นออกแบบ Schema, Tables, Indexes และแคชคีย์สำหรับ ${dbNames} ให้พร้อมรองรับ ACID`
            : `Set up schemas, tables, composite indices, and redis cache key maps for storage nodes: ${dbNames}.`,
          target_nodes: dbNodes.map(n => n.id),
          ai_role: language === 'th'
            ? 'คุณเป็น Lead Database Administrator และ Go/Node.js System Engineer'
            : 'You are an expert Relational Database Administrator and Senior Backend Engineer.',
          ai_instructions_prompt: `### DOWNSTREAM DEVELOPER AGENT INSTRUCTIONS
**Context:** We are building a high-concurrency system: "${title}".
**Role:** ${language === 'th' ? 'คุณคือวิศวกรออกแบบระบบฐานข้อมูล' : 'You are a database system engineer.'}
**Task:** Generate SQL Schemas, composite indexes, and Redis key configurations for the database layer.

**Technical Specifications (Target Nodes):**
${dbNodes.map(n => `- **${n.name} (${n.type})**: ${n.description}`).join('\n')}

**Requirements:**
1. Generate strict migrations/DDL scripts for all relational storage and cache mapping configurations.
2. Provide high-performance composite indexing queries supporting index-only scans.
3. Optimize eviction policies and isolation lock levels.

**Guardrails:**
- DO NOT implement any API endpoints or server logic yet. Focus ONLY on storage definitions, models, and migrations.
- Output clean, uncommented SQL or cache configs alongside high-level setup commands.`,
          definition_of_done: language === 'th'
            ? [
                `สร้างสคริปต์ SQL DDL สำหรับ ${dbNodes[0]?.name || 'Database Primary'} สำเร็จ`,
                'กำหนด Primary Keys, Foreign Keys, และ Indexes เรียบร้อย',
                'เขียนเอกสารโครงสร้าง Cache Key mappings บน Redis สำเร็จ'
              ]
            : [
                `Database schemas/DDL scripts created for ${dbNodes[0]?.name || 'Database Primary'}.`,
                'All database entities conform to ACID properties with clean relational mappings.',
                'Redis Cache key mappings documented and validated for concurrent lookups.'
              ]
        },
        {
          phase_number: 2,
          title: language === 'th' ? 'Phase 2: สร้าง Core API Services (Core Business logic)' : 'Phase 2: Business Logic & API Services',
          description: language === 'th'
            ? `พัฒนาและติดตั้ง Service logic บน ${appNames} เพื่อเชื่อมโยงฐานข้อมูล`
            : `Develop service handlers, route controllers, and repository models for application nodes: ${appNames}.`,
          target_nodes: appNodes.map(n => n.id),
          ai_role: language === 'th'
            ? 'คุณเป็น Senior Web API Microservice Architect'
            : 'You are a Senior Go and Node.js Web API Developer.',
          ai_instructions_prompt: `### DOWNSTREAM Microservice AGENT INSTRUCTIONS
**Context:** We are developing backend application services for: "${title}".
**Role:** Senior API Developer.
**Task:** Build highly structured, multi-tier application logic routing data between presentation layers and storage nodes.

**Technical Specifications (Target Nodes):**
${appNodes.map(n => `- **${n.name} (${n.type})**: ${n.description}`).join('\n')}

**Relational Context:**
- Connects back to storage layer nodes: ${dbNames}.

**Requirements:**
1. Implement clean REST API/gRPC routes matching system operations.
2. Formulate proper error handler middleware mapping status codes (400, 401, 404, 500).
3. Set up repository abstraction structures decoupled from database dialects.

**Guardrails:**
- DO NOT mock any network brokers or queue ingestion logic directly inside API servers; use dependency interfaces instead.
- Refrain from hardcoding environment variables; load configurations from environment files.`,
          definition_of_done: language === 'th'
            ? [
                'API Routes และ Controllers พร้อมใช้งานทั้งหมด',
                'โค้ดมีระบบ Error Handling และ Logging คลุมทุกจุดเสี่ยง',
                'เขียน unit tests ครอบคลุมฟังก์ชันทำรายการหลักอย่างน้อย 80%'
              ]
            : [
                'All REST / gRPC API controller routes successfully integrated.',
                'Global middleware handlers gracefully capture and format server logs/errors.',
                'Unit test assertions cover core transaction logic above 80% coverage.'
              ]
        },
        {
          phase_number: 3,
          title: language === 'th' ? 'Phase 3: เชื่อมต่อคิว & เกตเวย์ (Queues & Integration)' : 'Phase 3: Messaging Queues & Client Gateways',
          description: language === 'th'
            ? `เชื่อมโยงการเขียนฐานข้อมูลขาเข้าผ่าน ${queueNames} และจำกัดปริมาณโหลดขาเข้าทาง ${presNames}`
            : `Integrate queue message processors, event subscription streams, CDN cachers, and client APIs: ${queueNames}, ${presNames}.`,
          target_nodes: [...queueNodes.map(n => n.id), ...presNodes.map(n => n.id)],
          ai_role: language === 'th'
            ? 'คุณเป็น Lead DevOps Integration & Systems Architect'
            : 'You are a Lead DevOps Integration & Systems Specialist.',
          ai_instructions_prompt: `### SYSTEM INTEGRATION AGENT INSTRUCTIONS
**Context:** We are finishing the core stack of: "${title}".
**Role:** Elite DevOps Integration Expert.
**Task:** Configure queue subscriptions, ingestion buffers, API gateways, and CDN configurations to shield servers.

**Technical Specifications (Target Nodes):**
${[...queueNodes, ...presNodes].map(n => `- **${n.name} (${n.type})**: ${n.description}`).join('\n')}

**Flow Pipeline Context:**
- Connects app services (${appNames}) with queues and gateways.

**Requirements:**
1. Write functional consumer scripts pulling batches from the queues and writing synchronously to DB layers.
2. Formulate rate limit limits on the gateway nodes to prevent API congestion.
3. Configure CDN routing parameters to cache static web components.

**Guardrails:**
- DO NOT bypass the message broker for write operations; all high-speed transactions must be buffered.
- Keep security headers (CORS, CSP, HSTS) strictly aligned on external entry gateways.`,
          definition_of_done: language === 'th'
            ? [
                `การเชื่อมต่อคิวข้อความใน ${queueNames || 'Ingestion Queue'} ทำงานแบบ Event-driven สำเร็จ`,
                `เกตเวย์ระบบ ${presNames || 'Ingress Gateway'} เปิดระบบ Rate Limiting ป้องกันการยิงโหลดเกินขีดจำกัด`,
                'ระบบสามารถรันขึ้นทดสอบผ่าน Docker Compose ได้แบบ End-to-End ไร้ข้อผิดพลาด'
              ]
            : [
                `Event consumer workers successfully ingest and process messages from ${queueNames || 'Ingestion Queue'}.`,
                `Rate limiting policies configured on ${presNames || 'Ingress Gateway'} to restrict burst loads.`,
                'End-to-End local deployment validated successfully via containerized network environments.'
              ]
        }
      ]
    };
  };

  const data = promptInfo || getDynamicFallbackData();
  const phases = data.phases || [];
  const currentPhase = phases[activePhaseIndex];

  const handleCopyPrompt = () => {
    if (!currentPhase) return;
    navigator.clipboard.writeText(currentPhase.ai_instructions_prompt);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const toggleDoDItem = (key: string) => {
    setCheckedDoD(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!blueprint) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-slate-950/20 rounded-2xl border border-white/5 p-8 select-none">
        <div className="w-12 h-12 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center text-cyan-400">
          <Terminal className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">
            {language === 'th' ? 'กำลังรอข้อมูลพิมพ์เขียว...' : 'Awaiting system blueprint...'}
          </p>
          <p className="text-xs text-gray-500 max-w-sm mt-1.5 leading-relaxed">
            {language === 'th' 
              ? 'กรุณากดออกแบบระบบหรือประมวลผลเซสชันบนผัง Visual Canvas เพื่อให้ Prompt Engineer Agent สามารถวิเคราะห์ระบบได้'
              : 'Synthesize or modify the diagram first. Prompt phases with copyable Markdown scripts will map automatically.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 animate-fade-in-node">
      {/* 🚀 Header banner */}
      <div className="p-5 rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left space-y-1">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 select-none">
            <Cpu className="w-4 h-4 text-purple-400 animate-pulse" />
            <span>{language === 'th' ? '🤖 Prompt Engineer Agent (ตัวช่วยคุมงาน AI)' : '🤖 Prompt Engineer Agent Workspace'}</span>
          </h2>
          <p className="text-[10px] text-gray-500 leading-relaxed font-sans max-w-2xl">
            {data.explanation}
          </p>
        </div>

        <button
          onClick={onGeneratePrompts}
          disabled={isGenerating}
          className="self-start md:self-auto px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all duration-300 active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>
            {isGenerating
              ? (language === 'th' ? 'กำลังวิเคราะห์สถาปัตยกรรม...' : 'Synthesizing Prompts...')
              : (language === 'th' ? 'วิเคราะห์ด้วย AI ใหม่' : 'Re-engineer with LLM')}
          </span>
        </button>
      </div>

      {phases.length === 0 ? (
        <div className="py-12 text-center text-gray-500 text-xs italic">
          {language === 'th' ? 'ไม่มีเฟสการพัฒนาที่พร้อมใช้งาน' : 'No development phases available.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* 📑 Left timeline panel (4 cols) */}
          <div className="lg:col-span-4 space-y-3.5 select-none">
            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-mono font-bold block text-left mb-1">
              {language === 'th' ? 'ลำดับขั้นตอนเฟสพัฒนา (timeline)' : 'Progressive timeline steps'}
            </span>
            <div className="relative border-l border-white/5 pl-4 ml-2.5 space-y-4 text-left">
              {phases.map((phase, idx) => {
                const isActive = activePhaseIndex === idx;
                return (
                  <div key={`${phase.phase_number}-${idx}`} className="relative group">
                    {/* Pulsing indicator ring */}
                    <div className={`absolute -left-[25px] top-1.5 w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                      isActive 
                        ? 'bg-purple-500 border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)] scale-110' 
                        : 'bg-slate-950 border-white/10 group-hover:border-purple-400/40'
                    }`}>
                      {isActive && <div className="absolute inset-0.5 rounded-full bg-white animate-pulse" />}
                    </div>

                    <div
                      onClick={() => setActivePhaseIndex(idx)}
                      className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer text-left ${
                        isActive
                          ? 'bg-slate-900/60 border-purple-500/30 shadow-lg shadow-purple-950/10'
                          : 'bg-slate-900/20 border-white/5 hover:bg-slate-900/40 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                          isActive 
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                            : 'bg-slate-950 text-gray-400 border border-white/5'
                        }`}>
                          Phase {phase.phase_number}
                        </span>
                        <ArrowRight className={`w-3.5 h-3.5 transition-transform ${
                          isActive ? 'text-purple-400 translate-x-0.5' : 'text-gray-600 group-hover:text-gray-400 group-hover:translate-x-0.5'
                        }`} />
                      </div>

                      <h4 className={`text-xs font-bold tracking-wide transition-colors ${
                        isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'
                      }`}>
                        {phase.title}
                      </h4>
                      <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                        {phase.description}
                      </p>

                      {/* Targeted nodes badges */}
                      {phase.target_nodes?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {phase.target_nodes.map((nodeId, nodeIdx) => (
                            <span key={`${nodeId}-${nodeIdx}`} className="bg-slate-950/60 border border-white/5 text-slate-400 text-[8px] px-1 py-0.5 rounded font-mono">
                              #{nodeId}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 📋 Right main content / copy station (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {currentPhase && (
              <>
                {/* 📝 Phase Overview Obsidian Card */}
                <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/20 backdrop-blur-md text-left space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div>
                      <span className="text-[9px] text-purple-400 font-mono font-bold uppercase tracking-wider">
                        {language === 'th' ? 'บทบาท AI ที่แนะนำ' : 'Target AI Role / Persona'}
                      </span>
                      <h3 className="text-sm font-bold text-white tracking-wide mt-0.5">
                        {currentPhase.ai_role}
                      </h3>
                    </div>

                    <div className="bg-purple-950/20 px-3 py-1 rounded-full border border-purple-800/30 text-[9px] font-mono font-bold text-purple-400 uppercase tracking-widest">
                      Active Phase {currentPhase.phase_number}
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-300 leading-relaxed leading-relaxed font-sans">
                    {currentPhase.description}
                  </p>
                </div>

                {/* ⚡ The Prompt Copying Station */}
                <div className="flex flex-col bg-slate-950 border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative">
                  
                  {/* Code block header */}
                  <div className="bg-slate-900 border-b border-white/5 flex items-center justify-between px-4 py-3 shrink-0 select-none">
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4 text-purple-400" />
                      <span className="text-[10px] font-mono font-bold tracking-wider text-white uppercase">
                        {language === 'th' ? 'คำสั่งพร้อมก็อปปี้ (COPYABLE AI PROMPT)' : 'COPYABLE AI PROMPT WORKSPACE'}
                      </span>
                    </div>

                    <button
                      onClick={handleCopyPrompt}
                      className="px-3.5 py-1.5 rounded-xl border border-white/5 bg-slate-950 text-gray-400 hover:text-white hover:border-white/10 transition-all cursor-pointer flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider"
                      title="Copy System Prompt"
                    >
                      {copySuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                          <span className="text-emerald-400">{language === 'th' ? 'คัดลอกเรียบร้อย!' : 'Copied!'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{language === 'th' ? '📋 คัดลอกคำสั่ง' : '📋 Copy Prompt'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Code block body */}
                  <div className="p-5 overflow-auto text-[10px] font-mono bg-slate-950/90 text-left select-text scrollbar-thin text-gray-300 max-h-[350px] leading-relaxed whitespace-pre-wrap font-sans">
                    {currentPhase.ai_instructions_prompt}
                  </div>
                </div>

                {/* 🏁 Definition of Done (DoD) Checklist */}
                {currentPhase.definition_of_done?.length > 0 && (
                  <div className="p-5 rounded-2xl border border-white/5 bg-slate-900/25 backdrop-blur-md text-left space-y-4">
                    <div className="flex items-center gap-2 select-none">
                      <div className="w-7 h-7 rounded-lg bg-emerald-950/50 border border-emerald-800/30 flex items-center justify-center text-emerald-400">
                        <ShieldCheck className="w-4 h-4 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                          {language === 'th' ? 'รายการเช็คความสำเร็จ (Definition of Done)' : 'Phase Verification Checklist (Definition of Done)'}
                        </h3>
                        <p className="text-[8.5px] text-gray-500 font-sans mt-0.5">
                          {language === 'th' 
                            ? 'ตรวจทานคำตอบที่ได้จาก AI ตัวอื่นในเฟสนี้ตามเช็คลิสต์ด้านล่าง'
                            : 'Check off deliverables in this phase to guarantee full structural compliance.'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {currentPhase.definition_of_done.map((item, idx) => {
                        const itemKey = `${currentPhase.phase_number}-${idx}`;
                        const isChecked = checkedDoD[itemKey] || false;
                        return (
                          <div 
                            key={idx}
                            onClick={() => toggleDoDItem(itemKey)}
                            className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer select-none transition-all duration-200 ${
                              isChecked 
                                ? 'bg-slate-950/40 border-purple-500/20 text-gray-500' 
                                : 'bg-slate-950/20 border-white/5 hover:border-white/10 text-gray-200'
                            }`}
                          >
                            <div className={`mt-0.5 shrink-0 transition-colors duration-200 ${isChecked ? 'text-purple-400' : 'text-gray-600'}`}>
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <span className={`text-[10px] font-sans leading-relaxed block transition-all ${
                                isChecked ? 'line-through decoration-purple-500/20 text-gray-500 font-medium' : 'text-gray-200 font-medium'
                              }`}>
                                {item}
                              </span>
                              <span className="text-[8px] text-gray-600 font-mono mt-0.5 block">
                                {isChecked ? (language === 'th' ? '✓ สำเร็จ' : '✓ Verified') : (language === 'th' ? '⏳ รอดำเนินการ' : '⏳ Awaiting verification')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
