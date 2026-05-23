'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UsePlaybackReturn {
  isPlaying: boolean;
  currentStepIndex: number;
  togglePlay: () => void;
  selectStep: (idx: number) => void;
  resetPlayback: () => void;
}

interface UsePlaybackOptions {
  totalSteps: number;
  intervalMs?: number;
  onStepChange?: (playing: boolean, idx: number) => void; // callback for broadcasting
}

export function usePlayback({
  totalSteps,
  intervalMs = 3500,
  onStepChange,
}: UsePlaybackOptions): UsePlaybackReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);

  // Keep a stable ref to the callback so the interval doesn't go stale
  const onStepChangeRef = useRef(onStepChange);
  useEffect(() => {
    onStepChangeRef.current = onStepChange;
  }, [onStepChange]);

  // Keep a stable ref to totalSteps to avoid interval recreation on every render
  const totalStepsRef = useRef(totalSteps);
  useEffect(() => {
    totalStepsRef.current = totalSteps;
  }, [totalSteps]);

  // Auto-play interval
  useEffect(() => {
    if (!isPlaying || totalSteps === 0) return;

    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        const total = totalStepsRef.current;
        const nextIdx = prev >= total - 1 ? 0 : prev + 1;
        onStepChangeRef.current?.(true, nextIdx);
        return nextIdx;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, intervalMs, totalSteps]);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (next && (currentStepIndex === -1 || currentStepIndex >= totalStepsRef.current - 1)) {
        setCurrentStepIndex(0);
        onStepChangeRef.current?.(next, 0);
      } else {
        onStepChangeRef.current?.(next, currentStepIndex);
      }
      return next;
    });
  }, [currentStepIndex]);

  const selectStep = useCallback(
    (idx: number) => {
      setCurrentStepIndex(idx);
      onStepChangeRef.current?.(isPlaying, idx);
    },
    [isPlaying]
  );

  const resetPlayback = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex(-1);
  }, []);

  return { isPlaying, currentStepIndex, togglePlay, selectStep, resetPlayback };
}
