'use client';

import { useState, useCallback } from 'react';
import { SavedSession, WorkflowData, ResiliencyData, ScaleData, ChatMessage, PromptEngineerData } from '@/types';

const STORAGE_KEY = 'workflow_designer_sessions';
const MAX_SESSIONS = 20;
const MAX_STORAGE_BYTES = 4.5 * 1024 * 1024; // 4.5 MB safety threshold (below 5MB limit)

/** Safely write to localStorage with quota guard.
 *  On QuotaExceededError it trims the oldest sessions and retries once.
 */
function safeSetStorage(sessions: SavedSession[]): boolean {
  const serialize = (arr: SavedSession[]) => JSON.stringify(arr);

  try {
    localStorage.setItem(STORAGE_KEY, serialize(sessions));
    return true;
  } catch (e: any) {
    // QuotaExceededError or similar
    if (e?.name === 'QuotaExceededError' || e?.code === 22) {
      // Trim down to half the sessions (oldest removed — array is newest-first)
      const trimmed = sessions.slice(0, Math.floor(sessions.length / 2));
      try {
        localStorage.setItem(STORAGE_KEY, serialize(trimmed));
        console.warn(
          `[useSession] localStorage quota exceeded. Trimmed sessions from ${sessions.length} → ${trimmed.length}.`
        );
        return true;
      } catch {
        console.error('[useSession] localStorage quota exceeded even after trimming. Storage write aborted.');
        return false;
      }
    }
    console.error('[useSession] Unexpected localStorage error:', e);
    return false;
  }
}

/** Estimate rough byte size of a string (UTF-16 chars × 2) */
function estimateBytes(value: string): number {
  return value.length * 2;
}

export interface UseSessionReturn {
  savedSessions: SavedSession[];
  saveCurrentSession: (params: {
    blueprint: WorkflowData | any;
    resiliency: ResiliencyData | null;
    scaleInfo: ScaleData | null;
    promptEngineerInfo?: PromptEngineerData | null;
    chatHistory: ChatMessage[];
    prompt: string;
    language: 'th' | 'en';
    techStack: string;
    activePhaseIndex?: number;
    checkedDoD?: Record<string, boolean>;
    businessQuestions?: any[] | null;
    userAnswers?: Record<string, string>;
  }) => void;
  loadSession: (session: SavedSession) => SavedSession;
  deleteSession: (id: string) => void;
  initSessions: () => void;
}

export function useSession(): UseSessionReturn {
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);

  /** Load sessions from localStorage on mount */
  const initSessions = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedSession[];
        setSavedSessions(Array.isArray(parsed) ? parsed : []);
      }
    } catch (err) {
      console.error('[useSession] Failed to parse saved sessions:', err);
    }
  }, []);

  const saveCurrentSession = useCallback(
    ({
      blueprint,
      resiliency,
      scaleInfo,
      promptEngineerInfo,
      chatHistory,
      prompt,
      language,
      techStack,
      activePhaseIndex,
      checkedDoD,
      businessQuestions,
      userAnswers,
    }: {
      blueprint: WorkflowData | any;
      resiliency: ResiliencyData | null;
      scaleInfo: ScaleData | null;
      promptEngineerInfo?: PromptEngineerData | null;
      chatHistory: ChatMessage[];
      prompt: string;
      language: 'th' | 'en';
      techStack: string;
      activePhaseIndex?: number;
      checkedDoD?: Record<string, boolean>;
      businessQuestions?: any[] | null;
      userAnswers?: Record<string, string>;
    }) => {
      if (!blueprint) return;

      const newSession: SavedSession = {
        id: `session-${Date.now()}`,
        title: blueprint.title || prompt.substring(0, 30) || 'Untitled',
        timestamp: Date.now(),
        prompt,
        language,
        blueprint,
        resiliency,
        scaleInfo,
        promptEngineerInfo: promptEngineerInfo || null,
        chatHistory,
        techStack,
        activePhaseIndex,
        checkedDoD,
        businessQuestions: businessQuestions || null,
        userAnswers: userAnswers || {},
      };

      setSavedSessions((prev) => {
        // Enforce max session count (newest-first)
        let updated = [newSession, ...prev].slice(0, MAX_SESSIONS);

        // Byte-size guard: trim until it fits
        let serialized = JSON.stringify(updated);
        while (estimateBytes(serialized) > MAX_STORAGE_BYTES && updated.length > 1) {
          updated = updated.slice(0, updated.length - 1);
          serialized = JSON.stringify(updated);
        }

        safeSetStorage(updated);
        return updated;
      });
    },
    []
  );

  const loadSession = useCallback((session: SavedSession): SavedSession => {
    // Just returns the session — caller sets individual state slices
    return session;
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSavedSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      safeSetStorage(updated);
      return updated;
    });
  }, []);

  return { savedSessions, saveCurrentSession, loadSession, deleteSession, initSessions };
}
