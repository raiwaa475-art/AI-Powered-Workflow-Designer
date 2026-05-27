<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AI Multi-Agent Orchestration & Context Guide

This document describes the behaviors, boundaries, prompting guidelines, and data schemas of the specialized AI Agents operating within this system.

---

## 🤖 The Multi-Agent Ecosystem

The application coordinates six distinct AI agents, dividing architecture parsing, risk analysis, load sizing, infrastructure generation, codebase reverse-engineering, and progressive prompt compiling into dedicated pipelines. The entire experience is visualized across three distinct visual workspaces (Business Flow, Tech Topology, and Live Simulation).

```mermaid
graph TD
    User([User Prompt / GitHub Link / ZIP]) -->|Input| App[Next.js App Engine]
    App -->|Trigger| BlueprintAgent[1. Blueprint Agent]
    BlueprintAgent -->|Generates JSON| Workspace[Workspace App Engine]
    
    Workspace -->|Interception Step| StackSelector[🛒 Backend Stack Selector Modal]
    StackSelector -->|Selected Stack Context| ResiliencyAgent[2. Resiliency Agent]
    StackSelector -->|Selected Stack & Blueprint| ScaleAgent[3. Scale Agent]

    Workspace -->|Tab 1: Business Flow| BusinessCanvas[📊 Business Flow Canvas]
    Workspace -->|Tab 2: Tech Topology| TechCanvas[📦 Tech Topology Canvas]
    Workspace -->|Tab 3: Live Simulation| SimCanvas[🔄 Live Simulation Canvas]
    
    ResiliencyAgent -->|Risks & Step Flows| TechCanvas
    ResiliencyAgent -->|Step Flows| SimCanvas
    ScaleAgent -->|Load Dashboards / Stack-Tuned Configs| ScaleTab[Scale & Optimize View]
    DevOpsAgent -->|IaC File Tree| CodeTab[Code Workspace View]
    RevEngAgent -->|Synthesized JSON| BusinessCanvas
    RevEngAgent -->|Synthesized JSON| TechCanvas
    PromptAgent -->|Copyable MD Prompts| PromptTab[Prompt Workspace View]
```

---

## 📑 Agent Data Schemas & Prompting Rules

### 1. Blueprint Agent (`/api/generate` & `/api/modify-blueprint`)
* **Role**: Generates and modifies the Core 4-Tier Architecture layout.
* **Schema Contract (`/api/generate`)**:
```json
{
  "title": "string (Clean, professional system title)",
  "description": "string (System overview, technology decisions)",
  "layers": [
    {
      "id": "presentation" | "application" | "queue" | "data",
      "name": "string (Layer Title, e.g. Client Tier, Core Services)",
      "nodes": [
        {
          "id": "string (unique-kebab-case-id)",
          "name": "string (e.g. Booking API Gateway)",
          "type": "string (e.g. Node.js Express, Kafka, PostgreSQL)",
          "description": "string (Brief role description)"
        }
      ]
    }
  ],
  "steps": [
    {
      "id": "string (step-1)",
      "number": 1,
      "title": "string (Step title)",
      "description": "string (Data flow interaction)",
      "involved_nodes": ["string (involved node IDs)"]
    }
  ]
}
```
* **Schema Contract (`/api/modify-blueprint`)**:
```json
{
  "explanation": "string (Concise summary of changes made)",
  "modifications": {
    "nodes_to_add_or_update": [
      {
        "node_id": "string (unique-kebab-case-id)",
        "layer_id": "presentation" | "application" | "queue" | "data",
        "node_name": "string (e.g., MongoDB Atlas)",
        "description": "string (Service role description)",
        "type": "string (e.g., NoSQL DB)"
      }
    ],
    "nodes_to_remove": ["string (IDs of deleted nodes)"],
    "steps_updated": [
      {
        "step_number": 1,
        "title": "string (Action step title)",
        "description": "string (Step data flow interaction)",
        "involved_nodes": ["string (involved node IDs)"]
      }
    ],
    "steps_to_remove": [1]
  }
}
```

### 2. Resiliency & Security Agent (`/api/analyze-resiliency`)
* **Role**: Scans nodes for SPOFs, assesses security, and classifies step communication types.
* **Schema Contract**:
```json
{
  "node_risks": [
    {
      "node_id": "string (matches exact ID of a node in the blueprint)",
      "risk_level": "HIGH" | "MEDIUM" | "LOW",
      "risk_title": "string (Concise title of risk)",
      "solution": "string (Specific architectural or security solution)"
    }
  ],
  "step_flows": [
    {
      "step_number": 1,
      "flow_type": "sync" | "async" | "event",
      "technical_protocol": "HTTP" | "gRPC" | "AMQP" | "Websocket"
    }
  ]
}
```

### 3. Scale & Performance Agent (`/api/analyze-scale`)
* **Role**: Calculates load capability profiles (Small, Medium, Large tiers), cloud monthly budgets, and server-tuning scripts tailored specifically for the selected language stack.
* **Payload Parameters**:
  * `blueprint`: Workflow JSON blueprint
  * `prompt`: User architecture prompt
  * `language`: `'th'` | `'en'`
  * `backendStack`: `'go-gin'` | `'node-express'` | `'python-fastapi'` | `'java-springboot'` | `'csharp-netcore'` (Determines parameter tuning algorithms)
* **Schema Contract**:
```json
{
  "load_estimates": [
    {
      "tier": "Small" | "Medium" | "Large",
      "concurrent_users": "string",
      "requests_per_second": "string",
      "server_spec": "string"
    }
  ],
  "deploy_stages": [
    {
      "stage": "string (Stage 1 / Stage 2 / Stage 3)",
      "title": "string (Stage title)",
      "estimated_cost": "string",
      "pros": ["string"],
      "cons": ["string"],
      "roadmap": "string"
    }
  ],
  "optimization_configs": {
    "redis": "string (Redis configuration script custom-tuned for stack-specific drivers/use cases)",
    "nginx": "string (Nginx proxy/gateway configuration optimized for Go Gin, Node Express, FastAPI, Tomcat, Kestrel)",
    "postgres": "string (SQL PostgreSQL parameter statement configurations tuned for pool drivers like sql.DB, pg-pool, SQLAlchemy, HikariCP, EF Core)"
  },
  "monitoring_checklist": ["string"]
}
```

### 4. DevOps Agent (`/api/generate-infrastructure-code`)
* **Role**: Generates functional, real IaC configurations and application boilerplate codes in the selected language stack (Go, Node.js, Python) and deployment runtime (Docker Compose, Kubernetes, Terraform).
* **Schema Contract**:
```json
{
  "explanation": "string (Architectural guide to directories, port mappings, and setup steps)",
  "files": {
    "docker-compose.yml": "string (YAML orchestration config for all system nodes)",
    "nginx.conf": "string (Detailed Nginx reverse proxy/gateway config)",
    "src/README.md": "string (Comprehensive setup, healthcheck, and verification guide)"
  }
}
```

### 5. Reverse Engineering Agent (`/api/reverse-engineer`)
* **Role**: Reconstructs diagram graphs from codebase structural analyses (ZIP static uploads or public GitHub recursive trees).
* **Process**: Scans `package.json`, `requirements.txt`, `go.mod`, `docker-compose.yml`, and `README.md` to extract dependencies, then formats the output into the **Blueprint Agent JSON Schema**.

### 6. Prompt Engineer Agent (`/api/generate-prompts`)
* **Role**: Slices designed blueprints and scaling context into at least 3 progressive development phases. Writes high-fidelity copyable Markdown prompts (with step-by-step target isolation and guardrails) for downstream AIs, accompanied by interactive Definition of Done (DoD) checklists.
* **Schema Contract**:
```json
{
  "explanation": "string (Development strategic overview)",
  "phases": [
    {
      "phase_number": number (e.g. 1),
      "title": "string (Phase title, e.g. Schema Setup)",
      "description": "string (Phase technical focus)",
      "target_nodes": ["string (Involved node IDs)"],
      "ai_role": "string (Downstream AI target persona)",
      "ai_instructions_prompt": "string (Comprehensive, detailed Markdown prompt for downstream generation)",
      "definition_of_done": ["string (Checklist verification items)"]
    }
  ]
}
```

---

## 💡 AI Prompt Engineering & Orchestration Guidelines

* **Keep Schemas Strict**: Ensure all API handlers specify `response_format: { type: "json_object" }` (for OpenAI/DeepSeek) or enforce JSON formatting instructions in the system prompt.
* **Secure Cookie Authentication**: Credentials and non-mock provider session settings are stored securely inside HttpOnly cookies via `getProviderConfig(req)` rather than request bodies to safeguard sensitive API keys from browser-side JavaScript access.
* **Unified LLM Orchestration Client**: All non-streaming LLM requests utilize `callLLM(opts)` while streaming LLM requests utilize `streamLLM(opts)` from `src/lib/llmClient.ts`.
  * **SSE Streaming & Usage Telemetry**: `streamLLM` handles SSE chunks dynamically across OpenAI, Anthropic, and DeepSeek, automatically parsing token usages and emitting standard text delta packets to the client.
  * **JSON Self-Correction Repair Loop**: If output JSON fails to parse during SSE closing, the client runs a 2-stage JSON repair + re-prompt self-correction loop using `jsonrepair` and non-streaming reprompts before closing the response stream.
  * **Robust Non-Streaming JSON Validation & Repair**: `callLLM` incorporates a multi-stage validation and self-repair pipeline using `jsonrepair` and fallback brace/bracket balancing algorithms when `jsonMode` is enabled. This protects non-streaming API endpoints (e.g. Scaling, Resiliency, Prompt Generation, and IaC DevOps Agent) from throwing parser SyntaxErrors when downstream provider outputs are truncated or slightly malformed.
* **Stream-Friendly Output**: The frontend parses JSON incrementally during streaming using a custom robust partial parser (`parsePartialJson`). Prompts must output keys sequentially (e.g. layers first, then nodes, then steps) so that the visual canvas renders new elements in real-time as the stream arrives.
* **Dynamic Neon Highlight Telemetry**: When nodes are added or updated via `handleChatModify`, set the modified node IDs in `setNewlyModifiedNodeIds`. This lights up a beautiful emerald pulsing neon ring around the nodes for 4 seconds in the React Flow Canvas to signal changes.
* **Progressive Slicing & Token Exhaustion Guardrails (Agent 6)**:
  * When slicing a large blueprint (e.g., microservices architecture with 5+ nodes), avoid asking the downstream AI to implement the entire application in a single step.
  * Enforce the **Service-by-Service Focus** strategy: guide the downstream AI to implement one "master reference service" completely (fully realized DB models, routing, dependency injection, repository mocks, and unit tests) as a template, and then sequentially extend it to subsequent services.
  * Break development into at least 3 logical phases: Database/Schema/Models (Phase 1), Core Business APIs (Phase 2), and Integration/Async Queue/CDN/External Gateways (Phase 3).
* **Localization Policy (All Agents)**:
  * Honor the selected user interface language (`th` or `en`), which is managed reactively in the workspace and can be toggled instantly by the user in the `<TabBar />` header controls.
  * If the user selects Thai (`th`), all agent panels, UI elements, logs, chat windows, explanations, and Definition of Done (DoD) checklists must render in clear, natural Thai.
  * For Agent 6 (Prompt Compiler), the generated Markdown prompts (`ai_instructions_prompt`) should be structured in Thai for instructions and guardrails, but all technical specifications, class schemas, SQL scripts, code imports, and configurations must remain in English to avoid syntax issues.


