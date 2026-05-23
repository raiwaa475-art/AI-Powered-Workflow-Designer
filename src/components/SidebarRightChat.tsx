import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Terminal } from 'lucide-react';
import { ChatMessage, WorkflowData } from '@/types';

interface SidebarRightChatProps {
  isOpen: boolean;
  onClose: () => void;
  chatHistory: ChatMessage[];
  onSendMessage: (text: string) => void;
  isGenerating: boolean;
  language: 'th' | 'en';
}

const QUICK_SUGGESTIONS_TH = [
  "เพิ่ม Redis Cache Cluster เพื่อทำ Caching และป้องกันฐานข้อมูลรับโหลดหนัก",
  "อินทิเกรต Apache Kafka Broker เพื่อเชื่อมโยงข้อมูลแบบ Event-Driven",
  "เพิ่ม Elastic Load Balancer (ELB) เพื่อกระจายปริมาณการเข้าใช้งานระดับล้านคน",
  "ติดตั้งระบบป้องกันยิงเซิร์ฟเวอร์ Cloudflare WAF ในชั้น Presentation",
  "ลบโหนดที่ไม่ได้ใช้งานหรือมีจุดเสี่ยงขัดข้อง (Single Point of Failure)"
];

const QUICK_SUGGESTIONS_EN = [
  "Add a Redis Cache Cluster to prevent database overhead and cache sessions",
  "Integrate Apache Kafka Brokers for robust event-driven microservices",
  "Add Elastic Load Balancers (ELB) to distribute high traffic up to 1M users",
  "Deploy Cloudflare WAF in the Presentation layer for enhanced DDoS protection",
  "Remove redundant nodes or single points of failure (SPOF)"
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Scroll to bottom when history changes or chat opens
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isOpen]);

  if (!isOpen) return null;

  const suggestions = language === 'th' ? QUICK_SUGGESTIONS_TH : QUICK_SUGGESTIONS_EN;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-slate-950/95 border-l border-white/5 z-40 flex flex-col backdrop-blur-xl shadow-2xl animate-fade-in-node">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-400" />
          <span className="font-semibold text-white tracking-wide">
            {language === 'th' ? 'แชตบอทช่วยแก้ไดอะแกรม' : 'AI Architect Chat'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Conversation Log */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl animate-bounce">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">
                {language === 'th' ? 'พูดคุยเพื่อสั่งแก้ไขระบบสดๆ' : 'AI Graph Modification'}
              </p>
              <p className="text-xs text-gray-400 px-4">
                {language === 'th' 
                  ? 'พิมพ์คุยภาษาคนเพื่อ สั่งเพิ่มโหนด, เปลี่ยนข้อความสเต็ปการทำเวิร์กโฟลว์ หรือสั่งลบออกได้ทันที!' 
                  : 'Type commands to add caching, inject message queues, resize layers, or strip off redundant microservices.'}
              </p>
            </div>
          </div>
        ) : (
          chatHistory.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] space-y-1.5 ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
            >
              <div
                className={`p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-purple-600 text-white rounded-br-none shadow-lg shadow-purple-900/10'
                    : 'bg-slate-900/80 border border-white/5 text-gray-200 rounded-bl-none'
                }`}
              >
                {msg.content}
              </div>
              <span className="text-[9px] text-gray-500 font-mono">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}

        {isGenerating && (
          <div className="flex items-center space-x-2 mr-auto bg-slate-900/60 border border-white/5 p-3 rounded-2xl rounded-bl-none text-gray-400">
            <span className="text-xs font-mono">{language === 'th' ? 'AI สถาปนิกกำลังประมวลสเตต...' : 'AI modifying graph structures...'}</span>
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-200"></div>
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-300"></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Action Pills */}
      {chatHistory.length === 0 && (
        <div className="p-4 border-t border-white/5 bg-slate-900/20">
          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>{language === 'th' ? 'แนะนำคำสั่งยอดนิยม:' : 'Quick Commands:'}</span>
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => onSendMessage(sug)}
                className="text-[10px] text-left px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/5 text-gray-300 hover:border-purple-500/50 hover:text-white transition-all cursor-pointer truncate max-w-full"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Inputs */}
      <div className="p-4 border-t border-white/5 bg-slate-950 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isGenerating}
          placeholder={language === 'th' ? 'สั่งแก้ไข เช่น "เพิ่ม redis cache"...' : 'Command e.g. "add kafka broker"...'}
          className="flex-1 bg-slate-900/80 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors placeholder:text-gray-500"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isGenerating}
          className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm flex items-center justify-center transition-colors disabled:opacity-40 disabled:hover:bg-purple-600 cursor-pointer shadow-lg shadow-purple-900/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
