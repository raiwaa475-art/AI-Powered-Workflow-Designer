'use client';

import { useState, useCallback, useRef } from 'react';
import { WorkflowData, ResiliencyData, ScaleData, ChatMessage, ChatModification, PromptEngineerData } from '@/types';
import { parsePartialJson } from '@/utils/partialParser';

export type ActiveStage = 'IDLE' | 'BLUEPRINT' | 'RESILIENCY' | 'SCALE' | 'PROMPTS';
export type Provider = 'openai' | 'anthropic' | 'deepseek';

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface UseGenerateReturn {
  blueprint: WorkflowData | any | null;
  setBlueprint: React.Dispatch<React.SetStateAction<WorkflowData | any | null>>;
  resiliency: ResiliencyData | null;
  setResiliency: React.Dispatch<React.SetStateAction<ResiliencyData | null>>;
  scaleInfo: ScaleData | null;
  setScaleInfo: React.Dispatch<React.SetStateAction<ScaleData | null>>;
  isGenerating: boolean;
  activeStage: ActiveStage;
  logs: string[];
  tokenUsage: TokenUsage;
  newlyModifiedNodeIds: string[];
  addTokens: (prompt: number, completion: number) => void;
  handleGenerate: (params: { prompt: string; language: 'th' | 'en' }) => Promise<void>;
  handleChatMessage: (chatText: string, params: { prompt: string; blueprint: any; language: 'th' | 'en' }) => Promise<void>;
  handleReverseEngineer: (
    payload: { zipBase64?: string; repoUrl?: string },
    params: { language: 'th' | 'en' }
  ) => Promise<void>;
  handleApplyPreset: (preset: any, params: { blueprint: any; resiliency: ResiliencyData | null; scaleInfo: ScaleData | null; language: 'th' | 'en'; onBroadcast?: (bp: any, res: any, scale: any) => void }) => void;
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  addLog: (text: string) => void;
  triggerTelemetryInsights: (bp: any, language: 'th' | 'en', currentBackendStack?: string, onBroadcast?: (bp: any, res: any, scale: any) => void) => Promise<void>;
  promptInfo: PromptEngineerData | null;
  setPromptInfo: React.Dispatch<React.SetStateAction<PromptEngineerData | null>>;
  isGeneratingPrompts: boolean;
  handleGeneratePrompts: (language: 'th' | 'en', customAnswers?: Record<string, string>) => Promise<void>;
  activePhaseIndex: number;
  setActivePhaseIndex: React.Dispatch<React.SetStateAction<number>>;
  checkedDoD: Record<string, boolean>;
  setCheckedDoD: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  backendStack: string;
  setBackendStack: React.Dispatch<React.SetStateAction<string>>;
  showStackSelector: boolean;
  setShowStackSelector: React.Dispatch<React.SetStateAction<boolean>>;
  selectStackAndAnalyze: (stackId: string, customBlueprint?: any) => Promise<void>;
}

function isBlueprintEditRequest(text: string) {
  return /(^|\s)(\/edit|add|remove|delete|change|update|modify|replace|integrate|deploy|attach|connect|insert|create|เพิ่ม|ลบ|เอาออก|เปลี่ยน|แก้|ปรับ|อัปเดต|เชื่อม|ติดตั้ง|ใส่|สร้าง)(\s|$)/i.test(text);
}

function getNeedsBlueprintMessage(language: 'th' | 'en') {
  return language === 'th'
    ? 'ตอนนี้ยังไม่มี blueprint บน canvas ครับ ถ้าต้องการให้ผมแก้โครงสร้างจริง ให้สร้าง blueprint ก่อนจาก prompt หลักด้านซ้าย แล้วกลับมาสั่งแก้ในแชทนี้ได้เลย'
    : 'There is no active blueprint on the canvas yet. Generate a blueprint from the main prompt first, then I can apply architecture changes from this chat.';
}

const LAYER_ORDER = ['presentation', 'application', 'queue', 'data'];

function getLayerRank(layerId: string) {
  const rank = LAYER_ORDER.indexOf(layerId);
  return rank === -1 ? LAYER_ORDER.length : rank;
}

function isGatewayLike(node: any) {
  const text = `${node?.name || ''} ${node?.type || ''} ${node?.id || ''}`.toLowerCase();
  return /gateway|api|ingress|edge|cdn|proxy/.test(text);
}

function isLoadBalancerLike(node: any) {
  const text = `${node?.name || ''} ${node?.type || ''} ${node?.id || ''}`.toLowerCase();
  return /load\s*balancer|load-balancer|haproxy|nginx|alb|elb|balancer/.test(text);
}

function repairTechFlowConnections(bp: any, touchedNodeIds: string[] = []) {
  if (!bp?.layers || !bp?.steps) return { blueprint: bp, repairedNodeIds: [] as string[] };

  const nodeById = new Map<string, any>();
  const layerByNodeId = new Map<string, string>();

  bp.layers.forEach((layer: any) => {
    (layer.nodes || []).forEach((node: any) => {
      if (!node?.id) return;
      nodeById.set(node.id, node);
      layerByNodeId.set(node.id, layer.id);
    });
  });

  const repairedNodeIds = new Set<string>();
  const referencedNodeIds = new Set<string>();

  bp.steps = (bp.steps || []).map((step: any) => {
    const seen = new Set<string>();
    const involved_nodes = (step.involved_nodes || [])
      .filter((nodeId: string) => nodeById.has(nodeId))
      .filter((nodeId: string) => {
        if (seen.has(nodeId)) return false;
        seen.add(nodeId);
        referencedNodeIds.add(nodeId);
        return true;
      });

    return { ...step, involved_nodes };
  });

  const candidateNodeIds = Array.from(new Set([
    ...touchedNodeIds,
    ...Array.from(nodeById.keys()).filter((nodeId) => !referencedNodeIds.has(nodeId)),
  ])).filter((nodeId) => nodeById.has(nodeId));

  const insertIntoStep = (nodeId: string, shouldForceInsert: boolean) => {
    const node = nodeById.get(nodeId);
    const nodeLayer = layerByNodeId.get(nodeId) || '';
    const nodeRank = getLayerRank(nodeLayer);

    for (const step of bp.steps) {
      if (!Array.isArray(step.involved_nodes) || step.involved_nodes.length < 2) continue;
      if (step.involved_nodes.includes(nodeId) && !shouldForceInsert) return true;
      if (step.involved_nodes.includes(nodeId)) continue;

      for (let i = 0; i < step.involved_nodes.length - 1; i += 1) {
        const sourceId = step.involved_nodes[i];
        const targetId = step.involved_nodes[i + 1];
        const sourceNode = nodeById.get(sourceId);
        const targetNode = nodeById.get(targetId);
        const sourceRank = getLayerRank(layerByNodeId.get(sourceId) || '');
        const targetRank = getLayerRank(layerByNodeId.get(targetId) || '');
        const isBetweenLayers = sourceRank <= nodeRank && nodeRank <= targetRank;
        const isTrafficEntry = isLoadBalancerLike(node) && (isGatewayLike(sourceNode) || isGatewayLike(targetNode));
        const routesToApplication = isLoadBalancerLike(node) && (
          layerByNodeId.get(targetId) === 'application' ||
          layerByNodeId.get(sourceId) === 'presentation'
        );

        if (isTrafficEntry || routesToApplication || isBetweenLayers) {
          step.involved_nodes.splice(i + 1, 0, nodeId);
          repairedNodeIds.add(nodeId);
          return true;
        }
      }

      const lastId = step.involved_nodes[step.involved_nodes.length - 1];
      const lastRank = getLayerRank(layerByNodeId.get(lastId) || '');
      if (lastRank <= nodeRank) {
        step.involved_nodes.push(nodeId);
        repairedNodeIds.add(nodeId);
        return true;
      }
    }

    const upstream = Array.from(nodeById.values()).find((candidate) => {
      const rank = getLayerRank(layerByNodeId.get(candidate.id) || '');
      return candidate.id !== nodeId && rank <= nodeRank && (isGatewayLike(candidate) || rank === Math.max(0, nodeRank - 1));
    });
    const downstream = Array.from(nodeById.values()).find((candidate) => {
      const rank = getLayerRank(layerByNodeId.get(candidate.id) || '');
      return candidate.id !== nodeId && rank >= nodeRank && !isGatewayLike(candidate);
    });
    const involved_nodes = [upstream?.id, nodeId, downstream?.id].filter(Boolean);

    if (involved_nodes.length >= 2) {
      const nextNumber = Math.max(0, ...(bp.steps || []).map((step: any) => Number(step.number) || 0)) + 1;
      bp.steps.push({
        id: `step-${nextNumber}`,
        number: nextNumber,
        title: isLoadBalancerLike(node) ? `Route traffic through ${node.name || node.id}` : `Connect ${node.name || node.id}`,
        description: `TechFlow validation added this step so ${node.name || node.id} is connected to the architecture data path.`,
        involved_nodes,
      });
      repairedNodeIds.add(nodeId);
      return true;
    }

    return false;
  };

  candidateNodeIds.forEach((nodeId) => {
    const node = nodeById.get(nodeId);
    insertIntoStep(nodeId, isLoadBalancerLike(node));
  });

  bp.steps = (bp.steps || []).filter((step: any) => step.involved_nodes && step.involved_nodes.length > 1);

  return { blueprint: bp, repairedNodeIds: Array.from(repairedNodeIds) };
}

export function useGenerate(): UseGenerateReturn {
  const [blueprint, setBlueprint] = useState<WorkflowData | any | null>(null);
  const [resiliency, setResiliency] = useState<ResiliencyData | null>(null);
  const [scaleInfo, setScaleInfo] = useState<ScaleData | null>(null);
  const [promptInfo, setPromptInfo] = useState<PromptEngineerData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [activeStage, setActiveStage] = useState<ActiveStage>('IDLE');
  const [logs, setLogs] = useState<string[]>([]);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>({ promptTokens: 0, completionTokens: 0, totalTokens: 0 });
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [newlyModifiedNodeIds, setNewlyModifiedNodeIds] = useState<string[]>([]);
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);
  const [checkedDoD, setCheckedDoD] = useState<Record<string, boolean>>({});
  const [backendStack, setBackendStack] = useState<string>('');
  const [showStackSelector, setShowStackSelector] = useState<boolean>(false);

  // Keep blueprint ref for use inside async streaming (avoids stale closure)
  const blueprintRef = useRef<any>(null);
  const pendingBlueprintRef = useRef<any>(null);
  const pendingLanguageRef = useRef<'th' | 'en'>('en');

  const addLog = useCallback((text: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${text}`]);
  }, []);

  const addTokens = useCallback((prompt: number, completion: number) => {
    setTokenUsage((prev) => ({
      promptTokens: prev.promptTokens + prompt,
      completionTokens: prev.completionTokens + completion,
      totalTokens: prev.totalTokens + prompt + completion,
    }));
  }, []);

  /* ─── Real Telemetry Analyser (Parallel Background Execution) ─── */
  const triggerTelemetryInsights = useCallback(
    async (
      bp: any,
      language: 'th' | 'en',
      currentBackendStack?: string,
      onBroadcast?: (bp: any, res: ResiliencyData | null, scale: ScaleData | null) => void
    ) => {
      if (!bp) return;

      setActiveStage('RESILIENCY');
      addLog(
        language === 'th'
          ? '✦ กำลังทำงาน Resiliency Agent วิเคราะห์ความเสี่ยงและโครงสร้างการเชื่อมต่อ...'
          : '✦ Invoking Resiliency Agent to analyze single points of failure & step flows...'
      );

      try {
        // Prepare parallel network calls to real background LLM agents
        const resiliencyPromise = fetch('/api/analyze-resiliency', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blueprint: bp, language }),
        }).then(async (res) => {
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Resiliency Agent API error');
          }
          return res.json();
        });

        const scalePromise = fetch('/api/analyze-scale', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blueprint: bp, prompt: bp.title || '', language, backendStack: currentBackendStack }),
        }).then(async (res) => {
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Scale Agent API error');
          }
          return res.json();
        });

        // Run background agents concurrently in parallel threads
        const [resiliencyData, scaleData] = await Promise.all([
          resiliencyPromise,
          scalePromise
        ]);

        setResiliency(resiliencyData);
        addLog(
          language === 'th'
            ? '✦ ตรวจสอบความปลอดภัยและประเภทเส้นทางข้อมูล (Sync/Async) สำเร็จ!'
            : '✦ System dependencies and synchronous/asynchronous paths analyzed successfully!'
        );

        setActiveStage('SCALE');
        setScaleInfo(scaleData);
        addLog(
          language === 'th'
            ? '✦ คาดการณ์ขนาดเครื่องเซิร์ฟเวอร์, งบประมาณ และวิเคราะห์ตัวชี้วัดประสิทธิภาพสำเร็จ!'
            : '✦ Hardware concurrent load estimates and tuned configuration profiles loaded!'
        );

        setIsGenerating(false);
        setActiveStage('IDLE');

        onBroadcast?.(bp, resiliencyData, scaleData);
      } catch (err: any) {
        console.error('Parallel background execution failure:', err);
        addLog(`ERR: ${err.message || 'Parallel background agents failed'}`);
        setIsGenerating(false);
        setActiveStage('IDLE');
      }
    },
    [addLog]
  );

  const selectStackAndAnalyze = useCallback(
    async (stackId: string, customBlueprint?: any) => {
      setBackendStack(stackId);
      setShowStackSelector(false);
      
      const targetBlueprint = customBlueprint || pendingBlueprintRef.current || blueprintRef.current;
      if (!targetBlueprint) {
        addLog(pendingLanguageRef.current === 'th' ? '❌ ไม่พบข้อมูลสถาปัตยกรรมที่จะประมวลผล' : '❌ No architecture blueprint found for analysis.');
        return;
      }
      
      setIsGenerating(true);
      await triggerTelemetryInsights(targetBlueprint, pendingLanguageRef.current || 'en', stackId);
    },
    [triggerTelemetryInsights, addLog]
  );

  /* ─── Primary generate handler ─── */
  const handleGenerate = useCallback(
    async ({ prompt, language }: { prompt: string; language: 'th' | 'en' }) => {
      if (!prompt.trim() || isGenerating) return;

      setIsGenerating(true);
      setBlueprint(null);
      blueprintRef.current = null;
      setResiliency(null);
      setScaleInfo(null);
      setPromptInfo(null);
      setChatHistory([]);
      setLogs([]);
      setActiveStage('BLUEPRINT');
      setActivePhaseIndex(0);
      setCheckedDoD({});

      addLog(
        language === 'th'
          ? `✦ เริ่มต้นวิเคราะห์โจทย์และออกระบบสถาปัตยกรรมด้วย Blueprint Agent: "${prompt}"`
          : `✦ Initiating system architecture synthesis via Blueprint Agent: "${prompt}"`
      );

      const loggedNodeIds = new Set<string>();

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, language }),
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          throw new Error(errJson.error || `Connection failed. Error ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let textAccumulator = '';
        let buffer = '';

        if (!reader) throw new Error('Could not initialize Stream Reader.');

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const cleaned = line.trim();
            if (!cleaned || cleaned === 'data: [DONE]') continue;
            if (cleaned.startsWith('data: ')) {
              try {
                const data = JSON.parse(cleaned.substring(6));
                if (data.text) {
                  textAccumulator += data.text;
                  const repaired = parsePartialJson(textAccumulator) as any;
                  if (repaired) {
                    setBlueprint(repaired);
                    blueprintRef.current = repaired;

                    if (repaired.layers && Array.isArray(repaired.layers)) {
                      repaired.layers.forEach((layer: any) => {
                        if (layer?.nodes && Array.isArray(layer.nodes)) {
                          layer.nodes.forEach((node: any) => {
                            if (node?.id && !loggedNodeIds.has(node.id)) {
                              loggedNodeIds.add(node.id);
                              addLog(
                                `✦ [${layer.name || layer.id.toUpperCase()}] Adding Node: ${node.name || node.id} (${node.type || 'Service'})`
                              );
                            }
                          });
                        }
                      });
                    }
                  }
                }
                if (data.usage) {
                  addTokens(data.usage.promptTokens || 0, data.usage.completionTokens || 0);
                }
              } catch {
                // ignore partial line parse errors
              }
            }
          }
        }

        addLog(
          language === 'th'
            ? '✦ โครงสร้างระบบสว่างขึ้นบน Canvas แล้ว! กรุณาเลือก Backend Stack เพื่อทำการจูนระบบและวิเคราะห์ขนาดเครื่องสืบต่อ...'
            : '✦ Core blueprint parsing completed! Please choose a Backend Stack to run load scaling & optimizations...'
        );

        const finalBlueprint = blueprintRef.current || parsePartialJson(textAccumulator);
        pendingLanguageRef.current = language;

        if (!backendStack) {
          pendingBlueprintRef.current = finalBlueprint;
          setShowStackSelector(true);
          setIsGenerating(false);
          setActiveStage('IDLE');
        } else {
          await triggerTelemetryInsights(finalBlueprint, language, backendStack);
        }
      } catch (err: any) {
        console.error(err);
        addLog(`ERR: ${err.message}`);
        setIsGenerating(false);
        setActiveStage('IDLE');
      }
    },
    [isGenerating, backendStack, addLog, addTokens, triggerTelemetryInsights]
  );

  /* ─── Chat modification handler ─── */
  const handleChatMessage = useCallback(
    async (
      chatText: string,
      { blueprint: currentBlueprint, language }: { prompt: string; blueprint: any; language: 'th' | 'en' }
    ) => {
      if (!chatText.trim() || isGenerating) return;

      const isEditRequest = isBlueprintEditRequest(chatText);

      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content: chatText,
        intent: isEditRequest ? 'modify' : 'qa',
        timestamp: new Date().toISOString(),
      };
      setChatHistory((prev) => [...prev, userMsg]);
      setIsGenerating(true);
      setActiveStage(isEditRequest && currentBlueprint ? 'BLUEPRINT' : 'IDLE');

      try {
        if (!currentBlueprint) {
          if (isEditRequest) {
            const assistantMsg: ChatMessage = {
              id: `msg-${Date.now()}-needs-blueprint`,
              role: 'assistant',
              content: getNeedsBlueprintMessage(language),
              intent: 'qa',
              timestamp: new Date().toISOString(),
            };
            setChatHistory((prev) => [...prev, assistantMsg]);
            return;
          }

          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: chatText, blueprint: null, language }),
          });

          if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(errorBody.error || 'Chat assistant route returned failure');
          }

          const pTokens = parseInt(response.headers.get('X-Prompt-Tokens') || '0');
          const cTokens = parseInt(response.headers.get('X-Completion-Tokens') || '0');
          if (pTokens || cTokens) addTokens(pTokens, cTokens);

          const data: { answer: string } = await response.json();
          const assistantMsg: ChatMessage = {
            id: `msg-${Date.now()}-qa`,
            role: 'assistant',
            content: data.answer,
            intent: 'qa',
            timestamp: new Date().toISOString(),
          };
          setChatHistory((prev) => [...prev, assistantMsg]);
          return;
        }

        if (!isEditRequest) {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: chatText, blueprint: currentBlueprint, language }),
          });

          if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(errorBody.error || 'Chat assistant route returned failure');
          }

          const pTokens = parseInt(response.headers.get('X-Prompt-Tokens') || '0');
          const cTokens = parseInt(response.headers.get('X-Completion-Tokens') || '0');
          if (pTokens || cTokens) addTokens(pTokens, cTokens);

          const data: { answer: string } = await response.json();
          const assistantMsg: ChatMessage = {
            id: `msg-${Date.now()}-qa`,
            role: 'assistant',
            content: data.answer,
            intent: 'qa',
            timestamp: new Date().toISOString(),
          };
          setChatHistory((prev) => [...prev, assistantMsg]);
          return;
        }

        const response = await fetch('/api/modify-blueprint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blueprint: currentBlueprint, prompt: chatText, language }),
        });

        if (response.ok) {
          const pTokens = parseInt(response.headers.get('X-Prompt-Tokens') || '0');
          const cTokens = parseInt(response.headers.get('X-Completion-Tokens') || '0');
          if (pTokens || cTokens) addTokens(pTokens, cTokens);

          const patch: ChatModification = await response.json();

          // Deep copy state object to ensure thread safety and avoid state mutations
          const next = JSON.parse(JSON.stringify(currentBlueprint));
          if (!next.layers) next.layers = [];
          if (!next.steps) next.steps = [];

          const removeSet = new Set(patch.modifications.nodes_to_remove || []);

          // 1. Process removals
          if (removeSet.size > 0) {
            next.layers = next.layers.map((layer: any) => ({
              ...layer,
              nodes: (layer.nodes || []).filter((node: any) => !removeSet.has(node.id)),
            }));

            // Clean up involved_nodes inside steps dynamically to prevent orphaned references
            next.steps = (next.steps || []).map((step: any) => ({
              ...step,
              involved_nodes: (step.involved_nodes || []).filter((nodeId: string) => !removeSet.has(nodeId)),
            }));
          }

          // 2. Process additions & updates
          if (patch.modifications.nodes_to_add_or_update?.length > 0) {
            const modifiedIds: string[] = [];
            patch.modifications.nodes_to_add_or_update.forEach((modNode: any) => {
              modifiedIds.push(modNode.node_id);

              // Find or create layer
              let layer = next.layers.find((l: any) => l.id === modNode.layer_id);
              if (!layer) {
                layer = {
                  id: modNode.layer_id,
                  name: modNode.layer_id.toUpperCase(),
                  nodes: [],
                };
                next.layers.push(layer);
              }

              if (!layer.nodes) layer.nodes = [];
              const nodeIdx = layer.nodes.findIndex((n: any) => n.id === modNode.node_id);
              const updatedNode = {
                id: modNode.node_id,
                name: modNode.node_name,
                type: modNode.type,
                description: modNode.description,
              };

              if (nodeIdx > -1) {
                layer.nodes[nodeIdx] = updatedNode;
              } else {
                // Ensure node is not duplicated across other layers
                next.layers.forEach((l: any) => {
                  if (l.id !== modNode.layer_id && l.nodes) {
                    l.nodes = l.nodes.filter((n: any) => n.id !== modNode.node_id);
                  }
                });
                layer.nodes.push(updatedNode);
              }
            });

            // Triggers green neon flashing styling
            setNewlyModifiedNodeIds(modifiedIds);
            setTimeout(() => {
              setNewlyModifiedNodeIds([]);
            }, 4000);
          }

          // 3. Process steps updated
          if (patch.modifications.steps_updated?.length > 0) {
            patch.modifications.steps_updated.forEach((updatedStep: any) => {
              const stepIdx = next.steps.findIndex((s: any) => s.number === updatedStep.step_number);
              const newStep = {
                id: `step-${updatedStep.step_number}`,
                number: updatedStep.step_number,
                title: updatedStep.title,
                description: updatedStep.description,
                involved_nodes: (updatedStep.involved_nodes || []).filter((nodeId: string) => !removeSet.has(nodeId)),
              };
              if (stepIdx > -1) {
                next.steps[stepIdx] = newStep;
              } else {
                next.steps.push(newStep);
              }
            });
          }

          // 4. Process steps to remove
          if (patch.modifications.steps_to_remove && patch.modifications.steps_to_remove.length > 0) {
            const stepsToRemoveSet = new Set(patch.modifications.steps_to_remove);
            next.steps = next.steps.filter((s: any) => !stepsToRemoveSet.has(s.number));
          }

          // 5. Clean up steps with no active involved nodes remaining
          next.steps = next.steps.filter((s: any) => s.involved_nodes && s.involved_nodes.length > 0);

          // 6. TechFlow validation pass: ensure newly touched/orphaned nodes are wired into steps.
          const repairResult = repairTechFlowConnections(
            next,
            patch.modifications.nodes_to_add_or_update?.map((modNode: any) => modNode.node_id) || []
          );
          const repairedNodeIds = repairResult.repairedNodeIds;

          // 7. Sequential sorting and dynamic re-indexing of step indexes
          next.steps.sort((a: any, b: any) => a.number - b.number);
          next.steps.forEach((step: any, idx: number) => {
            const newNum = idx + 1;
            step.number = newNum;
            step.id = `step-${newNum}`;
          });

          setBlueprint(next);
          blueprintRef.current = next;

          const assistantMsg: ChatMessage = {
            id: `msg-${Date.now()}-ai`,
            role: 'assistant',
            content: repairedNodeIds.length > 0
              ? `${patch.explanation}\n\nTechFlow Inspector: validated and connected ${repairedNodeIds.join(', ')} into the data path.`
              : patch.explanation,
            intent: 'modify',
            timestamp: new Date().toISOString(),
          };
          setChatHistory((prev) => [...prev, assistantMsg]);

          pendingLanguageRef.current = language;
          if (!backendStack) {
            pendingBlueprintRef.current = next;
            setShowStackSelector(true);
          } else {
            await triggerTelemetryInsights(next, language, backendStack);
          }
        } else {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.error || 'Blueprint modification route returned failure');
        }
      } catch (err: any) {
        console.error('Failed to process chat message:', err);
        setChatHistory((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-err`,
            role: 'assistant',
            content:
              language === 'th'
                ? 'เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อปรับปรุงดีไซน์ระบบ'
                : `Failed to process chat message: ${err.message || 'Unknown error'}`,
            intent: 'error',
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsGenerating(false);
        setActiveStage('IDLE');
      }
    },
    [isGenerating, backendStack, addTokens, triggerTelemetryInsights]
  );

  /* ─── Reverse engineering handler ─── */
  const handleReverseEngineer = useCallback(
    async (
      payload: { zipBase64?: string; repoUrl?: string },
      { language }: { language: 'th' | 'en' }
    ) => {
      setIsGenerating(true);
      setBlueprint(null);
      blueprintRef.current = null;
      setResiliency(null);
      setScaleInfo(null);
      setPromptInfo(null);
      setChatHistory([]);
      setLogs([]);
      setActiveStage('BLUEPRINT');
      setActivePhaseIndex(0);
      setCheckedDoD({});

      addLog(payload.repoUrl ? `Cloning public GitHub tree: ${payload.repoUrl}` : 'Extracting uploaded Project files...');

      try {
        const response = await fetch('/api/reverse-engineer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, language }),
        });

        if (response.ok) {
          const pTokens = parseInt(response.headers.get('X-Prompt-Tokens') || '0');
          const cTokens = parseInt(response.headers.get('X-Completion-Tokens') || '0');
          if (pTokens || cTokens) addTokens(pTokens, cTokens);

          const data = await response.json();
          const parsedBp = data.blueprint;

          setBlueprint(parsedBp);
          blueprintRef.current = parsedBp;
          addLog(data.explanation || 'Project analysis completed successfully!');

          pendingLanguageRef.current = language;
          if (!backendStack) {
            pendingBlueprintRef.current = parsedBp;
            setShowStackSelector(true);
          } else {
            setTimeout(() => {
              triggerTelemetryInsights(parsedBp, language, backendStack);
            }, 1000);
          }
        } else {
          throw new Error('Reverse engineering server route failure.');
        }
      } catch (err: any) {
        console.error(err);
        addLog(`ERR: ${err.message}`);
      } finally {
        setIsGenerating(false);
        setActiveStage('IDLE');
      }
    },
    [addLog, addTokens, backendStack, triggerTelemetryInsights]
  );

  /* ─── Apply preset handler (Standard system architectures instead of website layouts) ─── */
  const handleApplyPreset = useCallback(
    (
      preset: any,
      {
        blueprint: currentBp,
        resiliency: currentRes,
        scaleInfo: currentScale,
        language,
        onBroadcast,
      }: {
        blueprint: any;
        resiliency: ResiliencyData | null;
        scaleInfo: ScaleData | null;
        language: 'th' | 'en';
        onBroadcast?: (bp: any, res: any, scale: any) => void;
      }
    ) => {
      // Create robust default system design if none exists
      setPromptInfo(null);
      setActivePhaseIndex(0);
      setCheckedDoD({});
      let updatedBlueprint = currentBp;
      if (!updatedBlueprint) {
        updatedBlueprint = {
          title: language === 'th' ? 'ระบบจองตั๋วคอนเสิร์ต 1M Users' : '1M Users Ticket Ingestion Engine',
          description: language === 'th' 
            ? 'สถาปัตยกรรมจองตั๋วคอนเสิร์ตรองรับผู้ใช้งานหลักล้านคนด้วย Ingestion Queue และ Caching layers' 
            : 'Production-ready concert ticketing architecture utilizing Kafka, Redis buffers, and dynamic CDN gateways.',
          layers: [
            {
              id: 'presentation',
              name: language === 'th' ? 'เกตเวย์รับส่งข้อมูล (Client Gateways)' : 'Client Gateways',
              nodes: [
                { id: 'cdn-cloudflare', name: 'Cloudflare CDN', type: 'CDN', description: 'Caches static elements & filters DDoS requests.' },
                { id: 'nginx-ingress', name: 'Nginx API Ingress', type: 'API Gateway', description: 'Routes paths to backing microservices.' }
              ]
            },
            {
              id: 'application',
              name: language === 'th' ? 'บริการประมวลผล (Core Microservices)' : 'Core Services',
              nodes: [
                { id: 'auth-service', name: 'Auth & Session Service', type: 'Microservice', description: 'Validates JWT sessions in high-performance Go.' },
                { id: 'booking-service', name: 'Ticket Booking Service', type: 'Microservice', description: 'Ingests reservations and passes to queues.' }
              ]
            },
            {
              id: 'queue',
              name: language === 'th' ? 'คิวงานระบบหลังบ้าน (Ingestion Queues)' : 'Message Brokers',
              nodes: [
                { id: 'kafka-ingest', name: 'Kafka Ingestion Pipeline', type: 'Message Broker', description: 'Buffers requests to protect databases from spikes.' }
              ]
            },
            {
              id: 'data',
              name: language === 'th' ? 'ฐานข้อมูลหลัก (Databases & Cache)' : 'Databases & Cache',
              nodes: [
                { id: 'redis-cache', name: 'Redis Cache Layer', type: 'Cache', description: 'Stores inventory maps and seat status.' },
                { id: 'postgres-db', name: 'PostgreSQL DB Primary', type: 'Relational DB', description: 'Stores transaction details with ACID compliance.' }
              ]
            }
          ],
          steps: [
            { id: 'step-1', number: 1, title: 'DNS & Static Request', description: 'User hits browser, requests loaded from Cloudflare CDN', involved_nodes: ['cdn-cloudflare'] },
            { id: 'step-2', number: 2, title: 'Submit Booking Payload', description: 'Submit purchase info via Nginx Ingress to Go Booking Microservice', involved_nodes: ['nginx-ingress', 'auth-service', 'booking-service'] },
            { id: 'step-3', number: 3, title: 'Deduct Seats Cache', description: 'Service checks availability and locks seat inside Redis', involved_nodes: ['booking-service', 'redis-cache'] },
            { id: 'step-4', number: 4, title: 'Publish Reservation Queue', description: 'Message queued into Kafka cluster to buffer DB writing', involved_nodes: ['booking-service', 'kafka-ingest'] },
            { id: 'step-5', number: 5, title: 'Persist DB Write', description: 'DB worker processes messages from Kafka and updates PG primary database', involved_nodes: ['kafka-ingest', 'postgres-db'] }
          ]
        };
      }

      setBlueprint(updatedBlueprint);
      blueprintRef.current = updatedBlueprint;
      addLog(language === 'th' ? `ประยุกต์ใช้ระบบจองตั๋วสำเร็จ!` : `Successfully loaded system architecture blueprint preset!`);
      
      pendingLanguageRef.current = language;
      if (!backendStack) {
        pendingBlueprintRef.current = updatedBlueprint;
        setShowStackSelector(true);
      } else {
        setTimeout(() => {
          triggerTelemetryInsights(updatedBlueprint, language, backendStack, onBroadcast);
        }, 500);
      }
    },
    [addLog, backendStack, triggerTelemetryInsights]
  );

  const handleGeneratePrompts = useCallback(
    async (language: 'th' | 'en', customAnswers?: Record<string, string>) => {
      if (!blueprint || isGeneratingPrompts) return;

      setIsGeneratingPrompts(true);
      setActiveStage('PROMPTS');
      addLog(
        language === 'th'
          ? '✦ กำลังเริ่มเรียก Prompt Engineer Agent เพื่อสร้างพิมพ์เขียวโค้ดของแต่ละเฟส...'
          : '✦ Invoking Prompt Engineer Agent to compile code blueprint instructions for each phase...'
      );

      try {
        const response = await fetch('/api/generate-prompts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blueprint, scaleInfo, language, answers: customAnswers }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || 'Prompt Engineer Agent API error');
        }

        const data = await response.json();
        setPromptInfo(data);
        setActivePhaseIndex(0);
        setCheckedDoD({});
        addLog(
          language === 'th'
            ? '✦ เจนเนอเรตคำสั่งโค้ดสำหรับแต่ละเฟส (Prompt Workspace) สำเร็จเรียบร้อย!'
            : '✦ Phase-by-phase copiable instructions (Prompt Workspace) successfully compiled!'
        );
        
        const pTokens = parseInt(response.headers.get('X-Prompt-Tokens') || '0');
        const cTokens = parseInt(response.headers.get('X-Completion-Tokens') || '0');
        if (pTokens || cTokens) {
          addTokens(pTokens, cTokens);
        }
      } catch (err: any) {
        console.error('Failed to generate prompts:', err);
        addLog(`ERR: ${err.message || 'Prompt Engineer Agent failed'}`);
      } finally {
        setIsGeneratingPrompts(false);
        setActiveStage('IDLE');
      }
    },
    [blueprint, scaleInfo, isGeneratingPrompts, addLog, addTokens]
  );

  return {
    blueprint, setBlueprint,
    resiliency, setResiliency,
    scaleInfo, setScaleInfo,
    promptInfo, setPromptInfo,
    isGenerating,
    isGeneratingPrompts,
    activeStage,
    logs,
    addLog,
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
  };
}
