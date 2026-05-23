'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Activity,
  Cpu,
  Settings,
  RefreshCw,
  AlertTriangle,
  Terminal,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Folder,
  FileCode,
  Zap,
  Globe,
  Coins,
  Palette,
  TrendingUp,
  Code
} from 'lucide-react';
import {
  WorkflowData,
  ResiliencyData,
  ScaleData,
  WorkflowNode,
  WorkflowStep,
  ChatMessage,
  SavedSession,
  CollabUser,
  IaCCodeResponse,
  PromptEngineerData
} from '@/types';

// Custom hooks
import { useGenerate } from '@/hooks/useGenerate';
import { useCollab } from '@/hooks/useCollab';
import { usePlayback } from '@/hooks/usePlayback';
import { useSession } from '@/hooks/useSession';

// Modular components
import { SidebarLeft } from '@/components/SidebarLeft';
import { SidebarRightChat } from '@/components/SidebarRightChat';
import { ScaleOptimize } from '@/components/ScaleOptimize';
import { CodeWorkspace } from '@/components/CodeWorkspace';
import { ReverseEngineerModal } from '@/components/ReverseEngineerModal';
import { Canvas } from '@/components/Canvas';
import { PromptWorkspace } from '@/components/PromptWorkspace';

// XYFlow
import { Handle, Position } from '@xyflow/react';
import { toPng } from 'html-to-image';

/* ─────────────────────────────────────────────
   Custom obsidian-glass card node component
───────────────────────────────────────────── */
const CustomNodeComponent = ({ data }: any) => {
  const { name, type, description, layerId, isActive, risk, protocol, isNewlyModified } = data;

  let borderPulseClass = 'border-white/5 opacity-85 hover:opacity-100 hover:border-white/15';
  let protocolBadge = null;

  if (isNewlyModified) {
    borderPulseClass = 'animate-pulse-glow-green border-emerald-500 bg-emerald-950/30';
  } else if (isActive && protocol) {
    if (protocol.flow_type === 'sync') {
      borderPulseClass = 'animate-pulse-glow-cyan border-cyan-500 bg-cyan-950/20';
      protocolBadge = <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Sync</span>;
    } else if (protocol.flow_type === 'async') {
      borderPulseClass = 'animate-pulse-glow-orange border-orange-500 bg-orange-950/20';
      protocolBadge = <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Async</span>;
    } else if (protocol.flow_type === 'event') {
      borderPulseClass = 'animate-pulse-glow-purple border-purple-500 bg-purple-950/20';
      protocolBadge = <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Event</span>;
    }
  } else if (isActive) {
    borderPulseClass = 'border-cyan-500/60 bg-slate-900/90 shadow-md shadow-cyan-500/10';
  }

  let accentClass = 'bg-gray-500';
  if (layerId === 'presentation') accentClass = 'bg-violet-500';
  if (layerId === 'application') accentClass = 'bg-teal-500';
  if (layerId === 'queue') accentClass = 'bg-amber-500';
  if (layerId === 'data') accentClass = 'bg-blue-500';

  return (
    <div
      className={`p-3 rounded-xl border bg-slate-900/90 backdrop-blur-md flex flex-col justify-between transition-all duration-300 relative overflow-hidden w-[240px] min-h-[110px] text-left shadow-lg cursor-pointer select-none ${borderPulseClass}`}
    >
      {/* Target Handles for multi-directional systematic routing */}
      <Handle type="target" position={Position.Top} className="opacity-0 pointer-events-none" id="target-top-left" style={{ left: '25%' }} />
      <Handle type="target" position={Position.Top} className="opacity-0 pointer-events-none" id="target-top-center" style={{ left: '50%' }} />
      <Handle type="target" position={Position.Top} className="opacity-0 pointer-events-none" id="target-top-right" style={{ left: '75%' }} />
      <Handle type="target" position={Position.Bottom} className="opacity-0 pointer-events-none" id="target-bottom-left" style={{ left: '25%' }} />
      <Handle type="target" position={Position.Bottom} className="opacity-0 pointer-events-none" id="target-bottom-center" style={{ left: '50%' }} />
      <Handle type="target" position={Position.Bottom} className="opacity-0 pointer-events-none" id="target-bottom-right" style={{ left: '75%' }} />
      <Handle type="target" position={Position.Left} className="opacity-0 pointer-events-none" id="target-left" />
      <Handle type="target" position={Position.Right} className="opacity-0 pointer-events-none" id="target-right" />

      <div>
        <div className={`${accentClass} absolute top-0 left-0 w-1.5 h-full`} />

        <div className="flex items-start justify-between gap-1 pl-1">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider truncate max-w-[130px]">{type}</span>
          <div className="flex gap-1 items-center shrink-0">
            {protocolBadge}
            {risk && (
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${
                risk.risk_level === 'HIGH'
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}>
                {risk.risk_level} Risk
              </span>
            )}
          </div>
        </div>

        <h4 className="text-xs font-bold text-white mt-1.5 pl-1 tracking-wide line-clamp-1">{name}</h4>
        <p className="text-[10px] text-gray-400 mt-1 pl-1 line-clamp-2 leading-relaxed">{description}</p>
      </div>

      {/* Source Handles for multi-directional systematic routing */}
      <Handle type="source" position={Position.Top} className="opacity-0 pointer-events-none" id="source-top-left" style={{ left: '25%' }} />
      <Handle type="source" position={Position.Top} className="opacity-0 pointer-events-none" id="source-top-center" style={{ left: '50%' }} />
      <Handle type="source" position={Position.Top} className="opacity-0 pointer-events-none" id="source-top-right" style={{ left: '75%' }} />
      <Handle type="source" position={Position.Bottom} className="opacity-0 pointer-events-none" id="source-bottom-left" style={{ left: '25%' }} />
      <Handle type="source" position={Position.Bottom} className="opacity-0 pointer-events-none" id="source-bottom-center" style={{ left: '50%' }} />
      <Handle type="source" position={Position.Bottom} className="opacity-0 pointer-events-none" id="source-bottom-right" style={{ left: '75%' }} />
      <Handle type="source" position={Position.Left} className="opacity-0 pointer-events-none" id="source-left" />
      <Handle type="source" position={Position.Right} className="opacity-0 pointer-events-none" id="source-right" />
    </div>
  );
};

/* ─────────────────────────────────────────────
   Custom obsidian-glass layer header node component
───────────────────────────────────────────── */
const LayerHeaderNodeComponent = ({ data }: any) => {
  const { title, colorClass, number } = data;
  return (
    <div className="flex items-center gap-3 bg-slate-950/85 border border-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-md shadow-2xl pointer-events-none select-none text-left min-w-[200px]">
      <div className={`w-2.5 h-2.5 rounded-full ${colorClass.split(' ')[1] || 'bg-cyan-500'} animate-pulse`} style={{ boxShadow: '0 0 10px currentColor' }} />
      <div className="flex flex-col font-mono">
        <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Tier {number}</span>
        <span className={`text-[10px] font-extrabold uppercase tracking-[0.12em] ${colorClass.split(' ')[0] || 'text-cyan-400'}`}>{title}</span>
      </div>
    </div>
  );
};

const nodeTypesMap = {
  custom: CustomNodeComponent,
  layerHeader: LayerHeaderNodeComponent
};

/* ─────────────────────────────────────────────
   Main Page Component
───────────────────────────────────────────── */
export default function WorkspaceDesignerPage() {
  const [isMounted, setIsMounted] = useState(false);

  // Workspace input states
  const [prompt, setPrompt] = useState('ระบบกดบัตรคอนเสิร์ต 1M Users');
  const [language, setLanguage] = useState<'th' | 'en'>('th');
  const [techStack, setTechStack] = useState('docker-compose');

  // UI sidebar/modal visibility
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightChatOpen, setRightChatOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reverseModalOpen, setReverseModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'canvas' | 'scale' | 'code' | 'prompt'>('canvas');

  // Settings form (provider config sent to server, not stored in state)
  const [settingsProvider, setSettingsProvider] = useState<'openai' | 'anthropic' | 'deepseek'>('deepseek');
  const [settingsApiKey, setSettingsApiKey] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState<{ configured: boolean; provider: string | null; maskedKey: string | null }>({
    configured: false,
    provider: null,
    maskedKey: null,
  });

  // Node drag position cache (local only)
  const [dragPositions, setDragPositions] = useState<Record<string, { x: number; y: number }>>({});

  // Lifted Code Workspace states to persist across tab switches
  const [codeData, setCodeData] = useState<{ explanation: string; files: Record<string, string> } | null>(null);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>('docker-compose.yml');

  // ── Custom Hooks ──────────────────────────────────────────────────────────
  const {
    blueprint, setBlueprint,
    resiliency, setResiliency,
    scaleInfo, setScaleInfo,
    promptInfo, setPromptInfo,
    isGenerating,
    isGeneratingPrompts,
    activeStage,
    logs,
    tokenUsage,
    newlyModifiedNodeIds,
    addTokens,
    handleGenerate,
    handleChatModify,
    handleReverseEngineer,
    handleApplyPreset,
    chatHistory,
    setChatHistory,
    triggerTelemetryInsights,
    addLog,
    handleGeneratePrompts,
    activePhaseIndex,
    setActivePhaseIndex,
    checkedDoD,
    setCheckedDoD,
  } = useGenerate();

  const {
    localUserId,
    collabUsers,
    activeRoomId,
    setActiveRoomId,
    handleCanvasMouseMove,
    onNodeDragStop: collabNodeDragStop,
    broadcastPlayback,
    broadcastGraphUpdate,
    remoteNodePositions,
    remoteBlueprint,
    remoteResiliency,
    remoteScale,
    remotePlayback,
    clearRemoteState,
  } = useCollab(isMounted);

  const {
    isPlaying,
    currentStepIndex,
    togglePlay,
    selectStep,
    resetPlayback,
  } = usePlayback({
    totalSteps: blueprint?.steps?.length ?? blueprint?.sections?.length ?? 0,
    intervalMs: 7000,
    onStepChange: broadcastPlayback,
  });

  const {
    savedSessions,
    saveCurrentSession,
    deleteSession,
    initSessions,
  } = useSession();

  // ── Mount & init ───────────────────────────────────────────────────────────
  useEffect(() => {
    setIsMounted(true);
    initSessions();
  }, [initSessions]);

  // ── Fetch current provider status on settings open ─────────────────────────
  useEffect(() => {
    if (!settingsOpen) return;
    fetch('/api/get-provider')
      .then((r) => r.json())
      .then((data) => setSettingsStatus(data))
      .catch(() => {});
  }, [settingsOpen]);

  // ── Apply remote state from collab peers ───────────────────────────────────
  useEffect(() => {
    if (remoteBlueprint && JSON.stringify(remoteBlueprint) !== JSON.stringify(blueprint)) {
      setBlueprint(remoteBlueprint);
    }
    if (remoteResiliency && JSON.stringify(remoteResiliency) !== JSON.stringify(resiliency)) {
      setResiliency(remoteResiliency);
    }
    if (remoteScale && JSON.stringify(remoteScale) !== JSON.stringify(scaleInfo)) {
      setScaleInfo(remoteScale);
    }
  }, [remoteBlueprint, remoteResiliency, remoteScale, blueprint, resiliency, scaleInfo, setBlueprint, setResiliency, setScaleInfo]);

  useEffect(() => {
    if (remotePlayback) {
      // Mirror remote playback state — handled internally via selectStep
      selectStep(remotePlayback.activeStepIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remotePlayback]);

  // Reset/Regenerate AI code state when blueprint or techStack changes
  useEffect(() => {
    setIsAiGenerated(false);
    setCodeData(null);
  }, [blueprint]);

  useEffect(() => {
    setIsAiGenerated(false);
    setCodeData(null);
  }, [techStack]);

  // ── Merged node drag positions (local + remote peers) ─────────────────────
  const mergedDragPositions = useMemo(
    () => ({ ...remoteNodePositions, ...dragPositions }),
    [dragPositions, remoteNodePositions]
  );

  // ── Graph computation (nodes + edges for ReactFlow) ───────────────────────
  const processedGraph = useMemo(() => {
    if (!blueprint) return { nodes: [], edges: [] };

    const layers = blueprint.layers || [];
    const steps = blueprint.steps || [];
    const stepFlows = resiliency?.step_flows || [];
    const risks = resiliency?.node_risks || [];

    const nodesList: any[] = [];
    const edgesList: any[] = [];

    // Expanded Y coordinates adjusted to mathematically prevent vertical step crossings
    // Midpoint between application (360) and database (1020) is 690, which is 30px above the queue layer (720), preventing overlapping lines!
    const layerCoordinatesY: Record<string, number> = {
      presentation: 80,
      application: 360,
      queue: 720,
      data: 1020,
    };

    // Wider horizontal boundaries to prevent node overlap
    const canvasWidth = 1200;

    // Track seen node IDs to guarantee absolute uniqueness and purge unique key warnings
    const seenNodeIds = new Set<string>();
    const nodePositionMap = new Map<string, { x: number; y: number }>();

    const activeStep = (currentStepIndex >= 0 && currentStepIndex < steps.length) ? steps[currentStepIndex] : null;

    // Pre-calculate sequential step positions if activeStep is active
    const stepPositions: Record<string, { x: number; y: number; layerId: string }> = {};
    if (activeStep && activeStep.involved_nodes?.length > 0) {
      const nodesSeq = activeStep.involved_nodes;
      const targetLayers = ['presentation', 'application', 'queue', 'data'];
      
      nodesSeq.forEach((nodeId: string, idx: number) => {
        // Place each sequential node in the step sequence directly in a successive layer downwards to align vertically perfectly!
        const layerId = targetLayers[idx] || 'data';
        const yVal = layerCoordinatesY[layerId] || (1020 + (idx - 3) * 280);
        stepPositions[nodeId] = {
          x: 0,
          y: yVal,
          layerId: layerId
        };
      });
    }

    layers.forEach((layer: any) => {
      const layerId = layer.id;
      const layerNodes = layer.nodes || [];
      
      // Filter layer nodes to only those involved in the active step (rearranging them)
      const activeLayerNodes = activeStep 
        ? layerNodes.filter((node: any) => activeStep.involved_nodes?.includes(node.id))
        : layerNodes;

      const nodeCount = activeLayerNodes.length;
      const yCoord = layerCoordinatesY[layerId] || 100;

      const stepWidth = 320; // 240px node width + 80px horizontal gap
      const startingX = -((nodeCount - 1) * stepWidth) / 2;

      activeLayerNodes.forEach((node: any, index: number) => {
        if (!node.id || seenNodeIds.has(node.id)) return;
        seenNodeIds.add(node.id);

        const xCoord = startingX + (index * stepWidth);

        const savedPos = mergedDragPositions[node.id];
        const stepPos = activeStep ? stepPositions[node.id] : null;
        const finalX = stepPos ? stepPos.x : (savedPos ? savedPos.x : xCoord - 120);
        const finalY = stepPos ? stepPos.y : (savedPos ? savedPos.y : yCoord);

        // Cache positions for edge routing decisions
        nodePositionMap.set(node.id, { x: finalX, y: finalY });

        let isNodeActive = false;
        let activeStepFlow: any = null;

        if (currentStepIndex >= 0 && currentStepIndex < steps.length) {
          const activeStep = steps[currentStepIndex];
          if (activeStep?.involved_nodes?.includes(node.id)) {
            isNodeActive = true;
            activeStepFlow = stepFlows.find((f: any) => f.step_number === activeStep.number);
          }
        }

        const matchingRisk = risks.find((r: any) => r.node_id === node.id);

        nodesList.push({
          id: node.id,
          type: 'custom',
          position: { x: finalX, y: finalY },
          data: {
            name: node.name,
            type: node.type,
            description: node.description,
            layerId: stepPos ? stepPos.layerId : layerId,
            isActive: isNodeActive,
            risk: matchingRisk,
            protocol: activeStepFlow,
            isNewlyModified: newlyModifiedNodeIds.includes(node.id),
          },
          style: { zIndex: isNodeActive ? 10 : 1 },
        });
      });
    });

    // Add beautiful, in-canvas obsidian tier header nodes next to the nodes that actually exist in the canvas
    const activeLayersSet = new Set<string>();
    nodesList.forEach((n: any) => {
      if (n.type === 'custom') {
        activeLayersSet.add(n.data.layerId);
      }
    });

    const layerMeta: Record<string, { title: string; number: number; colorClass: string }> = {
      presentation: {
        title: 'Presentation Layer',
        number: 1,
        colorClass: 'text-violet-400 bg-violet-500',
      },
      application: {
        title: 'Application Layer',
        number: 2,
        colorClass: 'text-teal-400 bg-teal-500',
      },
      queue: {
        title: 'Message Broker / Queue Layer',
        number: 3,
        colorClass: 'text-amber-400 bg-amber-500',
      },
      data: {
        title: 'Database & Cache Layer',
        number: 4,
        colorClass: 'text-blue-400 bg-blue-500',
      },
    };

    activeLayersSet.forEach((layerId) => {
      const meta = layerMeta[layerId] || {
        title: `${layerId.charAt(0).toUpperCase() + layerId.slice(1)} Layer`,
        number: 99,
        colorClass: 'text-cyan-400 bg-cyan-500',
      };

      const yCoord = layerCoordinatesY[layerId] || 100;
      
      // Find X coordinates of all nodes in this layer to place the header to the left
      const layerNodes = nodesList.filter((n: any) => n.type === 'custom' && n.data.layerId === layerId);
      const xCoords = layerNodes.map((n: any) => n.position.x);
      const minX = xCoords.length > 0 ? Math.min(...xCoords) : 0;
      const headerX = minX - 400;

      nodesList.push({
        id: `layer-header-${layerId}`,
        type: 'layerHeader',
        position: { x: headerX, y: yCoord + 35 },
        data: {
          title: meta.title,
          number: meta.number,
          colorClass: meta.colorClass,
        },
        draggable: false,
        selectable: false,
        style: { pointerEvents: 'none' },
      });
    });

    // Group and deduplicate connections to eliminate messy stacked edges
    const edgeMap = new Map<string, {
      source: string;
      target: string;
      sourceHandle: string;
      targetHandle: string;
      isActive: boolean;
      animated: boolean;
      edgeClass: string;
      flowColor: string;
      payloadText: string;
      flowType?: string;
    }>();

    steps.forEach((step: any, stepIdx: number) => {
      const stepNodes = step.involved_nodes || [];
      if (stepNodes.length < 2) return;

      const matchingFlow = stepFlows.find((f: any) => f.step_number === step.number);
      const isStepHighlighted = currentStepIndex === stepIdx;

      // If active step is selected, only keep edges that belong to the active step!
      if (activeStep && !isStepHighlighted) {
        return;
      }

      for (let i = 0; i < stepNodes.length - 1; i++) {
        const source = stepNodes[i];
        const target = stepNodes[i + 1];
        if (!source || !target) continue;

        const pairKey = `${source}->${target}`;

        // Dynamic routing: determine correct handles based on node coordinates
        const sourcePos = nodePositionMap.get(source);
        const targetPos = nodePositionMap.get(target);
        let sourceHandle = 'source-bottom-center';
        let targetHandle = 'target-top-center';

        if (sourcePos && targetPos) {
          const dy = Math.abs(sourcePos.y - targetPos.y);
          const dx = targetPos.x - sourcePos.x;

          if (dy < 50) {
            // Same horizontal layer: connect sides directly
            if (dx > 0) {
              sourceHandle = 'source-right';
              targetHandle = 'target-left';
            } else {
              sourceHandle = 'source-left';
              targetHandle = 'target-right';
            }
          } else if (sourcePos.y > targetPos.y) {
            // Flow goes upwards
            if (dx > 80) {
              sourceHandle = 'source-top-right';
              targetHandle = 'target-bottom-left';
            } else if (dx < -80) {
              sourceHandle = 'source-top-left';
              targetHandle = 'target-bottom-right';
            } else {
              sourceHandle = 'source-top-center';
              targetHandle = 'target-bottom-center';
            }
          } else {
            // Flow goes downwards (default)
            if (dx > 80) {
              sourceHandle = 'source-bottom-right';
              targetHandle = 'target-top-left';
            } else if (dx < -80) {
              sourceHandle = 'source-bottom-left';
              targetHandle = 'target-top-right';
            } else {
              sourceHandle = 'source-bottom-center';
              targetHandle = 'target-top-center';
            }
          }
        }

        let flowColor = '#06b6d4';
        let payloadText = step.title;
        if (matchingFlow) {
          if (matchingFlow.flow_type === 'sync') {
            flowColor = '#22d3ee';
            payloadText = `[${matchingFlow.technical_protocol || 'HTTP'}] ${step.title}`;
          } else if (matchingFlow.flow_type === 'async') {
            flowColor = '#fb923c';
            payloadText = `[${matchingFlow.technical_protocol || 'AMQP'}] ${step.title}`;
          } else if (matchingFlow.flow_type === 'event') {
            flowColor = '#c084fc';
            payloadText = `[${matchingFlow.technical_protocol || 'EVENT'}] ${step.title}`;
          }
        }

        const existing = edgeMap.get(pairKey);
        
        // Overwrite background edge if this step is currently active (so it animates dynamically)
        if (isStepHighlighted || !existing) {
          let edgeClass = 'stroke-white/15 stroke-[2px] transition-all duration-300';
          if (isStepHighlighted && matchingFlow) {
            if (matchingFlow.flow_type === 'sync') {
              edgeClass = 'stroke-cyan-400 stroke-[3.5px] drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]';
            } else if (matchingFlow.flow_type === 'async') {
              edgeClass = 'stroke-orange-400 stroke-[3.5px] drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]';
            } else if (matchingFlow.flow_type === 'event') {
              edgeClass = 'stroke-purple-400 stroke-[3.5px] drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]';
            }
          }

          edgeMap.set(pairKey, {
            source,
            target,
            sourceHandle,
            targetHandle,
            isActive: isStepHighlighted,
            animated: isStepHighlighted && !!matchingFlow,
            edgeClass,
            flowColor,
            payloadText,
            flowType: matchingFlow?.flow_type,
          });
        }
      }
    });

    // Allocate a deterministic offset index for each unique connection pair to space them vertically
    const layerPairCounts = new Map<string, number>();
    const edgeOffsets = new Map<string, number>();

    edgeMap.forEach((edgeData, pairKey) => {
      const sourceNode = nodesList.find(n => n.id === edgeData.source);
      const targetNode = nodesList.find(n => n.id === edgeData.target);
      if (sourceNode && targetNode) {
        const sourceLayer = sourceNode.data.layerId;
        const targetLayer = targetNode.data.layerId;
        const layerKey = `${sourceLayer}->${targetLayer}`;
        
        const currentCount = layerPairCounts.get(layerKey) || 0;
        layerPairCounts.set(layerKey, currentCount + 1);
        
        // We assign offsets like: 0, -24, 24, -48, 48, -72, 72
        let offset = 0;
        if (currentCount > 0) {
          const sign = currentCount % 2 === 1 ? -1 : 1;
          const step = Math.ceil(currentCount / 2);
          offset = sign * step * 24; // 24px step spacing is highly visible and elegant
        }
        edgeOffsets.set(pairKey, offset);
      } else {
        edgeOffsets.set(pairKey, 0);
      }
    });

    // Populate deduplicated edges into React Flow list
    edgeMap.forEach((edgeData, pairKey) => {
      const edgeOffset = edgeOffsets.get(pairKey) || 0;

      edgesList.push({
        id: `edge-${pairKey}`,
        source: edgeData.source,
        target: edgeData.target,
        sourceHandle: edgeData.sourceHandle,
        targetHandle: edgeData.targetHandle,
        animated: edgeData.animated,
        className: edgeData.edgeClass,
        type: 'customEdge',
        pathOptions: { borderRadius: 16 },
        style: {
          borderRadius: 16,
          strokeDasharray: edgeData.isActive && edgeData.flowType === 'async' ? '6,6' : undefined,
        },
        data: {
          isActive: edgeData.isActive,
          flowColor: edgeData.flowColor,
          payloadText: edgeData.payloadText,
          edgeOffset, // Pass offset to Canvas customEdge
        }
      });
    });

    return { nodes: nodesList, edges: edgesList };
  }, [blueprint, resiliency, currentStepIndex, mergedDragPositions, newlyModifiedNodeIds]);

  // ── Node drag stop: update local + broadcast ───────────────────────────────
  const onNodeDragStop = useCallback(
    (event: any, node: any) => {
      setDragPositions((prev) => ({ ...prev, [node.id]: node.position }));
      collabNodeDragStop(event, node);
    },
    [collabNodeDragStop]
  );

  // ── Settings: save provider config to HttpOnly cookie via API ──────────────
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

  // ── Session management ─────────────────────────────────────────────────────
  const handleSaveCurrentSession = useCallback(() => {
    saveCurrentSession({
      blueprint,
      resiliency,
      scaleInfo,
      promptEngineerInfo: promptInfo,
      chatHistory,
      prompt,
      language,
      techStack,
      activePhaseIndex,
      checkedDoD,
    });
  }, [
    blueprint,
    resiliency,
    scaleInfo,
    promptInfo,
    chatHistory,
    prompt,
    language,
    techStack,
    activePhaseIndex,
    checkedDoD,
    saveCurrentSession,
  ]);

  const loadSession = useCallback(
    (session: SavedSession) => {
      setBlueprint(session.blueprint);
      setResiliency(session.resiliency);
      setScaleInfo(session.scaleInfo);
      setPromptInfo(session.promptEngineerInfo || null);
      setChatHistory(session.chatHistory || []);
      setPrompt(session.prompt);
      setLanguage(session.language);
      if (session.techStack) setTechStack(session.techStack);
      setActivePhaseIndex(session.activePhaseIndex ?? 0);
      setCheckedDoD(session.checkedDoD ?? {});
      setLeftSidebarOpen(false);
      broadcastGraphUpdate(session.blueprint, session.resiliency, session.scaleInfo);
    },
    [
      setBlueprint,
      setResiliency,
      setScaleInfo,
      setPromptInfo,
      setChatHistory,
      setActivePhaseIndex,
      setCheckedDoD,
      broadcastGraphUpdate,
    ]
  );

  // ── Generate wrappers ──────────────────────────────────────────────────────
  const onGenerate = useCallback(() => {
    clearRemoteState();
    resetPlayback();
    handleGenerate({ prompt, language });
  }, [prompt, language, handleGenerate, clearRemoteState, resetPlayback]);

  const onChatModify = useCallback(
    (chatText: string) => {
      handleChatModify(chatText, { prompt, blueprint, language });
    },
    [handleChatModify, prompt, blueprint, language]
  );

  const onReverseEngineer = useCallback(
    (payload: { zipBase64?: string; repoUrl?: string }) => {
      clearRemoteState();
      resetPlayback();
      handleReverseEngineer(payload, { language });
    },
    [handleReverseEngineer, language, clearRemoteState, resetPlayback]
  );

  const onApplyPreset = useCallback(
    (preset: any) => {
      handleApplyPreset(preset, {
        blueprint,
        resiliency,
        scaleInfo,
        language,
        onBroadcast: broadcastGraphUpdate,
      });
    },
    [handleApplyPreset, blueprint, resiliency, scaleInfo, language, broadcastGraphUpdate]
  );

  const triggerFullAiGeneration = useCallback(async () => {
    if (!blueprint) return;
    setIsGeneratingCode(true);
    addLog(
      language === 'th'
        ? '✦ เริ่มต้นเจเนอเรตโค้ดเต็มระบบด้วย AI DevOps Agent (ทำงานอยู่ด้านหลัง)...'
        : '✦ Initiating full AI code & IaC generation via DevOps Agent (runs in background)...'
    );
    try {
      const response = await fetch('/api/generate-infrastructure-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blueprint,
          techStack,
          language
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned status ${response.status}`);
      }

      const data = await response.json();
      setCodeData(data);
      setIsAiGenerated(true);
      
      const pTokens = parseInt(response.headers.get('X-Prompt-Tokens') || '0');
      const cTokens = parseInt(response.headers.get('X-Completion-Tokens') || '0');
      if (pTokens || cTokens) {
        addTokens(pTokens, cTokens);
      }
      
      // Autofocus available file if selected file is absent in new tree keys
      const files = Object.keys(data.files || {});
      if (files.length > 0 && !files.includes(selectedFile)) {
        setSelectedFile(files[0]);
      }

      addLog(
        language === 'th'
          ? '✦ เจนเนอเรตโค้ดและคอนฟิก IaC เต็มระบบ (Docker/K8s/Terraform) สำเร็จ!'
          : '✦ Full system code and IaC configs (Docker/K8s/Terraform) generated successfully!'
      );
    } catch (err: any) {
      console.error("Failed generating full code:", err);
      addLog(
        language === 'th'
          ? `❌ เกิดข้อผิดพลาดในการเจนโค้ด: ${err.message || err}`
          : `❌ Code generation failed: ${err.message || err}`
      );
    } finally {
      setIsGeneratingCode(false);
    }
  }, [blueprint, techStack, language, selectedFile, addTokens, addLog]);

  // Automatically trigger Prompt generation if switching to prompt tab and no promptInfo is fetched yet
  useEffect(() => {
    if (activeTab === 'prompt' && !promptInfo && blueprint && !isGeneratingPrompts) {
      handleGeneratePrompts(language);
    }
  }, [activeTab, promptInfo, blueprint, isGeneratingPrompts, language, handleGeneratePrompts]);

  // ── Export helpers ─────────────────────────────────────────────────────────
  const exportPNG = useCallback(() => {
    const rfPane = document.querySelector('.react-flow') as HTMLElement;
    if (!rfPane) return;
    toPng(rfPane, { backgroundColor: '#030712', width: rfPane.offsetWidth * 1.5, height: rfPane.offsetHeight * 1.5 })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `${blueprint?.title?.toLowerCase().replace(/\s+/g, '-') || 'architecture'}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch(console.error);
  }, [blueprint]);

  const copyMermaid = useCallback(() => {
    if (!blueprint?.layers) return;
    let flowCode = 'graph TD\n';
    blueprint.layers.forEach((l: any) => {
      l.nodes.forEach((n: any) => {
        if (n && n.id) {
          flowCode += `  ${n.id}["${n.name || n.id} (${n.type || 'Service'})"]\n`;
        }
      });
    });
    blueprint.steps?.forEach((s: any) => {
      const nodes = s.involved_nodes || [];
      for (let i = 0; i < nodes.length - 1; i++) {
        flowCode += `  ${nodes[i]} --> ${nodes[i + 1]}\n`;
      }
    });
    navigator.clipboard.writeText(flowCode);
  }, [blueprint]);

  const downloadJSON = useCallback(() => {
    if (!blueprint) return;
    const blob = new Blob([JSON.stringify({ blueprint, resiliency, scaleInfo }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${blueprint.title?.toLowerCase().replace(/\s+/g, '-') || 'blueprint'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [blueprint, resiliency, scaleInfo]);

  /* ─── JSX ─────────────────────────────────────────────────────────────── */
  return (
    <main className="h-screen flex flex-col relative overflow-hidden font-sans text-gray-200 grid-bg">
      {/* 🌌 Header */}
      <header className="h-16 shrink-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 z-30 select-none shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-900/25 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wider flex items-center gap-1.5">
              <span>AI-Powered Workflow Designer</span>
              <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[8px] px-1.5 py-0.5 rounded font-extrabold tracking-widest uppercase">PRO EDITION</span>
            </h1>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">Multi-Agent Code & IaC Generator Engine</p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-3">
          {/* Token usage tracker */}
          <div className="relative group flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold shadow-lg shadow-emerald-500/5 select-none hover:bg-emerald-500/20 transition-all cursor-help">
            <Coins className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Tokens: {tokenUsage.totalTokens.toLocaleString()}</span>
            <div className="absolute right-0 top-10 w-48 p-3 rounded-xl bg-slate-900 border border-emerald-500/20 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-[10px] space-y-1.5 normal-case font-normal tracking-normal text-left">
              <p className="font-bold text-white uppercase tracking-wider text-center border-b border-white/5 pb-1">Token Breakdown</p>
              <div className="flex justify-between"><span className="text-gray-400">Input / Prompt:</span><span className="text-emerald-400 font-bold">{tokenUsage.promptTokens.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Output / Completion:</span><span className="text-emerald-400 font-bold">{tokenUsage.completionTokens.toLocaleString()}</span></div>
              <div className="flex justify-between border-t border-white/5 pt-1 font-bold"><span className="text-white">Total Session:</span><span className="text-cyan-400">{tokenUsage.totalTokens.toLocaleString()}</span></div>
            </div>
          </div>

          <button onClick={() => setLeftSidebarOpen(true)} className="py-1.5 px-3.5 rounded-xl border border-white/5 bg-slate-900/40 hover:bg-slate-900 text-gray-300 hover:text-white text-xs flex items-center gap-2 cursor-pointer transition-all">
            <Folder className="w-4 h-4 text-cyan-400" />
            <span>{language === 'th' ? 'เซสชัน' : 'Sessions'}</span>
          </button>

          <button onClick={() => setReverseModalOpen(true)} className="py-1.5 px-3.5 rounded-xl border border-white/5 bg-slate-900/40 hover:bg-slate-900 text-gray-300 hover:text-white text-xs flex items-center gap-2 cursor-pointer transition-all">
            <FileCode className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>{language === 'th' ? 'ถอดรหัสโค้ด' : 'Reverse Code'}</span>
          </button>

          <button onClick={() => setSettingsOpen(true)} className="p-2 bg-slate-900 border border-white/5 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer" title="Settings">
            <Settings className="w-4 h-4" />
          </button>

          <button onClick={() => setRightChatOpen(true)} disabled={!blueprint} className="py-1.5 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white text-xs flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-purple-900/10">
            <MessageSquare className="w-4 h-4 text-white" />
            <span>{language === 'th' ? 'แชตแก้ไขผัง' : 'Chat Edit'}</span>
          </button>
        </div>
      </header>

      {/* 🛠️ Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel */}
        <div className="w-80 shrink-0 border-r border-white/15 bg-slate-900/95 backdrop-blur-lg flex flex-col p-4 space-y-4 select-none shadow-2xl shadow-black/80">
          {/* Prompt form */}
          <div className="p-4 bg-slate-800/90 border border-white/15 hover:border-cyan-500/30 rounded-2xl space-y-3.5 text-left transition-all duration-300 shadow-md">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              {language === 'th' ? 'ข้อความสั่งเขียนระบบ' : 'Design Prompts'}
            </h3>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={language === 'th' ? 'ระบุระบบที่ต้องการออกแบบ...' : 'Describe system architectures...'}
              className="w-full h-24 bg-slate-950 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-colors resize-none leading-relaxed placeholder:text-gray-600"
            />

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-300 font-semibold uppercase tracking-wider">{language === 'th' ? 'ภาษาเวิร์กโฟลว์:' : 'Workflow Language:'}</span>
              <div className="bg-slate-950 border border-white/15 rounded-xl p-0.5 flex">
                <button onClick={() => setLanguage('th')} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${language === 'th' ? 'bg-cyan-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>TH</button>
                <button onClick={() => setLanguage('en')} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${language === 'en' ? 'bg-cyan-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>EN</button>
              </div>
            </div>

            <button
              onClick={onGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/25 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating
                ? (language === 'th' ? 'กำลังสตรีมประมวลผล...' : 'Generating state structures...')
                : (language === 'th' ? 'เริ่มต้นออกแบบโครงสร้าง' : 'Generate Architecture')}
            </button>
          </div>

          {/* Collab room connector */}
          <div className="p-4 bg-slate-800/90 border border-white/15 hover:border-cyan-500/30 rounded-2xl text-left space-y-2 transition-all duration-300 shadow-md">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-400" />
              {language === 'th' ? 'ห้องร่วมมือทีมเวิร์ก' : 'Enterprise Multiplayer'}
            </h3>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              {language === 'th' ? 'แชร์ชื่อห้องนี้กับเพื่อนเพื่อวาดแผนผังไปพร้อมกันสดๆ!' : 'Share this room key to collaborate with team designers in real-time!'}
            </p>
            <div className="flex gap-1.5 mt-2">
              <input
                value={activeRoomId}
                onChange={(e) => setActiveRoomId(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="Room key name"
                className="flex-1 bg-slate-950 border border-white/15 rounded-xl px-3 py-1.5 text-[10px] text-white focus:outline-none focus:border-cyan-500/50 font-mono"
              />
            </div>
          </div>

          {/* Terminal log */}
          <div className="flex-1 bg-slate-950 border border-white/15 rounded-2xl p-4 flex flex-col font-mono text-[10px] text-left shadow-inner">
            <div className="flex items-center gap-1.5 border-b border-white/5 pb-2 mb-2 shrink-0 select-none">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse"></span>
              <span className="text-cyan-400 font-bold uppercase tracking-wider">Telemetries Logger</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-none font-mono">
              {logs.length === 0 ? (
                <span className="text-cyan-500/60 font-semibold italic">SYSTEM IDLE // READY FOR INPUT</span>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed whitespace-pre-wrap break-all text-slate-200">{log}</div>
                ))
              )}
            </div>

            {isGenerating && (
              <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between shrink-0 font-sans select-none">
                <span className="text-[9px] text-gray-500 uppercase font-semibold">Active Pipeline Stage:</span>
                <span className="text-[9px] font-bold text-cyan-400 font-mono uppercase tracking-widest">{activeStage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Center / Right panel */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden space-y-6">
          {/* Tab bar */}
          <div className="flex items-center bg-slate-900/95 p-2 rounded-2xl border border-white/15 select-none backdrop-blur-md shadow-lg">
            {([
              { id: 'canvas', icon: <Palette className="w-3.5 h-3.5 text-cyan-400" />, labelTh: 'ผังเวิร์กโฟลว์ (Canvas)', labelEn: 'Visual Canvas' },
              { id: 'scale', icon: <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />, labelTh: 'ขีดความสามารถและจูนนิ่ง (Scale)', labelEn: 'Scale & Optimize' },
              { id: 'code', icon: (
                <div className="relative">
                  <Code className="w-3.5 h-3.5 text-cyan-400" />
                  {isGeneratingCode && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-500 rounded-full animate-ping" />
                  )}
                </div>
              ), labelTh: `สเปคโค้ด & IaC (Code)${isGeneratingCode ? (language === 'th' ? ' (กำลังเจน...)' : ' (Generating...)') : ''}`, labelEn: `Code Workspace${isGeneratingCode ? ' (Generating...)' : ''}` },
              { id: 'prompt', icon: (
                <div className="relative">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  {isGeneratingPrompts && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-500 rounded-full animate-ping" />
                  )}
                </div>
              ), labelTh: `โต๊ะสร้างคำสั่ง (Prompt)${isGeneratingPrompts ? (language === 'th' ? ' (กำลังวิเคราะห์...)' : ' (Analyzing...)') : ''}`, labelEn: `Prompt Workspace${isGeneratingPrompts ? ' (Analyzing...)' : ''}` },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === tab.id ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/25' : 'text-slate-400 hover:text-white'}`}
              >
                <span className="flex items-center gap-2">{tab.icon}{language === 'th' ? tab.labelTh : tab.labelEn}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 flex flex-col min-h-0">
            {activeTab === 'canvas' && (
              <div className="flex-1 flex flex-col relative min-h-0" onMouseMove={handleCanvasMouseMove}>
                <Canvas
                  nodes={processedGraph.nodes}
                  edges={processedGraph.edges}
                  onNodesChange={() => {}}
                  onEdgesChange={() => {}}
                  onNodeDragStop={onNodeDragStop}
                  nodeTypesMap={nodeTypesMap}
                  blueprint={blueprint}
                  resiliency={resiliency}
                  collabUsers={collabUsers}
                  onExportPNG={exportPNG}
                  onCopyMermaid={copyMermaid}
                  onDownloadJSON={downloadJSON}
                  language={language}
                  isMounted={isMounted}
                  isPlaying={isPlaying}
                  onTogglePlay={togglePlay}
                  currentStepIndex={currentStepIndex}
                  onStepClick={selectStep}
                />
              </div>
            )}

            {activeTab === 'scale' && (
              <div className="flex-1 overflow-y-auto pr-1">
                <ScaleOptimize scaleInfo={scaleInfo} language={language} />
              </div>
            )}

            {activeTab === 'code' && (
              <div className="flex-1 overflow-y-auto pr-1">
                <CodeWorkspace
                  blueprint={blueprint}
                  techStack={techStack}
                  onStackChange={setTechStack}
                  language={language}
                  addTokens={addTokens}
                  codeData={codeData}
                  setCodeData={setCodeData}
                  isAiGenerated={isAiGenerated}
                  setIsAiGenerated={setIsAiGenerated}
                  isGenerating={isGeneratingCode}
                  triggerFullAiGeneration={triggerFullAiGeneration}
                  selectedFile={selectedFile}
                  setSelectedFile={setSelectedFile}
                />
              </div>
            )}

            {activeTab === 'prompt' && (
               <div className="flex-1 overflow-y-auto pr-1">
                 <PromptWorkspace
                   promptInfo={promptInfo}
                   blueprint={blueprint}
                   language={language}
                   isGenerating={isGeneratingPrompts}
                   onGeneratePrompts={() => handleGeneratePrompts(language)}
                   activePhaseIndex={activePhaseIndex}
                   setActivePhaseIndex={setActivePhaseIndex}
                   checkedDoD={checkedDoD}
                   setCheckedDoD={setCheckedDoD}
                 />
               </div>
             )}
          </div>
        </div>
      </div>

      {/* ── Settings Modal ─────────────────────────────────────────────────── */}
      {settingsOpen && (
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
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Model Provider</label>
                <select
                  value={settingsProvider}
                  onChange={(e: any) => setSettingsProvider(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="openai">OpenAI GPT-4o</option>
                  <option value="anthropic">Claude 3.5 Sonnet</option>
                  <option value="deepseek">DeepSeek Chat</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  API Key {settingsStatus.configured ? '(enter new key to update)' : ''}
                </label>
                <input
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
                onClick={() => setSettingsOpen(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-gray-400 font-medium text-xs rounded-xl cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar & Modals ──────────────────────────────────────────────── */}
      <SidebarLeft
        isOpen={leftSidebarOpen}
        onClose={() => setLeftSidebarOpen(false)}
        savedSessions={savedSessions}
        onLoadSession={loadSession}
        onDeleteSession={deleteSession}
        onSaveCurrentSession={handleSaveCurrentSession}
        blueprint={blueprint}
        resiliency={resiliency}
        scaleInfo={scaleInfo}
        chatHistory={chatHistory}
        techStack={techStack}
        prompt={prompt}
        language={language}
        onApplyPreset={onApplyPreset}
      />

      <SidebarRightChat
        isOpen={rightChatOpen}
        onClose={() => setRightChatOpen(false)}
        chatHistory={chatHistory}
        onSendMessage={onChatModify}
        isGenerating={isGenerating}
        language={language}
      />

      <ReverseEngineerModal
        isOpen={reverseModalOpen}
        onClose={() => setReverseModalOpen(false)}
        onReverseEngineer={onReverseEngineer}
        language={language}
      />
    </main>
  );
}
