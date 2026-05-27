import { NextRequest } from 'next/server';
import { getProviderConfig } from '@/lib/providerSession';
import { callLLM } from '@/lib/llmClient';

const SYSTEM_PROMPT = `You are an Elite Principal AI Prompt Engineer and Lead Architect.
Your task is to analyze the provided system architecture blueprint (WorkflowData JSON) and the scaling estimates (ScaleData JSON), then slice the development workflow into at least 3 distinct, progressive phases:
- Phase 1: Database Schema, Caching, and Models setup (e.g. PostgreSQL, Redis, schemas, indexes)
- Phase 2: Core API Routes, Controllers, and Service Logic
- Phase 3: Integration, Queue/Broker, Caching Logic, and External Gateways

You MUST output ONLY a valid JSON object matching the schema below.
DO NOT wrap the response in markdown code blocks like \`\`\`json ... \`\`\`. Output pure JSON.

JSON Schema:
{
  "explanation": "string (Lead Prompt Engineer overview, developmental mindset, and workflow strategy)",
  "phases": [
    {
      "phase_number": number (Sequential phase number, e.g. 1),
      "title": "string (A descriptive title for this phase, e.g. 'Phase 1: DB Schema & Models Setup')",
      "description": "string (Explanation of what is done in this phase and why)",
      "target_nodes": ["string (Array of node IDs involved in this specific phase)"],
      "ai_role": "string (The persona standard downstream LLMs should assume, e.g. 'You are an expert Relational Database administrator and Go backend developer...')",
      "ai_instructions_prompt": "string (A highly detailed, comprehensive Markdown prompt that a user can copy and paste directly into Claude, ChatGPT, or another AI. The prompt must contain: 1. Context of the overall system. 2. Role of the AI. 3. Deep technical specifications of the target nodes in this phase. 4. Code quality guardrails and constraints, e.g. what packages to use, error handling policies, what NOT to do.)",
      "definition_of_done": [
        "string (Checklist item 1)",
        "string (Checklist item 2)",
        "string (Checklist item 3)"
      ]
    }
  ]
}

Guidelines:
1. Ensure each phase's 'ai_instructions_prompt' is extremely detailed, professional, and actionable, enabling a downstream AI to write production-ready code.
2. Group the nodes logically: Phase 1 should target database and storage nodes. Phase 2 should target backend services and business microservices. Phase 3 should target load balancers, brokers, CDN, and gateways.
3. If language requested is Thai ('th'), translate the explanation, titles, descriptions, ai_role, and definition_of_done checklist into Thai. The 'ai_instructions_prompt' should be written primarily in Thai but technical code blocks, parameters, packages, and code terms must remain in English.
4. For Phase 2, if multiple microservices exist, the generated prompt MUST guide downstream AIs to follow a 'Progressive Service-by-Service Focus' strategy (e.g., advising the agent to isolate and write one microservice fully with complete unit tests and repository interfaces as a reference master, then duplicate its pattern for other services successively, rather than generating all 7 or more microservices in a single run which risks token exhaustion and incomplete code skeletons).
`;

export async function POST(req: NextRequest) {
  try {
    const { blueprint, scaleInfo, language = 'en', answers } = await req.json();
    const lang = language === 'th' ? 'th' : 'en';

    if (!blueprint) {
      return new Response(JSON.stringify({ error: 'Blueprint data is required.' }), { status: 400 });
    }

    // Read provider + API key from HttpOnly cookie
    const { provider, apiKey } = getProviderConfig(req);

    if (provider === 'mock') {
      const { getMockPrompts } = await import('@/lib/mockAgentEngine');
      const promptsData = getMockPrompts(blueprint, scaleInfo, lang);
      return new Response(JSON.stringify(promptsData), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!apiKey) {
      return new Response(JSON.stringify({ error: `Authentication Key for ${provider} is missing.` }), { status: 400 });
    }

    let finalSystemPrompt = SYSTEM_PROMPT + `\nAll explanations, phase titles, descriptions, AI roles, prompts, and DoD checklists inside the JSON MUST be written in ${lang === 'th' ? 'THAI' : 'ENGLISH'} language. Technical terminology can stay in English inside markdown text.`;

    if (answers && Object.keys(answers).length > 0) {
      finalSystemPrompt += `\n\nCRITICAL CONSTRAINTS (User Calibrated Business Logic):
The user has provided the following answers to architectural business questions. You MUST incorporate these exact parameters and constraints directly into the generated prompts (especially Phase 2 and Phase 3 instructions):
${Object.entries(answers).map(([key, val]) => `- Question Key "${key}": User specifies "${val}"`).join('\n')}`;
    }

    const userPayload = `
System Blueprint:
${JSON.stringify(blueprint, null, 2)}

Scaling Data Context:
${JSON.stringify(scaleInfo || {}, null, 2)}

Generate a development breakdown plan consisting of at least 3 development phases, with copyable instructions prompts and Definition of Done checklists.
`;

    const { content, usage } = await callLLM({
      provider: provider as any,
      apiKey,
      systemPrompt: finalSystemPrompt,
      userMessage: userPayload,
      jsonMode: true,
      temperature: 0.3,
      maxTokens: 4000
    });

    return new Response(content, {
      headers: { 
        'Content-Type': 'application/json',
        'X-Prompt-Tokens': String(usage.promptTokens),
        'X-Completion-Tokens': String(usage.completionTokens),
        'X-Total-Tokens': String(usage.totalTokens)
      }
    });
  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message || 'Server error generating prompts' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
