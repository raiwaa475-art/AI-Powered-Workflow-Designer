export interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  description: string;
  // Extensibility for React Flow coordinates in Phase 2
  x?: number;
  y?: number;
}

export interface WorkflowLayer {
  id: string; // "presentation" | "application" | "queue" | "data"
  name: string;
  nodes: WorkflowNode[];
}

export interface WorkflowStep {
  id: string;
  number: number;
  title: string;
  description: string;
  involved_nodes: string[]; // Node IDs
}

export interface WorkflowData {
  title: string;
  description: string;
  layers: WorkflowLayer[];
  steps: WorkflowStep[];
}

// Resiliency Agent output types (Endpoint A)
export interface NodeRisk {
  node_id: string;
  risk_level: 'HIGH' | 'MEDIUM' | 'LOW';
  risk_title: string;
  solution: string;
}

export interface StepFlow {
  step_number: number;
  flow_type: 'sync' | 'async' | 'event';
  technical_protocol: 'HTTP' | 'gRPC' | 'AMQP' | 'Websocket' | string;
}

export interface ResiliencyData {
  node_risks: NodeRisk[];
  step_flows: StepFlow[];
}

// Scale & Optimization Agent output types (Endpoint B)
export interface LoadEstimate {
  tier: string; // "Small" | "Medium" | "Large"
  concurrent_users: string;
  requests_per_second: string;
  server_spec: string;
}

export interface DeployStage {
  stage: string; // "Stage 1" | "Stage 2" | "Stage 3"
  title: string;
  pros: string[];
  cons: string[];
  estimated_cost: string;
  roadmap?: string;
}

export interface OptimizationConfigs {
  nginx: string;
  postgres: string;
  redis: string;
}

export interface ScaleData {
  load_estimates: LoadEstimate[];
  deploy_stages: DeployStage[];
  optimization_configs: OptimizationConfigs;
  monitoring_checklist: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  graphState?: {
    blueprint: WorkflowData;
    resiliency: ResiliencyData | null;
    scaleInfo: ScaleData | null;
    promptEngineerInfo?: PromptEngineerData | null;
  };
}

export interface SavedSession {
  id: string;
  title: string;
  timestamp: number;
  prompt: string;
  language: 'th' | 'en';
  blueprint: WorkflowData;
  resiliency: ResiliencyData | null;
  scaleInfo: ScaleData | null;
  promptEngineerInfo?: PromptEngineerData | null;
  chatHistory: ChatMessage[];
  techStack?: string;
  activePhaseIndex?: number;
  checkedDoD?: Record<string, boolean>;
}

export interface ChatModification {
  explanation: string;
  modifications: {
    nodes_to_add_or_update: Array<{
      node_id: string;
      layer_id: 'presentation' | 'application' | 'queue' | 'data' | string;
      node_name: string;
      description: string;
      type: string;
    }>;
    nodes_to_remove: string[];
    steps_updated: Array<{
      step_number: number;
      title: string;
      description: string;
      involved_nodes: string[];
    }>;
    steps_to_remove?: number[];
  };
}

export interface IaCCodeResponse {
  explanation: string;
  files: Record<string, string>;
}

export interface CollabUser {
  id: string;
  username: string;
  color: string;
  cursor?: { x: number; y: number };
  isPresenter?: boolean;
}

export interface CollabMessage {
  type: 'user_list' | 'user_join' | 'user_leave' | 'cursor_move' | 'node_drag' | 'graph_update' | 'playback_sync';
  senderId?: string;
  payload: any;
}

export interface ReverseEngineerResponse {
  explanation: string;
  blueprint: WorkflowData;
}

// --- Web UI/UX & Background Design Pivot Types ---
export interface WebDesignTheme {
  styleName: 'glassmorphism' | 'minimalism' | 'neobrutalism' | 'bento-grid' | string;
  backgroundCss: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  cardBackground: string;
}

export interface WebDesignTypography {
  headingFont: string;
  bodyFont: string;
  importUrl: string;
}

export interface WebDesignSection {
  id: string;
  type: 'navigation' | 'hero' | 'features' | 'gallery' | 'cta' | 'footer' | string;
  title: string;
  description: string;
  ctaText?: string;
  layout: 'centered' | 'split' | 'grid' | 'stack' | string;
  features?: string[];
}

export interface WebDesignData {
  title: string;
  description: string;
  theme: WebDesignTheme;
  typography: WebDesignTypography;
  sections: WebDesignSection[];
}

// --- Prompt Engineer Agent & Prompt Workspace Types ---
export interface PromptPhase {
  phase_number: number;
  title: string;
  description: string;
  target_nodes: string[];
  ai_role: string;
  ai_instructions_prompt: string;
  definition_of_done: string[];
}

export interface PromptEngineerData {
  explanation: string;
  phases: PromptPhase[];
}


