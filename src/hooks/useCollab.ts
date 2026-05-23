'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { CollabUser, WorkflowData, ResiliencyData, ScaleData } from '@/types';

export interface UseCollabReturn {
  localUserId: string;
  collabUsers: CollabUser[];
  activeRoomId: string;
  setActiveRoomId: (roomId: string) => void;
  handleCanvasMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onNodeDragStop: (event: any, node: any) => void;
  broadcastPlayback: (playing: boolean, idx: number) => void;
  broadcastGraphUpdate: (
    bp: WorkflowData | any,
    res: ResiliencyData | null,
    scale: ScaleData | null
  ) => void;
  remoteNodePositions: Record<string, { x: number; y: number }>;
  remoteBlueprint: (WorkflowData | any) | null;
  remoteResiliency: ResiliencyData | null;
  remoteScale: ScaleData | null;
  remotePlayback: { playing: boolean; activeStepIndex: number } | null;
  clearRemoteState: () => void;
}

/** WebSocket-based real-time collaboration hook.
 *  Connects to the standalone collab-server.js.
 *  Uses a short-lived auth token passed as a query param.
 *  Token is fetched from Next.js secure backend to protect COLLAB_SECRET.
 */

const COLLAB_WS_URL = process.env.NEXT_PUBLIC_COLLAB_WS_URL ?? 
  (typeof window !== 'undefined'
    ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:3002`
    : 'ws://localhost:3002');

async function deriveToken(roomId: string): Promise<string> {
  try {
    const res = await fetch(`/api/collab-token?room=${encodeURIComponent(roomId)}`);
    if (!res.ok) throw new Error('Token fetch failed');
    const data = await res.json();
    return data.token;
  } catch (err) {
    console.warn('[useCollab] Failed to fetch server collab token:', err);
    return '';
  }
}

export function useCollab(isMounted: boolean): UseCollabReturn {
  const socketRef = useRef<WebSocket | null>(null);

  // Dynamic cursor throttling refs
  const lastCursorSentRef = useRef<number>(0);
  const cursorPendingRef = useRef<{ x: number; y: number } | null>(null);
  const cursorTimeoutRef = useRef<any>(null);

  const [localUserId, setLocalUserId] = useState<string>('');
  const [collabUsers, setCollabUsers] = useState<CollabUser[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string>('global-collab-room');

  // Remote state signals received from other peers
  const [remoteNodePositions, setRemoteNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [remoteBlueprint, setRemoteBlueprint] = useState<(WorkflowData | any) | null>(null);
  const [remoteResiliency, setRemoteResiliency] = useState<ResiliencyData | null>(null);
  const [remoteScale, setRemoteScale] = useState<ScaleData | null>(null);
  const [remotePlayback, setRemotePlayback] = useState<{ playing: boolean; activeStepIndex: number } | null>(null);

  const clearRemoteState = useCallback(() => {
    setRemoteBlueprint(null);
    setRemoteResiliency(null);
    setRemoteScale(null);
    setRemotePlayback(null);
  }, []);

  // Connect / reconnect whenever roomId changes
  useEffect(() => {
    if (!isMounted) return;

    let ws: WebSocket;

    async function connect() {
      // Gracefully disconnect any existing socket
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }

      const token = await deriveToken(activeRoomId);
      const wsUrl = `${COLLAB_WS_URL}?room=${encodeURIComponent(activeRoomId)}&token=${token}`;
      ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log(`[useCollab] Connected to room: ${activeRoomId}`);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          switch (msg.type) {
            case 'welcome':
              setLocalUserId(msg.payload.yourId);
              setCollabUsers(msg.payload.users ?? []);
              break;
            case 'user_join':
              setCollabUsers((prev) => [...prev.filter((u) => u.id !== msg.payload.id), msg.payload]);
              break;
            case 'user_leave':
              setCollabUsers((prev) => prev.filter((u) => u.id !== msg.payload.id));
              break;
            case 'cursor_move':
              setCollabUsers((prev) =>
                prev.map((u) => (u.id === msg.senderId ? { ...u, cursor: msg.payload } : u))
              );
              break;
            case 'node_drag': {
              const { nodeId, x, y } = msg.payload;
              setRemoteNodePositions((prev) => ({ ...prev, [nodeId]: { x, y } }));
              break;
            }
            case 'graph_update':
              setRemoteBlueprint(msg.payload.blueprint ?? null);
              setRemoteResiliency(msg.payload.resiliency ?? null);
              setRemoteScale(msg.payload.scaleInfo ?? null);
              break;
            case 'playback_sync':
              setRemotePlayback({ playing: msg.payload.playing, activeStepIndex: msg.payload.activeStepIndex });
              break;
          }
        } catch (err) {
          console.error('[useCollab] Message parse error:', err);
        }
      };

      ws.onclose = () => {
        console.log('[useCollab] Connection closed.');
      };

      ws.onerror = (err) => {
        console.warn('[useCollab] WebSocket error (collab-server may be offline):', err);
      };
    }

    connect();

    return () => {
      ws?.close();
      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, activeRoomId]);

  /* ─── Outbound broadcast helpers ─── */

  const sendWS = useCallback((data: object) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    }
  }, []);

  const sendCursorWS = useCallback((x: number, y: number) => {
    sendWS({ type: 'cursor_move', payload: { x, y } });
    lastCursorSentRef.current = Date.now();
  }, [sendWS]);

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const now = Date.now();
      const throttleMs = 50; // 20fps balance of low traffic and smooth rendering
      const elapsed = now - lastCursorSentRef.current;

      if (elapsed >= throttleMs) {
        if (cursorTimeoutRef.current) {
          clearTimeout(cursorTimeoutRef.current);
          cursorTimeoutRef.current = null;
        }
        sendCursorWS(x, y);
      } else {
        cursorPendingRef.current = { x, y };
        if (!cursorTimeoutRef.current) {
          cursorTimeoutRef.current = setTimeout(() => {
            if (cursorPendingRef.current) {
              sendCursorWS(cursorPendingRef.current.x, cursorPendingRef.current.y);
              cursorPendingRef.current = null;
            }
            cursorTimeoutRef.current = null;
          }, throttleMs - elapsed);
        }
      }
    },
    [sendCursorWS]
  );

  const onNodeDragStop = useCallback(
    (_event: any, node: any) => {
      const { x, y } = node.position;
      sendWS({ type: 'node_drag', payload: { nodeId: node.id, x, y } });
    },
    [sendWS]
  );

  const broadcastPlayback = useCallback(
    (playing: boolean, idx: number) => {
      sendWS({ type: 'playback_sync', payload: { playing, activeStepIndex: idx } });
    },
    [sendWS]
  );

  const broadcastGraphUpdate = useCallback(
    (bp: WorkflowData | any, res: ResiliencyData | null, scale: ScaleData | null) => {
      sendWS({ type: 'graph_update', payload: { blueprint: bp, resiliency: res, scaleInfo: scale } });
    },
    [sendWS]
  );

  return {
    localUserId,
    collabUsers,
    activeRoomId,
    setActiveRoomId,
    handleCanvasMouseMove,
    onNodeDragStop,
    broadcastPlayback,
    broadcastGraphUpdate,
    remoteNodePositions,
    remoteBlueprint,
    remoteResiliency,
    remoteScale,
    remotePlayback,
    clearRemoteState,
  };
}
