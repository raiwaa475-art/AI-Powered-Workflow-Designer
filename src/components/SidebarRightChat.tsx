import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Terminal, HelpCircle, Wrench } from 'lucide-react';
import { ChatMessage } from '@/types';

interface SidebarRightChatProps {
  isOpen: boolean;
  onClose: () => void;
  chatHistory: ChatMessage[];
  onSendMessage: (text: string) => void;
  isGenerating: boolean;
  language: 'th' | 'en';
}

const QUICK_SUGGESTIONS_TH = [
  { icon: HelpCircle, text: 'อธิบาย flow นี้ให้เข้าใจง่าย' },
  { icon: HelpCircle, text: 'จุดเสี่ยงของระบบนี้คืออะไร' },
  { icon: Wrench, text: 'เพิ่ม Redis cache ระหว่าง service กับ database' },
  { icon: Wrench, text: 'เพิ่ม Kafka สำหรับ event-driven workflow' },
  { icon: Wrench, text: 'เพิ่ม Load Balancer รองรับ traffic สูง' },
];

const QUICK_SUGGESTIONS_EN = [
  { icon: HelpCircle, text: 'Explain this workflow in simple terms' },
  { icon: HelpCircle, text: 'What are the main risks in this architecture?' },
  { icon: Wrench, text: 'Add a Redis cache between the service and database' },
  { icon: Wrench, text: 'Add Kafka for an event-driven workflow' },
  { icon: Wrench, text: 'Add a load balancer for high traffic' },
];

export const SidebarRightChat: React.FC<SidebarRightChatProps> = ({
  isOpen,
  onClose,
  chatHistory,
  onSendMessage,
  isGenerating,
  language
}) => {
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isOpen]);

  if (!isOpen) return null;

  const suggestions = language === 'th' ? QUICK_SUGGESTIONS_TH : QUICK_SUGGESTIONS_EN;

  return (
    <div className="hud-panel fixed inset-x-3 bottom-3 top-16 sm:inset-auto sm:bottom-[84px] sm:right-6 sm:top-auto sm:w-[520px] sm:max-w-[calc(100vw-48px)] sm:h-[70vh] sm:max-h-[760px] bg-slate-950/95 border border-white/10 rounded-2xl z-50 flex flex-col backdrop-blur-xl shadow-2xl animate-fade-in-node overflow-hidden select-none">
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 hud-scanline">
            <MessageSquare className="w-4 h-4 text-purple-400 animate-pulse" />
          </div>
          <div className="min-w-0">
            <span className="block font-heading font-extrabold text-[11px] text-white tracking-widest uppercase truncate">
              {language === 'th' ? 'AI Architect Assistant' : 'AI Architect Assistant'}
            </span>
            <span className="block text-[10px] text-slate-400 font-mono truncate">
              {language === 'th' ? 'ถามคำถามหรือสั่งแก้ canvas ได้ในช่องเดียว' : 'Ask questions or request canvas changes'}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer duration-300 shrink-0"
          aria-label="Close chat"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-none">
        {chatHistory.length === 0 ? (
          <div className="min-h-full flex flex-col items-center justify-center text-center space-y-4 py-10">
            <div className="p-4 bg-purple-500/10 border border-purple-500/15 rounded-2xl animate-pulse">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div className="space-y-2 max-w-sm">
              <p className="text-sm font-bold text-white tracking-wide font-heading">
                {language === 'th' ? 'ผู้ช่วยสถาปัตยกรรมระบบ' : 'Architecture assistant'}
              </p>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                {language === 'th'
                  ? 'ถามให้ช่วยอธิบาย วิเคราะห์ความเสี่ยง หรือสั่งเพิ่ม ลบ และปรับ node ใน workflow ได้ทันที'
                  : 'Ask for explanations, risk analysis, or direct workflow edits such as adding, removing, and updating nodes.'}
              </p>
            </div>
          </div>
        ) : (
          chatHistory.map((msg) => {
            const isUser = msg.role === 'user';
            const isError = msg.intent === 'error';

            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[92%] space-y-1.5 ${isUser ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div
                  className={`px-4 py-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap break-words ${
                    isUser
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none shadow-lg shadow-purple-950/40 border border-purple-500/20 font-sans'
                      : isError
                        ? 'bg-rose-500/10 border border-rose-500/25 text-rose-100 rounded-bl-none backdrop-blur-md font-sans shadow-md'
                        : 'bg-white/[0.02] border border-white/5 text-slate-100 rounded-bl-none backdrop-blur-md font-sans shadow-md'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[8px] text-gray-500 font-mono px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}

        {isGenerating && (
          <div className="flex items-center space-x-2.5 mr-auto bg-white/[0.02] border border-white/5 p-4 rounded-2xl rounded-bl-none text-gray-400 backdrop-blur-md shadow-md">
            <span className="text-[10px] font-mono">
              {language === 'th' ? 'กำลังคิดและตรวจสอบบริบท...' : 'Thinking through the architecture context...'}
            </span>
            <div className="flex space-x-1.5">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-100" />
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-200" />
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-300" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {chatHistory.length === 0 && (
        <div className="px-4 pb-3 border-t border-white/5 bg-slate-950/30 select-none">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest my-3 flex items-center gap-1.5 pl-1">
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>{language === 'th' ? 'ตัวอย่างที่ลองถามได้:' : 'Suggested prompts:'}</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[150px] overflow-y-auto pr-1 scrollbar-none">
            {suggestions.map(({ icon: Icon, text }, idx) => (
              <button
                key={idx}
                onClick={() => onSendMessage(text)}
                className="min-h-10 text-[10px] text-left px-3 py-2.5 rounded-xl bg-purple-500/5 border border-purple-500/10 text-purple-200 hover:bg-purple-500/10 hover:border-purple-500/30 hover:text-white transition-all cursor-pointer duration-300 font-sans flex items-center gap-2"
              >
                <Icon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="line-clamp-2">{text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 border-t border-white/5 bg-slate-950/50 backdrop-blur-md flex items-end gap-2 select-none">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isGenerating}
          rows={2}
          placeholder={
            language === 'th'
              ? 'ถามคำถามหรือสั่งแก้ เช่น "อธิบาย flow นี้" หรือ "เพิ่ม Redis cache"...'
              : 'Ask a question or request architecture changes...'
          }
          className="hud-input flex-1 max-h-28 resize-none bg-slate-950/60 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500/50 transition-colors placeholder:text-gray-600 font-sans leading-relaxed"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isGenerating}
          className="hud-primary-button p-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center justify-center transition-all disabled:opacity-40 disabled:hover:bg-purple-600 cursor-pointer shadow-lg shadow-purple-900/20 active:scale-95 duration-300 shrink-0"
          aria-label="Send chat message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
