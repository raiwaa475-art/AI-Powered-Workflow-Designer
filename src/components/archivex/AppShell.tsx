'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { TabBar } from './TabBar';
import { Tab } from './types';

// Types import
import {
  WorkflowData,
  ResiliencyData,
  ScaleData,
  ChatMessage,
  SavedSession,
  CollabUser,
  PromptEngineerData
} from '@/types';

// Node types – single source of truth
import { nodeTypesMap } from '@/components/nodes';

// Custom hooks
import { useGenerate } from '@/hooks/useGenerate';
import { useCollab } from '@/hooks/useCollab';
import { usePlayback } from '@/hooks/usePlayback';
import { useSession } from '@/hooks/useSession';

// Modular components
import { ScaleOptimize } from '@/components/ScaleOptimize';
import { CodeWorkspace } from '@/components/CodeWorkspace';
import { ReverseEngineerModal } from '@/components/ReverseEngineerModal';
import { Canvas } from '@/components/Canvas';
import { PromptWorkspace } from '@/components/PromptWorkspace';
import { SettingsModal } from '@/components/SettingsModal';
import { SidebarRightChat } from '@/components/SidebarRightChat';
import { StackSelectorModal } from '@/components/StackSelectorModal';

// Image Export
import { toPng } from 'html-to-image';
// Core workspace layout tabs
const WORKSPACE_TABS: Tab[] = [
  { id: 'business', label: 'Business Flow', icon: 'ti-palette' },
  { id: 'architecture', label: 'Tech Topology', icon: 'ti-cpu' },
  { id: 'simulation', label: 'Simulation', icon: 'ti-activity' },
  { id: 'scale-optimize', label: 'Scale & Optimize', icon: 'ti-trending-up' },
  { id: 'code-view', label: 'Code', icon: 'ti-code' },
  { id: 'prompt', label: 'Progressive Prompts', icon: 'ti-sparkles' },
];

export const AppShell: React.FC = () => {
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

  // Tab navigation states
  const [activeNavId, setActiveNavId] = useState<string>('blueprint');
  const [activeTabId, setActiveTabId] = useState<string>('architecture');

  // (Settings state is managed inside SettingsModal component)

  // Node drag position cache (local only)
  const [dragPositions, setDragPositions] = useState<Record<string, { x: number; y: number }>>({});

  // Lifted Code Workspace states to persist across tab switches
  const [codeData, setCodeData] = useState<{ explanation: string; files: Record<string, string> } | null>(null);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>('docker-compose.yml');

  // Business Questions Calibration states for PromptWorkspace
  const [businessQuestions, setBusinessQuestions] = useState<any[] | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<boolean>(false);

  // ── Custom Hooks ───────────────────────────────────────────────────
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
    handleChatMessage,
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
    backendStack,
    setBackendStack,
    showStackSelector,
    setShowStackSelector,
    selectStackAndAnalyze,
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

  // ── Mount & Init ───────────────────────────────────────────────────
  useEffect(() => {
    setIsMounted(true);
    initSessions();
  }, [initSessions]);


  // ── Apply Peer Collaboration States ────────────────────────────────
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
      selectStep(remotePlayback.activeStepIndex);
    }
  }, [remotePlayback, selectStep]);

  // ── Reset AI spec codes when blueprint/stack switches ─────────────
  useEffect(() => {
    setIsAiGenerated(false);
    setCodeData(null);
  }, [blueprint]);

  useEffect(() => {
    setIsAiGenerated(false);
    setCodeData(null);
  }, [techStack]);

  // ── Automatically generate prompts when switching to prompt worksheet ───────
  useEffect(() => {
    if (activeTabId === 'prompt' && !promptInfo && blueprint && !isGeneratingPrompts) {
      handleGeneratePrompts(language);
    }
  }, [activeTabId, promptInfo, blueprint, isGeneratingPrompts, language, handleGeneratePrompts]);

  // ── Merged node drag positions (local + peer nodes) ───────────────────────
  const mergedDragPositions = useMemo(
    () => ({ ...remoteNodePositions, ...dragPositions }),
    [dragPositions, remoteNodePositions]
  );

  // ── React Flow Nodes & Edges Graph Calculations (Architecture / Simulation) ──
  const processedGraph = useMemo(() => {
    if (!blueprint) return { nodes: [], edges: [] };

    // Only apply step-based filtering in simulation/hybrid mode
    const isSimMode = activeTabId === 'simulation';

    const layers = blueprint.layers || [];
    const steps = blueprint.steps || [];
    const stepFlows = resiliency?.step_flows || [];
    const risks = resiliency?.node_risks || [];

    const nodesList: any[] = [];
    const edgesList: any[] = [];

    const layerCoordinatesY: Record<string, number> = {
      presentation: 80,
      application: 360,
      queue: 720,
      data: 1020,
    };

    const seenNodeIds = new Set<string>();
    const nodePositionMap = new Map<string, { x: number; y: number }>();

    // Only use activeStep for simulation mode
    const activeStep = isSimMode && currentStepIndex >= 0 && currentStepIndex < steps.length
      ? steps[currentStepIndex]
      : null;

    const stepPositions: Record<string, { x: number; y: number; layerId: string }> = {};
    if (activeStep && activeStep.involved_nodes?.length > 0) {
      const nodesSeq = activeStep.involved_nodes;
      const targetLayers = ['presentation', 'application', 'queue', 'data'];
      
      nodesSeq.forEach((nodeId: string, idx: number) => {
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
      
      // Filter to only active-step nodes when in simulation mode
      const activeLayerNodes = activeStep 
        ? layerNodes.filter((node: any) => activeStep.involved_nodes?.includes(node.id))
        : layerNodes;

      const nodeCount = activeLayerNodes.length;
      const yCoord = layerCoordinatesY[layerId] || 100;

      const stepWidth = 320;
      const startingX = -((nodeCount - 1) * stepWidth) / 2;

      activeLayerNodes.forEach((node: any, index: number) => {
        if (!node.id || seenNodeIds.has(node.id)) return;
        seenNodeIds.add(node.id);

        const xCoord = startingX + (index * stepWidth);

        const savedPos = mergedDragPositions[node.id];
        const stepPos = activeStep ? stepPositions[node.id] : null;
        const finalX = stepPos ? stepPos.x : (savedPos ? savedPos.x : xCoord - 120);
        const finalY = stepPos ? stepPos.y : (savedPos ? savedPos.y : yCoord);

        nodePositionMap.set(node.id, { x: finalX, y: finalY });

        let isNodeActive = false;
        let activeStepFlow: any = null;

        if (isSimMode && currentStepIndex >= 0 && currentStepIndex < steps.length) {
          const activeStepVal = steps[currentStepIndex];
          if (activeStepVal?.involved_nodes?.includes(node.id)) {
            isNodeActive = true;
            activeStepFlow = stepFlows.find((f: any) => f.step_number === activeStepVal.number);
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

    const activeLayersSet = new Set<string>();
    nodesList.forEach((n: any) => {
      if (n.type === 'custom') {
        activeLayersSet.add(n.data.layerId);
      }
    });

    const layerMeta: Record<string, { title: string; number: number; colorClass: string }> = {
      presentation: { title: 'Presentation Layer', number: 1, colorClass: 'text-violet-400 bg-violet-500' },
      application: { title: 'Application Layer', number: 2, colorClass: 'text-teal-400 bg-teal-500' },
      queue: { title: 'Message Broker / Queue Layer', number: 3, colorClass: 'text-amber-400 bg-amber-500' },
      data: { title: 'Database & Cache Layer', number: 4, colorClass: 'text-blue-400 bg-blue-500' },
    };

    activeLayersSet.forEach((layerId) => {
      const meta = layerMeta[layerId] || {
        title: `${layerId.charAt(0).toUpperCase() + layerId.slice(1)} Layer`,
        number: 99,
        colorClass: 'text-cyan-400 bg-cyan-500',
      };

      const yCoord = layerCoordinatesY[layerId] || 100;
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

    const edgeMap = new Map<string, any>();

    steps.forEach((step: any, stepIdx: number) => {
      const stepNodes = step.involved_nodes || [];
      if (stepNodes.length < 2) return;

      const matchingFlow = stepFlows.find((f: any) => f.step_number === step.number);
      // In simulation mode: only render the highlighted step's edges
      const isStepHighlighted = isSimMode && currentStepIndex === stepIdx;

      if (isSimMode && activeStep && !isStepHighlighted) {
        return;
      }

      for (let i = 0; i < stepNodes.length - 1; i++) {
        const source = stepNodes[i];
        const target = stepNodes[i + 1];
        if (!source || !target) continue;

        // Only add edge if both nodes were actually rendered
        if (!nodePositionMap.has(source) || !nodePositionMap.has(target)) continue;

        const pairKey = `${source}->${target}`;
        const sourcePos = nodePositionMap.get(source);
        const targetPos = nodePositionMap.get(target);
        let sourceHandle = 'source-bottom-center';
        let targetHandle = 'target-top-center';

        if (sourcePos && targetPos) {
          const dy = Math.abs(sourcePos.y - targetPos.y);
          const dx = targetPos.x - sourcePos.x;

          if (dy < 50) {
            if (dx > 0) {
              sourceHandle = 'source-right';
              targetHandle = 'target-left';
            } else {
              sourceHandle = 'source-left';
              targetHandle = 'target-right';
            }
          } else if (sourcePos.y > targetPos.y) {
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

        if (isStepHighlighted || !existing) {
          let edgeClass = 'stroke-white/20 stroke-[1.5px] transition-all duration-300';
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

        let offset = 0;
        if (currentCount > 0) {
          const sign = currentCount % 2 === 1 ? -1 : 1;
          const stepValue = Math.ceil(currentCount / 2);
          offset = sign * stepValue * 24;
        }
        edgeOffsets.set(pairKey, offset);
      } else {
        edgeOffsets.set(pairKey, 0);
      }
    });

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
          edgeOffset,
        }
      });
    });

    return { nodes: nodesList, edges: edgesList };
  }, [blueprint, resiliency, currentStepIndex, mergedDragPositions, newlyModifiedNodeIds, activeTabId]);

  // ── Business Flow Graph (step-based flowchart layout) ─────────────
  const businessGraph = useMemo(() => {
    if (!blueprint) return { nodes: [], edges: [] };

    const steps = blueprint.steps || [];
    const stepFlows = resiliency?.step_flows || [];

    if (steps.length === 0) return { nodes: [], edges: [] };

    const nodesList: any[] = [];
    const edgesList: any[] = [];

    const CARD_W = 340;
    const CARD_H = 210;
    const H_GAP = 110;   // horizontal gap between steps in same row
    const V_GAP = 90;   // vertical gap between rows
    const COLS = Math.min(steps.length, 3); // max 3 per row

    steps.forEach((step: any, idx: number) => {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      // Zigzag layout: alternate row direction
      const isReverse = row % 2 === 1;
      const colInRow = isReverse ? (COLS - 1 - col) : col;

      const x = colInRow * (CARD_W + H_GAP);
      const y = row * (CARD_H + V_GAP);

      const matchingFlow = stepFlows.find((f: any) => f.step_number === step.number);

      let accentColor = '#534AB7';
      let flowLabel = 'Step';
      if (matchingFlow?.flow_type === 'sync') { accentColor = '#22d3ee'; flowLabel = 'Sync'; }
      else if (matchingFlow?.flow_type === 'async') { accentColor = '#fb923c'; flowLabel = 'Async'; }
      else if (matchingFlow?.flow_type === 'event') { accentColor = '#c084fc'; flowLabel = 'Event'; }

      nodesList.push({
        id: `biz-step-${step.id || idx}`,
        type: 'businessStep',
        position: { x, y },
        data: {
          stepNumber: step.number ?? (idx + 1),
          title: step.title,
          description: step.description,
          accentColor,
          flowLabel,
          protocol: matchingFlow?.technical_protocol,
          involvedCount: step.involved_nodes?.length ?? 0,
        },
        style: { zIndex: 1 },
      });
    });

    // Connect steps in sequence
    steps.forEach((step: any, idx: number) => {
      if (idx === 0) return;
      const prevId = `biz-step-${steps[idx - 1].id || (idx - 1)}`;
      const currId = `biz-step-${step.id || idx}`;
      const matchingFlow = stepFlows.find((f: any) => f.step_number === step.number);

      let flowColor = '#534AB7';
      if (matchingFlow?.flow_type === 'sync') flowColor = '#22d3ee';
      else if (matchingFlow?.flow_type === 'async') flowColor = '#fb923c';
      else if (matchingFlow?.flow_type === 'event') flowColor = '#c084fc';

      edgesList.push({
        id: `biz-edge-${idx}`,
        source: prevId,
        target: currId,
        type: 'customEdge',
        animated: false,
        className: 'stroke-white/25 stroke-[1.5px] transition-all duration-300',
        data: {
          isActive: false,
          flowColor,
          payloadText: null,
          edgeOffset: 0,
        },
      });
    });

    return { nodes: nodesList, edges: edgesList };
  }, [blueprint, resiliency]);

  // ── Drag stops & updates ───────────────────────────────────────────
  const onNodeDragStop = useCallback(
    (event: any, node: any) => {
      setDragPositions((prev) => ({ ...prev, [node.id]: node.position }));
      collabNodeDragStop(event, node);
    },
    [collabNodeDragStop]
  );

  // Settings handled by SettingsModal component

  // ── Session drawer load & save ─────────────────────────────────────
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

  // ── Wrapper triggers for API generations ───────────────────────────
  const onGenerate = useCallback(() => {
    clearRemoteState();
    resetPlayback();
    handleGenerate({ prompt, language });
  }, [prompt, language, handleGenerate, clearRemoteState, resetPlayback]);

  const onChatModify = useCallback(
    (chatText: string) => {
      handleChatMessage(chatText, { prompt, blueprint, language });
    },
    [handleChatMessage, prompt, blueprint, language]
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

  const onGenerateQuestions = useCallback(async () => {
    if (!blueprint) return;
    setIsGeneratingQuestions(true);
    addLog(
      language === 'th'
        ? '✦ กำลังทำงาน Business Logic Analyst วิเคราะห์สถาปัตยกรรมเพื่อออกแบบคำถามสำคัญ...'
        : '✦ Invoking Business Logic Analyst to formulate crucial architecture calibration questions...'
    );
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blueprint, language })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      setBusinessQuestions(data.questions || []);
      
      const pTokens = parseInt(response.headers.get('X-Prompt-Tokens') || '0');
      const cTokens = parseInt(response.headers.get('X-Completion-Tokens') || '0');
      if (pTokens || cTokens) {
        addTokens(pTokens, cTokens);
      }

      addLog(
        language === 'th'
          ? '✦ วิเคราะห์และเตรียมคำถามเพื่อความแม่นยำทางธุรกิจสำเร็จ!'
          : '✦ High-fidelity business rule calibration questions compiled successfully!'
      );
    } catch (err: any) {
      console.error("Failed to generate questions:", err);
      addLog(
        language === 'th'
          ? `✦ เกิดข้อผิดพลาดในการวิเคราะห์คำถาม: ${err.message || err}`
          : `✦ Failed to compile questions: ${err.message || err}`
      );
    } finally {
      setIsGeneratingQuestions(false);
    }
  }, [blueprint, language, addTokens, addLog]);

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

      const files = Object.keys(data.files || {});
      if (files.length > 0 && !files.includes(selectedFile)) {
        setSelectedFile(files[0]);
      }

      addLog(
        language === 'th'
          ? '✦ เจเนอเรตโค้ดและคอนฟิก IaC เต็มระบบ (Docker/K8s/Terraform) สำเร็จ!'
          : '✦ Full system code and IaC configs (Docker/K8s/Terraform) generated successfully!'
      );
    } catch (err: any) {
      console.error("Failed generating full code:", err);
      addLog(
        language === 'th'
          ? `✦ เกิดข้อผิดพลาดในการเจนนโค้ด: ${err.message || err}`
          : `✦ Code generation failed: ${err.message || err}`
      );
    } finally {
      setIsGeneratingCode(false);
    }
  }, [blueprint, techStack, language, selectedFile, addTokens, addLog]);

  // ── PNG / Mermaid / JSON export utilities ─────────────────────────
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

  // ── Dynamic SaaS Agent status calculations ────────────────────────
  useMemo(() => {
    return [
      {
        id: 'blueprint',
        name: 'Blueprint Agent',
        description: language === 'th' ? 'สร้างโครงสร้างเลเยอร์และระบบบริการ' : 'Generates system layers & nodes',
        status: isGenerating && activeStage === 'BLUEPRINT' ? 'active' : 'inactive',
        icon: 'ti-sitemap',
        color: '#534AB7',
        iconTint: 'rgba(83, 74, 183, 0.15)',
      },
      {
        id: 'resiliency',
        name: 'Resiliency Agent',
        description: language === 'th' ? 'วิเคราะห์จุดขัดข้อง SPOF และความปลอดภัย' : 'Scans for SPOFs and risk paths',
        status: isGenerating && activeStage === 'RESILIENCY' ? 'active' : 'inactive',
        icon: 'ti-shield-check',
        color: '#22d3ee',
        iconTint: 'rgba(34, 211, 238, 0.14)',
      },
      {
        id: 'scale',
        name: 'Scale Agent',
        description: language === 'th' ? 'คำนวณขนาดโหลดและงบประมาณคลาวด์' : 'Calculates performance profiles',
        status: isGenerating && activeStage === 'SCALE' ? 'active' : 'inactive',
        icon: 'ti-trending-up',
        color: '#d97706',
        iconTint: 'rgba(217, 119, 6, 0.15)',
      },
      {
        id: 'devops',
        name: 'DevOps / IaC',
        description: language === 'th' ? 'เขียนไฟล์คอนฟิก Docker/K8s/Terraform' : 'Emits K8s, Docker & Terraform code',
        status: isGeneratingCode ? 'active' : 'inactive',
        icon: 'ti-terminal-2',
        color: '#2563eb',
        iconTint: 'rgba(37, 99, 235, 0.15)',
      },
      {
        id: 'reverse-eng',
        name: 'Reverse Eng.',
        description: language === 'th' ? 'แกะโค้ดเบสมาเขียนเป็นแผนภาพไดอะแกรม' : 'Decompiles structural codebases',
        status: 'inactive',
        icon: 'ti-rotate',
        color: '#db2777',
        iconTint: 'rgba(219, 39, 119, 0.15)',
      },
      {
        id: 'prompts',
        name: 'Prompt Builder',
        description: language === 'th' ? 'สร้างข้อความสั่งพัฒนาระบบทีละขั้น' : 'Compiles progressive prompts',
        status: isGeneratingPrompts ? 'active' : 'inactive',
        icon: 'ti-sparkles',
        color: '#16a34a',
        iconTint: 'rgba(22, 163, 74, 0.15)',
      },
    ];
  }, [isGenerating, activeStage, isGeneratingCode, isGeneratingPrompts, language]);

  const workspaceStatus = useMemo(() => {
    if (isGeneratingPrompts) return 'PROMPTS';
    if (isGeneratingCode) return 'DEVOPS';
    if (isGenerating) return activeStage;
    return 'IDLE';
  }, [activeStage, isGenerating, isGeneratingCode, isGeneratingPrompts]);

  // Intercept Sidebar updates to seamlessly bridge SaaS contexts
  const handleNavChange = (id: string) => {
    setActiveNavId(id);
    if (id === 'settings') {
      setSettingsOpen(true);
    } else if (id === 'reverse-eng') {
      setReverseModalOpen(true);
    } else if (id === 'history') {
      setLeftSidebarOpen(true);
    } else if (id === 'topology' || id === 'blueprint') {
      setActiveTabId('architecture');
    } else if (id === 'overview') {
      setActiveTabId('business');
    } else if (id === 'simulation') {
      setActiveTabId('simulation');
    } else if (id === 'resiliency') {
      setActiveTabId('architecture');
    } else if (id === 'scale') {
      setActiveTabId('scale-optimize');
    } else if (id === 'devops' || id === 'code') {
      setActiveTabId('code-view');
    } else if (id === 'prompts') {
      setActiveTabId('prompt');
    }
  };

  return (
    <div className="aether-theme flex w-screen h-screen overflow-hidden bg-[var(--color-background)] font-sans text-[var(--color-text-primary)] antialiased select-none relative">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar 
        activeId={activeNavId} 
        onChangeActiveId={handleNavChange} 
        logs={logs} 
        blueprint={blueprint}
        tokenUsage={tokenUsage}
        language={language}
        onNew={() => {
          clearRemoteState();
          setBlueprint(null);
          setResiliency(null);
          setScaleInfo(null);
          setPromptInfo(null);
          resetPlayback();
          setPrompt('ระบบกดบัตรคอนเสิร์ต 1M Users');
        }}
        savedSessions={savedSessions}
        onLoadSession={loadSession}
        onDeleteSession={deleteSession}
        onSaveSession={handleSaveCurrentSession}
        onApplyPreset={onApplyPreset}
      />

      {/* 2. Main Workspace Area */}
      <div className="aether-main flex-1 flex flex-col h-full min-w-0 bg-[var(--color-background)] overflow-hidden">

        {/* Tab Layout switcher */}
        <TabBar 
          tabs={WORKSPACE_TABS} 
          activeTab={activeTabId} 
          onChange={setActiveTabId} 
          language={language}
          onLanguageChange={setLanguage}
          status={workspaceStatus}
        />

        {/* 3. Main content area scrollbox */}
        <div className="aether-workspace flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5 min-h-0 scrollbar-none bg-[var(--color-background)] relative">
          
          {/* Main Workspace empty vs real routing */}
          {!blueprint ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto min-h-[300px]">
              <div className="max-w-xl w-full text-center space-y-6 animate-fade-in-node">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 via-[#534AB7] to-violet-500 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-cyan-500/20 relative hud-scanline">
                  <div className="absolute inset-0 bg-[#534AB7]/30 blur-xl rounded-2xl animate-pulse" />
                  <i className="ti ti-activity text-white text-[28px] relative z-10" />
                </div>

                {/* Headlines */}
                <div className="space-y-2">
                  <h2 className="text-[24px] font-bold tracking-normal text-[var(--color-text-primary)]">
                    {language === 'th' ? 'ออกแบบและจำลองระบบด้วย Multi-Agent' : 'Orchestrate System Topology with Multi-Agents'}
                  </h2>
                  <p className="text-[14px] text-[var(--color-text-muted)] leading-relaxed max-w-md mx-auto">
                    {language === 'th' 
                      ? 'ระบบจำลองการออกแบบ Distributed Architectures, ความปลอดภัย, ขนาดโหลด และเขียน Docker/K8s/Terraform อัตโนมัติในคลิกเดียว'
                      : 'Design, analyze resiliency, size concurrent load, and auto-generate clean boilerplate codes & IaC specs using six dedicated AI agents.'}
                  </p>
                </div>

                {/* Input box */}
                <div className="hud-panel hud-input flex items-center gap-2 p-1.5 rounded-[var(--border-radius-lg)] border-[0.5px] border-[var(--color-border-tertiary)] bg-[var(--color-background-secondary)] w-full">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onGenerate();
                    }}
                    placeholder={language === 'th' ? 'ระบุระบบที่ต้องการออกแบบ (เช่น ระบบกดบัตรคอนเสิร์ต 1M Users)...' : 'Describe your architecture prompt...'}
                    className="flex-1 h-10 bg-transparent border-none outline-none text-[14px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] px-3"
                  />
                  <button
                    onClick={onGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="hud-primary-button h-10 px-5 rounded-[var(--border-radius-md)] bg-[#534AB7] hover:bg-[#4339a2] disabled:opacity-40 text-white text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer outline-none border-none transition-all"
                  >
                    {isGenerating ? (
                      <i className="ti ti-loader text-[13px] animate-spin" />
                    ) : (
                      <i className="ti ti-sparkles text-[13px]" />
                    )}
                    <span>{isGenerating ? (language === 'th' ? 'กำลังเจน...' : 'Generating...') : (language === 'th' ? 'ออกแบบ' : 'Generate')}</span>
                  </button>
                </div>

                {/* Suggestion Prompts */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block">
                    {language === 'th' ? 'ตัวอย่างเทมเพลตเริ่มต้น' : 'Suggested Blueprints'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                    {[
                      {
                        title: 'ระบบกดบัตรคอนเสิร์ต 1M Users',
                        titleEn: '1M Users Concert Booking System',
                        desc: 'รองรับคิวขนาน ด่านตั๋วซ้ำ โหลดขัดจังหวะสูง',
                        descEn: 'Concurrency locks, distributed queue, database pools',
                        prompt: 'ระบบกดบัตรคอนเสิร์ต รองรับผู้ใช้หลักล้านคน มีระบบจ่ายเงิน บัตรคิว และระบบคิวจองที่นั่งขัดแย้งกันอย่างมีประสิทธิภาพ'
                      },
                      {
                        title: 'ระบบเช่าจักรยานไฟฟ้า IoT Platform',
                        titleEn: 'Electric Bike IoT Platform',
                        desc: 'ระบบสตรีม GPS มียอดพิกัดวินาที เชื่อมผ่าน MQTT Broker',
                        descEn: 'Real-time telemetry, MQTT, Redis cache geo-queries',
                        prompt: 'ระบบเช่ารถจักรยานไฟฟ้า IoT อัจฉริยะ รับส่งพิกัดรถจักรยานจำนวน 50,000 คันผ่าน MQTT Broker และจัดเก็บตำแหน่งลง Redis และ PostgreSQL'
                      }
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setPrompt(item.prompt);
                          handleGenerate({ prompt: item.prompt, language });
                        }}
                        disabled={isGenerating}
                        className="hud-panel p-3 text-left rounded-[var(--border-radius-md)] border-[0.5px] border-[var(--color-border-tertiary)] bg-[var(--color-background-secondary)] hover:border-[#534AB7]/40 cursor-pointer transition-all hover:bg-[var(--color-background)] outline-none"
                      >
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--color-text-primary)]">
                          <i className="ti ti-sitemap text-[#534AB7] text-[12px]" />
                          <span>{language === 'th' ? item.title : item.titleEn}</span>
                        </div>
                        <p className="text-[10px] text-[var(--color-text-muted)] mt-1 truncate">
                          {language === 'th' ? item.desc : item.descEn}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Prompt Row for manual regenerations/chat inputs */}
              <div className="flex items-center gap-2 w-full shrink-0">
                <div className="flex-1 relative flex items-center">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onGenerate();
                    }}
                    placeholder={language === 'th' ? 'ระบุข้อความสั่งแก้ไขหรืออัปเดตระบบสถาปัตยกรรม...' : 'Describe system updates or prompts...'}
                    className="hud-input w-full h-10 pl-3.5 pr-10 rounded-[var(--border-radius-md)] border-[0.5px] border-[var(--color-border-tertiary)] bg-transparent text-[14px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[#534AB7] focus:ring-[0.5px] focus:ring-[#534AB7] transition-all font-sans leading-none"
                  />
                  {prompt && (
                    <button
                      onClick={() => setPrompt('')}
                      className="absolute right-3 p-1 rounded hover:bg-[var(--color-background-secondary)] text-[var(--color-text-muted)] cursor-pointer border-none outline-none"
                    >
                      <i className="ti ti-x text-[12px]" />
                    </button>
                  )}
                </div>
                <button
                  onClick={onGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="hud-primary-button h-10 px-5 rounded-[var(--border-radius-md)] bg-[#534AB7] hover:bg-[#4339a2] text-[13px] font-semibold text-white flex items-center gap-1.5 cursor-pointer border-none outline-none select-none transition-all duration-[120ms]"
                >
                  {isGenerating ? (
                    <i className="ti ti-loader text-[13px] animate-spin" />
                  ) : (
                    <i className="ti ti-sparkles text-[13px]" />
                  )}
                  <span>{language === 'th' ? 'ออกแบบใหม่' : 'Re-generate'}</span>
                </button>
              </div>

              {/* Logs have been moved to the Sidebar */}

              {/* Showcase visual preview workspace block (Swaps tabs based on activeTabId!) */}
              <div className="flex-1 flex flex-col relative min-h-[500px]">
                {/* ── Tab: Business Flow / Architecture / Simulation (React Flow Canvas) ──── */}
                {(activeTabId === 'business' || activeTabId === 'architecture' || activeTabId === 'simulation') && (
                  <div className="flex-1 flex flex-col relative min-h-0" onMouseMove={handleCanvasMouseMove}>
                    <Canvas
                      nodes={activeTabId === 'business' ? businessGraph.nodes : processedGraph.nodes}
                      edges={activeTabId === 'business' ? businessGraph.edges : processedGraph.edges}
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
                      canvasViewMode={
                        activeTabId === 'business' ? 'business' :
                        activeTabId === 'simulation' ? 'hybrid' : 'architecture'
                      }
                      setCanvasViewMode={(mode) => {
                        if (mode === 'business') setActiveTabId('business');
                        else if (mode === 'hybrid') setActiveTabId('simulation');
                        else setActiveTabId('architecture');
                      }}
                    />
                  </div>
                )}

                {/* ── Tab: Scale & Optimize ────────────────────────────────────────────────── */}
                {activeTabId === 'scale-optimize' && (
                  <div className="flex-1 overflow-y-auto pr-1">
                    <ScaleOptimize 
                      scaleInfo={scaleInfo} 
                      blueprint={blueprint} 
                      language={language} 
                      backendStack={backendStack}
                      onChangeStack={() => setShowStackSelector(true)}
                    />
                  </div>
                )}

                {/* ── Tab: Code Workspace / DevOps IaC spec ──────────────────────── */}
                {activeTabId === 'code-view' && (
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

                {/* ── Tab: Progressive prompts worksheet ────────────────────────────────── */}
                {activeTabId === 'prompt' && (
                  <div className="flex-1 overflow-y-auto pr-1">
                    <PromptWorkspace
                      promptInfo={promptInfo}
                      blueprint={blueprint}
                      language={language}
                      isGenerating={isGeneratingPrompts}
                      onGeneratePrompts={(customAnswers) => handleGeneratePrompts(language, customAnswers || userAnswers)}
                      activePhaseIndex={activePhaseIndex}
                      setActivePhaseIndex={setActivePhaseIndex}
                      checkedDoD={checkedDoD}
                      setCheckedDoD={setCheckedDoD}
                      businessQuestions={businessQuestions}
                      setBusinessQuestions={setBusinessQuestions}
                      userAnswers={userAnswers}
                      setUserAnswers={setUserAnswers}
                      isGeneratingQuestions={isGeneratingQuestions}
                      onGenerateQuestions={onGenerateQuestions}
                    />
                  </div>
                )}
              </div>
            </>
          )}
          
        </div>
      </div>

      {/* ── Modals & Drawers Mount ─────────────────────────────────────────── */}
      {/* 2. Right Chat Modifier Drawer */}
      <SidebarRightChat
        isOpen={rightChatOpen}
        onClose={() => setRightChatOpen(false)}
        chatHistory={chatHistory}
        onSendMessage={onChatModify}
        isGenerating={isGenerating}
        language={language}
      />

      {/* 3. Reverse Engineer Upload Modal */}
      <ReverseEngineerModal
        isOpen={reverseModalOpen}
        onClose={() => setReverseModalOpen(false)}
        onReverseEngineer={onReverseEngineer}
        language={language}
      />

      {/* 4. API Engine Config Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* 5. Intercepting Stack Selector Modal */}
      {showStackSelector && (
        <StackSelectorModal
          isOpen={showStackSelector}
          onClose={() => setShowStackSelector(false)}
          blueprint={blueprint || {}}
          onSelectStack={(stackId) => selectStackAndAnalyze(stackId)}
          language={language}
        />
      )}

      {/* Floating Chatbot Bubble at the bottom-right */}
      <button
          onClick={() => setRightChatOpen(!rightChatOpen)}
          className="hud-chat-fab fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[#534AB7] hover:bg-[#4339a2] text-white flex items-center justify-center shadow-lg shadow-[#534AB7]/30 hover:scale-110 active:scale-95 transition-all cursor-pointer z-50 border-none outline-none"
          title={language === 'th' ? 'พูดคุยกับสถาปนิก AI' : 'Chat with AI Architect'}
        >
          {rightChatOpen ? (
            <i className="ti ti-x text-[20px]" />
          ) : (
            <i className="ti ti-message-2 text-[20px]" />
          )}
          {!rightChatOpen && isGenerating && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 animate-ping" />
          )}
      </button>
    </div>
  );
};
