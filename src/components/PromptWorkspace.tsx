import React, { useState } from 'react';
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
  Code,
  HelpCircle,
  Play,
  RotateCcw
} from 'lucide-react';
import { PromptEngineerData, WorkflowData } from '@/types';

interface PromptWorkspaceProps {
  promptInfo: PromptEngineerData | null;
  blueprint: WorkflowData | null;
  language: 'th' | 'en';
  isGenerating: boolean;
  onGeneratePrompts: (customAnswers?: Record<string, string>) => Promise<void>;
  activePhaseIndex: number;
  setActivePhaseIndex: (idx: number) => void;
  checkedDoD: Record<string, boolean>;
  setCheckedDoD: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

  // New Business Logic Calibration parameters
  businessQuestions: any[] | null;
  setBusinessQuestions: (questions: any[] | null) => void;
  userAnswers: Record<string, string>;
  setUserAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isGeneratingQuestions: boolean;
  onGenerateQuestions: () => Promise<void>;
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
  businessQuestions,
  setBusinessQuestions,
  userAnswers,
  setUserAnswers,
  isGeneratingQuestions,
  onGenerateQuestions,
}) => {
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const handleCopyPrompt = () => {
    if (!promptInfo?.phases?.[activePhaseIndex]) return;
    navigator.clipboard.writeText(promptInfo.phases[activePhaseIndex].ai_instructions_prompt);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const toggleDoDItem = (key: string) => {
    setCheckedDoD(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAnswerChange = (qId: string, val: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [qId]: val
    }));
  };

  const handleResetCalibration = () => {
    setBusinessQuestions(null);
    setUserAnswers({});
    onGeneratePrompts(undefined); // Reset and generate defaults
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

  // Determine active view step:
  // - Step 1A: No questions loaded -> Ask to generate questionnaire
  // - Step 1B: Questions loaded, but Prompt has not been compiled yet -> Fill answers
  // - Step 2: Prompt compiled -> Render progressive prompt timelines
  const showTimelines = !!promptInfo;
  const showQuestionnaire = !promptInfo && businessQuestions && businessQuestions.length > 0;
  const showGenerateQuestionnaireBanner = !promptInfo && (!businessQuestions || businessQuestions.length === 0);

  return (
    <div className="flex flex-col space-y-6 animate-fade-in-node">
      
      {/* 1A: Welcome & Generate Questions Banner */}
      {showGenerateQuestionnaireBanner && (
        <div className="p-8 rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-md text-left max-w-4xl mx-auto space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-full bg-purple-500/5 rounded-l-full blur-3xl pointer-events-none" />
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-950/30 border border-purple-500/20 rounded-2xl text-purple-400 flex items-center justify-center shadow-lg">
              <Cpu className="w-7 h-7 animate-pulse text-purple-400" />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Interactive Developer Prompt Wizard</span>
              <h2 className="text-base font-bold text-white tracking-wide">
                {language === 'th' ? '🎯 ปลดล็อกตรรกะระบบด้วย Business Logic Calibration' : '🎯 Calibrate Architectural Business Logic'}
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed max-w-2xl font-sans">
                {language === 'th'
                  ? 'เพื่อให้ AI ปลายน้ำเจนเนอเรตโค้ดที่ "ใช้งานได้จริงตามเงื่อนไขของคุณ" สถาปนิกปัญญาประดิษฐ์จะทำการสแกนพิมพ์เขียวของคุณเพื่อตั้งคำถามจูนตรรกะระบบ (เช่น คีย์ชำระเงิน, นโยบายล็อกคิว) ให้คุณตอบก่อนหั่นเฟสพัฒนา'
                  : 'To ensure downstream AI generates custom code that fits your enterprise business logic perfectly, our Agent will scan your blueprint and pose 3-5 critical questions to calibrate lock timeouts, payment logic, and fallback limits.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onGenerateQuestions}
              disabled={isGeneratingQuestions || isGenerating}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-950/20 flex items-center gap-2 cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingQuestions ? 'animate-spin' : ''}`} />
              <span>
                {isGeneratingQuestions
                  ? (language === 'th' ? 'กำลังสแกนวิเคราะห์ระบบ...' : 'Scanning system structure...')
                  : (language === 'th' ? '1. สร้างคำถามตรรกะธุรกิจ' : '1. Generate Calibration Questions')}
              </span>
            </button>

            <button
              onClick={() => onGeneratePrompts(undefined)}
              disabled={isGeneratingQuestions || isGenerating}
              className="px-5 py-2.5 bg-slate-900 border border-white/5 hover:border-white/10 text-gray-300 hover:text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all"
            >
              <span>{language === 'th' ? 'ข้ามและใช้สมมติฐานเริ่มต้น ➔' : 'Skip & Compile Defaults ➔'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 1B: Calibrate Questionnaire inputs */}
      {showQuestionnaire && (
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-md text-left max-w-3xl mx-auto space-y-6 shadow-2xl animate-fade-in-node">
          <div className="border-b border-white/5 pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 select-none">
              <HelpCircle className="w-4 h-4 text-purple-400 animate-pulse" />
              <span>{language === 'th' ? '✍️ สัญญาสัมภาษณ์จูนตรรกะระบบ (Business Logic Inputs)' : '✍️ Business Logic Calibration Questionnaire'}</span>
            </h3>
            <p className="text-[10px] text-gray-500 mt-1">
              {language === 'th'
                ? 'กรอกคำตอบของคุณเพื่อปรับแต่งให้โค้ดและพรอมต์ที่จะเจนมี Logic ตรงตามที่คุณต้องการใช้ในโปรดักชันจริง'
                : 'Fill in your project specifications. Our agent will inject these parameters directly into the copyable phase prompts.'}
            </p>
          </div>

          <div className="space-y-5">
            {businessQuestions!.map((q: any, idx: number) => (
              <div key={q.id} className="space-y-2 p-4 rounded-xl bg-slate-950/40 border border-white/5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-2 leading-relaxed">
                    <span className="w-4.5 h-4.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] flex items-center justify-center font-mono font-bold">
                      {idx + 1}
                    </span>
                    {q.question}
                  </label>
                  {q.target_node && (
                    <span className="bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[8px] font-mono font-bold px-2 py-0.5 rounded-full">
                      #{q.target_node}
                    </span>
                  )}
                </div>

                <textarea
                  value={userAnswers[q.id] || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  placeholder={q.placeholder || (language === 'th' ? 'พิมพ์คำตอบหรือแนวทางจัดการที่ต้องการ...' : 'Specify requirements...')}
                  className="w-full h-16 bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500/50 transition-all font-sans resize-none leading-relaxed placeholder:text-gray-600"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => onGeneratePrompts(userAnswers)}
              disabled={isGenerating}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>{language === 'th' ? '2. สังเคราะห์พรอมต์โค้ดตามดีไซน์ ➔' : '2. Compile Calibrated Prompts ➔'}</span>
            </button>

            <button
              onClick={() => onGeneratePrompts(undefined)}
              disabled={isGenerating}
              className="px-5 py-2.5 bg-slate-900 border border-white/5 hover:border-white/10 text-gray-400 hover:text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all"
            >
              <span>{language === 'th' ? 'ข้าม / ใช้สมมติฐานเริ่มต้น' : 'Skip & Use Defaults'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 2: Prompts compiled */}
      {showTimelines && (
        <>
          {/* Header banner with reset button */}
          <div className="p-5 rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
            <div className="text-left space-y-1">
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span>{language === 'th' ? '🤖 Prompt Engineer Agent (ตัวช่วยคุมงาน AI)' : '🤖 Prompt Engineer Agent Workspace'}</span>
                </h2>
                {Object.keys(userAnswers).length > 0 && (
                  <span className="bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse-glow-emerald">
                    {language === 'th' ? '✓ ปรับจูน Logic แล้ว' : '✓ Logic Calibrated'}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed font-sans max-w-2xl">
                {promptInfo!.explanation}
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start md:self-auto">
              <button
                onClick={handleResetCalibration}
                className="px-3.5 py-2 bg-slate-950 border border-white/10 hover:border-white/15 text-gray-400 hover:text-white text-[10px] font-extrabold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
                title="Reset Calibration Questions & Answers"
              >
                <RotateCcw className="w-3 h-3 text-purple-400" />
                <span>{language === 'th' ? 'รีเซ็ตตรรกะ' : 'Reset Calibration'}</span>
              </button>

              <button
                onClick={() => onGeneratePrompts(Object.keys(userAnswers).length > 0 ? userAnswers : undefined)}
                disabled={isGenerating}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all duration-300 active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>
                  {isGenerating
                    ? (language === 'th' ? 'กำลังวิเคราะห์สถาปัตยกรรม...' : 'Synthesizing Prompts...')
                    : (language === 'th' ? 'วิเคราะห์ด้วย AI ใหม่' : 'Re-engineer with LLM')}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Timeline switch (4 cols) */}
            <div className="lg:col-span-4 space-y-3.5 select-none">
              <span className="text-[9px] text-gray-500 uppercase tracking-widest font-mono font-bold block text-left mb-1">
                {language === 'th' ? 'ลำดับขั้นตอนเฟสพัฒนา (timeline)' : 'Progressive timeline steps'}
              </span>
              <div className="relative border-l border-white/5 pl-4 ml-2.5 space-y-4 text-left">
                {promptInfo!.phases.map((phase, idx) => {
                  const isActive = activePhaseIndex === idx;
                  return (
                    <div key={`${phase.phase_number}-${idx}`} className="relative group">
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

            {/* Prompt details & DoD (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {promptInfo!.phases[activePhaseIndex] && (
                <>
                  {/* Phase Overview */}
                  <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/20 backdrop-blur-md text-left space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div>
                        <span className="text-[9px] text-purple-400 font-mono font-bold uppercase tracking-wider">
                          {language === 'th' ? 'บทบาท AI ที่แนะนำ' : 'Target AI Role / Persona'}
                        </span>
                        <h3 className="text-sm font-bold text-white tracking-wide mt-0.5">
                          {promptInfo.phases[activePhaseIndex].ai_role}
                        </h3>
                      </div>

                      <div className="bg-purple-950/20 px-3 py-1 rounded-full border border-purple-800/30 text-[9px] font-mono font-bold text-purple-400 uppercase tracking-widest">
                        Active Phase {promptInfo.phases[activePhaseIndex].phase_number}
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
                      {promptInfo.phases[activePhaseIndex].description}
                    </p>
                  </div>

                  {/* Copy Station */}
                  <div className="flex flex-col bg-slate-950 border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative">
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

                    <div className="p-5 overflow-auto text-[10.5px] font-mono bg-slate-950/90 text-left select-text scrollbar-thin text-gray-300 max-h-[350px] leading-relaxed whitespace-pre-wrap font-sans">
                      {promptInfo.phases[activePhaseIndex].ai_instructions_prompt}
                    </div>
                  </div>

                  {/* Definition of Done (DoD) */}
                  {promptInfo.phases[activePhaseIndex].definition_of_done?.length > 0 && (
                    <div className="p-5 rounded-2xl border border-white/5 bg-slate-900/25 backdrop-blur-md text-left space-y-4">
                      <div className="flex items-start gap-3 select-none">
                        <div className="w-8 h-8 rounded-lg bg-emerald-950/50 border border-emerald-800/30 flex items-center justify-center text-emerald-400 shrink-0">
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
                        {promptInfo.phases[activePhaseIndex].definition_of_done.map((item, idx) => {
                          const itemKey = `${promptInfo.phases[activePhaseIndex].phase_number}-${idx}`;
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
        </>
      )}

    </div>
  );
};
