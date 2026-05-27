import { NextRequest } from 'next/server';
import { getProviderConfig } from '@/lib/providerSession';
import { callLLM } from '@/lib/llmClient';

const SYSTEM_PROMPT = `You are a Senior Systems Analyst and Lead Architect.
Your job is to analyze the provided system architecture blueprint (WorkflowData JSON containing layers, nodes, and steps) and generate 3 to 5 highly relevant, critical business logic questions that are crucial to clarify before coding the system.

For example:
- If there is a ticket booking service: "What is the seat lock duration (timeout) for tickets?" or "How do you handle duplicate reservation requests?"
- If there is a payment gate: "Which payment gateways (e.g., Stripe, PromptPay) must be integrated and what are the failure recovery policies?"
- If there is a database: "What is the data retention policy or how should user personal data be anonymized?"

You MUST output ONLY a valid JSON object matching the schema below. No markdown wrapping. Output pure JSON.

JSON Output Schema:
{
  "questions": [
    {
      "id": "string (unique-kebab-case-id, e.g. 'lock-timeout', 'payment-gateway')",
      "question": "string (The clear, targeted question for the user)",
      "target_node": "string (Optional, the ID of the node this question relates to)",
      "placeholder": "string (A helpful suggestion/placeholder answer to guide the user)"
    }
  ]
}

Guidelines:
1. Generate exactly 3 to 5 questions that target the core business transaction and data consistency of the system.
2. If language requested is Thai ('th'), translate the questions and placeholders into natural, professional Thai.
3. Keep the questions focused on business logic, rules, integration parameters, and state transitions.`;

export async function POST(req: NextRequest) {
  try {
    const { blueprint, language = 'en' } = await req.json();
    const lang = language === 'th' ? 'th' : 'en';

    if (!blueprint) {
      return new Response(JSON.stringify({ error: 'Blueprint data is required' }), { status: 400 });
    }

    // Read provider + API key from HttpOnly cookie
    const { provider, apiKey } = getProviderConfig(req);

    if (provider === 'mock') {
      const { getMockQuestions } = await import('@/lib/mockAgentEngine');
      const questionsData = getMockQuestions(blueprint, lang);
      return new Response(JSON.stringify(questionsData), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!apiKey) {
      return new Response(JSON.stringify({ error: `Authentication Key for ${provider} is missing.` }), { status: 400 });
    }

    const finalSystemPrompt = SYSTEM_PROMPT + `\nAll questions and placeholders inside the JSON MUST be written in ${lang === 'th' ? 'THAI' : 'ENGLISH'} language.`;

    const { content, usage } = await callLLM({
      provider: provider as any,
      apiKey,
      systemPrompt: finalSystemPrompt,
      userMessage: `Blueprint JSON specs:\n${JSON.stringify(blueprint, null, 2)}\n\nGenerate targeted business logic questions for this system.`,
      jsonMode: true,
      temperature: 0.3,
      maxTokens: 1000
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
    console.error("Error generating business questions:", error);
    return new Response(JSON.stringify({ error: error.message || 'Server error generating questions' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
