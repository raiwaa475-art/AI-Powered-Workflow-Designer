import { NextRequest } from 'next/server';
import { getProviderConfig } from '@/lib/providerSession';
import { callLLM } from '@/lib/llmClient';

const SYSTEM_PROMPT = `You are a Senior Resiliency & Security Architect.
You will analyze the provided JSON system architecture blueprint.
Identify critical risks, security flaws, and single points of failure (SPOF) for EACH node.
Also, classify the data communication flow type (sync, async, event) and technical protocol (HTTP, gRPC, AMQP, Websocket) for each sequential step.

You MUST output ONLY a valid JSON object matching the schema below.
DO NOT wrap the response in markdown code blocks like \`\`\`json ... \`\`\`.

JSON Schema:
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
      "step_number": number (matches step number in the blueprint),
      "flow_type": "sync" | "async" | "event",
      "technical_protocol": "HTTP" | "gRPC" | "AMQP" | "Websocket"
    }
  ]
}

Ensure all nodes have risk assessments and all workflow steps have flow classifications.
Output the analysis in the language requested (Thai or English).`;

export async function POST(req: NextRequest) {
  try {
    const { blueprint, language = 'en' } = await req.json();
    const lang = language === 'th' ? 'th' : 'en';

    if (!blueprint) {
      throw new Error('Blueprint data is required.');
    }

    // 1. Strict Engine Authentication Validation
    const { provider, apiKey } = getProviderConfig(req);

    if (provider === 'mock') {
      const { getMockResiliency } = await import('@/lib/mockAgentEngine');
      const resiliencyData = getMockResiliency(blueprint, lang);
      return new Response(JSON.stringify(resiliencyData), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!apiKey) {
      throw new Error(`API Authentication Key for ${provider} is missing. Please configure it in Engine Settings.`);
    }

    // 2. Real LLM Call
    let systemPromptText = SYSTEM_PROMPT;
    if (lang === 'th') {
      systemPromptText += "\nIMPORTANT: All risk descriptions, titles, and solutions MUST be written in THAI.";
    } else {
      systemPromptText += "\nIMPORTANT: All risk descriptions, titles, and solutions MUST be written in ENGLISH.";
    }

    const { content, usage } = await callLLM({
      provider: provider as any,
      apiKey,
      systemPrompt: systemPromptText,
      userMessage: `Analyze the resiliency of this system blueprint: ${JSON.stringify(blueprint)}`,
      jsonMode: true
    });

    const parsedData = JSON.parse(content || '{}');
    const legacyUsage = {
      prompt_tokens: usage.promptTokens,
      completion_tokens: usage.completionTokens,
      total_tokens: usage.totalTokens
    };

    return new Response(JSON.stringify({ ...parsedData, usage: legacyUsage }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Resiliency Agent Failure' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
