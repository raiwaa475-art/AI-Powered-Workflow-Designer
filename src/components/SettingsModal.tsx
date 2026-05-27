import React, { useState, useEffect, useCallback } from 'react';
import { Settings, CheckCircle2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settingsProvider, setSettingsProvider] = useState<'openai' | 'anthropic' | 'deepseek'>('deepseek');
  const [settingsApiKey, setSettingsApiKey] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState<{ configured: boolean; provider: string | null; maskedKey: string | null }>({
    configured: false,
    provider: null,
    maskedKey: null,
  });

  // Fetch current provider status when open
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/get-provider')
      .then((r) => r.json())
      .then((data) => {
        setSettingsStatus(data);
        if (data.provider) {
          setSettingsProvider(data.provider);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  const handleSaveSettings = useCallback(async () => {
    if (!settingsApiKey.trim()) return;
    try {
      const res = await fetch('/api/set-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: settingsProvider, apiKey: settingsApiKey }),
      });
      if (res.ok) {
        setSettingsSaved(true);
        setSettingsApiKey(''); // clear from memory immediately
        setTimeout(() => setSettingsSaved(false), 2500);
        // Refresh status display
        const statusRes = await fetch('/api/get-provider');
        const statusData = await statusRes.json();
        setSettingsStatus(statusData);
      }
    } catch (err) {
      console.error('Failed to save provider config:', err);
    }
  }, [settingsProvider, settingsApiKey]);

  const handleClearSettings = useCallback(async () => {
    await fetch('/api/set-provider', { method: 'DELETE' });
    setSettingsStatus({ configured: false, provider: null, maskedKey: null });
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-6 relative animate-fade-in-node text-left">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-cyan-400 animate-spin-slow" />
          <span>Engine Settings</span>
        </h3>

        {/* Current status */}
        {settingsStatus.configured && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>
              Active: <strong className="uppercase">{settingsStatus.provider}</strong> — {settingsStatus.maskedKey}
            </span>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="settings-provider" className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Model Provider</label>
            <select
              id="settings-provider"
              value={settingsProvider}
              onChange={(e) => setSettingsProvider(e.target.value as any)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
            >
              <option value="openai">OpenAI GPT-4o</option>
              <option value="anthropic">Claude 3.5 Sonnet</option>
              <option value="deepseek">DeepSeek Chat</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="settings-api-key" className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
              API Key {settingsStatus.configured ? '(enter new key to update)' : ''}
            </label>
            <input
              id="settings-api-key"
              type="password"
              value={settingsApiKey}
              onChange={(e) => setSettingsApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
            />
            <p className="text-[9px] text-gray-600 leading-relaxed">
              🔒 Stored in a server-side HttpOnly cookie — never exposed to JavaScript.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSaveSettings}
              disabled={!settingsApiKey.trim()}
              className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-medium text-xs rounded-xl shadow-lg mt-2 cursor-pointer transition-colors"
            >
              {settingsSaved ? '✓ Saved!' : 'Save Configuration'}
            </button>
            {settingsStatus.configured && (
              <button
                onClick={handleClearSettings}
                className="py-2 px-3 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 font-medium text-xs rounded-xl mt-2 cursor-pointer transition-colors border border-rose-500/20"
              >
                Clear
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-gray-400 font-medium text-xs rounded-xl cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
