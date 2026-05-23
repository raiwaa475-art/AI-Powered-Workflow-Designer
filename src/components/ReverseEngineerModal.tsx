import React, { useState } from 'react';
import { X, Folder, Upload, Send, Sparkles, AlertTriangle } from 'lucide-react';

interface ReverseEngineerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReverseEngineer: (payload: { zipBase64?: string; repoUrl?: string }) => void | Promise<void>;
  language: 'th' | 'en';
}

export const ReverseEngineerModal: React.FC<ReverseEngineerModalProps> = ({
  isOpen,
  onClose,
  onReverseEngineer,
  language
}) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  if (!isOpen) return null;

  const handleGitHubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim() || !repoUrl.includes('github.com')) {
      setErrorMsg(language === 'th' ? 'กรุณากรอกลิงก์ GitHub สาธารณะที่ถูกต้อง' : 'Please provide a valid public GitHub repository link.');
      return;
    }

    setErrorMsg(null);
    setLoadingStep(language === 'th' ? 'กำลังดึงโครงสร้างไฟล์จาก Repository...' : 'Fetching directory tree structures...');
    
    try {
      // Simulate incremental steps
      setTimeout(() => {
        setLoadingStep(language === 'th' ? 'กำลังสแกนหาไฟล์ AST & Dependencies...' : 'Scanning files and extracting static dependencies...');
      }, 1000);
      
      setTimeout(() => {
        setLoadingStep(language === 'th' ? 'กำลังแมปคีย์ และสร้าง Blueprint แผนผัง...' : 'Mapping layers and reconstructing architecture blueprint...');
      }, 2000);

      await onReverseEngineer({ repoUrl: repoUrl.trim() });
      setLoadingStep(null);
      setRepoUrl('');
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || (language === 'th' ? 'เกิดข้อผิดพลาดในการวิเคราะห์โค้ด' : 'Failed to reverse engineer repository.'));
      setLoadingStep(null);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (!file.name.endsWith('.zip')) {
      setErrorMsg(language === 'th' ? 'รองรับเฉพาะไฟล์บีบอัดประเภท .ZIP เท่านั้น' : 'Only .ZIP compressed project files are supported.');
      return;
    }

    // Limit to 20MB for context safety
    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg(language === 'th' ? 'ขนาดไฟล์ห้ามเกิน 20MB' : 'ZIP file exceeds safety limits (Max 20MB).');
      return;
    }

    setErrorMsg(null);
    setLoadingStep(language === 'th' ? 'กำลังแตกไฟล์ ZIP โครงสร้างหลัก...' : 'Unzipping and loading project structure...');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result?.toString().split(',')[1];
        if (!base64) {
          setErrorMsg(language === 'th' ? 'อ่านไฟล์บีบอัดไม่สำเร็จ' : 'Failed to parse ZIP buffer.');
          setLoadingStep(null);
          return;
        }

        setTimeout(() => {
          setLoadingStep(language === 'th' ? 'กำลังประเมินโครงสร้างและ AST Dependencies...' : 'Parsing package configurations and route indicators...');
        }, 1000);

        setTimeout(() => {
          setLoadingStep(language === 'th' ? 'กำลังประมวลผลวาดสเปคแผนผังบน Canvas...' : 'Overhauling visual canvas components...');
        }, 2000);

        await onReverseEngineer({ zipBase64: base64 });
        setLoadingStep(null);
        onClose();
      };
      
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || (language === 'th' ? 'เกิดข้อผิดพลาดในการวิเคราะห์ ZIP' : 'Failed to reverse engineer ZIP.'));
      setLoadingStep(null);
    }
  };

  // Drag handles
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative animate-fade-in-node">
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-white text-base">
              {language === 'th' ? 'ถอดรหัสจากโค้ด (Reverse Engineer)' : 'Code to Diagram (Reverse Engineer)'}
            </span>
          </div>
          <button
            onClick={onClose}
            disabled={!!loadingStep}
            className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contents Area */}
        <div className="p-6 space-y-6">
          {loadingStep ? (
            /* Loading State spinner */
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin"></div>
                <Sparkles className="w-5 h-5 text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-white">{language === 'th' ? 'กำลังอ่านและแกะโครงสร้างโค้ด...' : 'Reverse Engineering Project...'}</p>
                <p className="text-xs text-cyan-400 font-mono animate-pulse">{loadingStep}</p>
              </div>
            </div>
          ) : (
            /* Upload Inputs */
            <div className="space-y-6">
              {errorMsg && (
                <div className="p-3.5 bg-rose-950/20 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 1. Drag & Drop Zip */}
              <div className="space-y-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  {language === 'th' ? '1. อัปโหลดซอร์สโค้ดโปรเจกต์ (.ZIP):' : '1. Drag & Drop Project Source Folder (.ZIP):'}
                </span>
                
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3 transition-all duration-300 relative cursor-pointer ${
                    isDragActive
                      ? 'border-cyan-500 bg-cyan-950/10 shadow-lg shadow-cyan-900/10'
                      : 'border-white/10 bg-slate-950/40 hover:border-white/20'
                  }`}
                >
                  <input
                    type="file"
                    accept=".zip"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="p-3 bg-cyan-500/10 rounded-2xl">
                    <Upload className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-white">
                      {language === 'th' ? 'ลากไฟล์ ZIP มาวาง หรือคลิกเพื่อเปิด' : 'Drag file here or browse folders'}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {language === 'th' ? 'รองรับเฉพาะไฟล์ .zip (สูงสุด 20MB)' : 'Only .zip archives up to 20MB'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center justify-between text-slate-700 text-xs">
                <div className="h-[1px] bg-white/5 flex-1"></div>
                <span className="px-4 font-mono font-bold uppercase text-[10px]">
                  {language === 'th' ? 'หรือใช้งานผ่าน GitHub' : 'Or Use GitHub'}
                </span>
                <div className="h-[1px] bg-white/5 flex-1"></div>
              </div>

              {/* 2. GitHub Link input */}
              <form onSubmit={handleGitHubSubmit} className="space-y-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                  {language === 'th' ? '2. โคลนจาก GitHub Public Repository:' : '2. Clone Public GitHub Repository URL:'}
                </span>
                
                <div className="flex gap-2">
                  <input
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/username/project-repo"
                    className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-gray-600 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={!repoUrl.trim()}
                    className="px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-cyan-900/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {language === 'th' ? 'วิเคราะห์' : 'Analyze'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
