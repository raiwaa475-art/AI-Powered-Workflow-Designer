# CLAUDE.md - Developer Guidelines & Conventions

This guide serves as a quick-start reference for building, running, and maintaining the **AI-Powered Workflow Designer** repository.

## 🛠️ Technology Stack & Architecture
* **Frontend**: Next.js 14+ (App Router), React, TypeScript.
* **Styling**: Vanilla CSS custom utility tokens, Tailwind-like Tailwind-equivalent custom styles, and Sleek Dark Glassmorphism.
* **Canvas Engine**: React Flow (`@xyflow/react`) with fully customized nodes (`CustomNodeComponent`, `LayerHeaderNodeComponent`) and dynamic offset-routing edges (`CustomDataFlowEdge`).
* **Multi-Agent Pipeline**: Real parallel background LLM agents for:
  1. **Blueprint Agent** (`/api/generate`): Generates initial 4-Tier layers.
  2. **Resiliency Agent** (`/api/analyze-resiliency`): SPOF checking, sync/async communication classification.
  3. **Scale Agent** (`/api/analyze-scale`): Load tier profiling (Small/Medium/Large), Cloud hosting budget, and DB/Redis tuned scripts.
  4. **DevOps Agent** (`/api/generate-infrastructure-code`): Generates complete infrastructure IaC files (Kubernetes, Docker Compose, Terraform).
  5. **Reverse Engineering Agent** (`/api/reverse-engineer`): Reconstructs architecture diagrams from codebases/ZIP/GitHub tree.
  6. **Prompt Engineer Agent** (`/api/generate-prompts`): Generates progressive development prompts and Definition of Done checklists.
* **Multiplayer Room**: Live collaboration via local/remote state broadcasting (`useCollab`).

---

## 💻 Development Commands

### Start Development Server
```bash
npm run dev
```

### Build Production Bundle
```bash
npm run build
```

### Run Linter
```bash
npm run lint
```

---

## 🎨 Visual & Styling Conventions
1. **Design Theme**: Sleek Dark Mode, Glassmorphism, and Obsidian card textures.
2. **Harmonious Layer Color Scheme**:
   * **Presentation Layer**: Violet (`text-violet-400`, `bg-violet-500`)
   * **Application Layer**: Teal (`text-teal-400`, `bg-teal-500`)
   * **Queue / Message Broker**: Amber (`text-amber-400`, `bg-amber-500`)
   * **Database & Cache Layer**: Blue (`text-blue-400`, `bg-blue-500`)
3. **Interactive Elements**:
   * Hover effects must have smooth transitions (`transition-all duration-300`).
   * Active steps must highlight connections with glowing borders (`animate-pulse-glow-cyan`, `animate-pulse-glow-orange`, `animate-pulse-glow-purple`) and animated flying packets.
4. **No Placeholders**: UI must feel extremely premium, highly interactive, and utilize Lucide icons.

---

## 📝 Code Style & Guidelines
* **Type Safety**: Avoid using `any` wherever possible. Define precise interfaces in `src/types/index.ts`.
* **State Persistence**: 
  * Preserve canvas state, risks, configs, and prompts when switching between workspace views (`Visual Canvas` vs `Scale & Optimize` vs `Code Workspace` vs `Prompt Workspace`).
  * Enforce **Absolute State Preservation** for Agent 6: switching tabs must NOT trigger redundant prompt generations. Prompt compiler should run exactly once (or upon manual refresh request) and cache the result in context.
  * Interactive Definition of Done (DoD) checkboxes and timeline selection states must be preserved. Marking a checklist item as completed must not trigger API reload requests or reset the visual state.
* **Session Serialization**: Ensure all newly added AI context structures (such as `promptEngineerInfo` for Agent 6) are serialized into the `SavedSession` JSON structure and saved/loaded seamlessly via session storage.
* **Localization**: 
  * Support both Thai (`th`) and English (`en`) seamlessly across UI text, LLM logs, system alerts, and prompt generation outputs.
  * State is managed reactively via the `language` state in `AppShell.tsx` and can be toggled by the user via the custom `<TabBar />` header controls.
* **Verification & Type Safety**:
  * Always validate typescript compile correctness using `npx tsc --noEmit` before concluding work.
* **Error Prevention**:
  * Safeguard all array/string manipulation against `undefined` or `null` values (e.g. check for existence of node arrays, step listings, and valid node IDs).
  * Do not call React state setters inside `useEffect` dependencies that reference the state itself (avoid infinite cascading render depth).

