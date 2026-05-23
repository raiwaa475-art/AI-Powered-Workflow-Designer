import { NextRequest } from 'next/server';
import { getProviderConfig } from '@/lib/providerSession';

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

    if (provider === 'openai') {
      const openAiKey = apiKey || process.env.OPENAI_API_KEY;
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPromptText },
            { role: 'user', content: `Analyze the resiliency of this system blueprint: ${JSON.stringify(blueprint)}` }
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API returned status ${response.status}`);
      }

      const resData = await response.json();
      const parsedData = JSON.parse(resData.choices[0]?.message?.content || '{}');
      const usage = {
        prompt_tokens: resData.usage?.prompt_tokens || 0,
        completion_tokens: resData.usage?.completion_tokens || 0,
        total_tokens: resData.usage?.total_tokens || 0
      };
      return new Response(JSON.stringify({ ...parsedData, usage }), {
        headers: { 'Content-Type': 'application/json' },
      });

    } else if (provider === 'anthropic') {
      const anthropicKey = apiKey || process.env.ANTHROPIC_API_KEY;
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey || '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2000,
          system: systemPromptText,
          messages: [
            { role: 'user', content: `Analyze the resiliency of this system blueprint: ${JSON.stringify(blueprint)}` }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API returned status ${response.status}`);
      }

      const resData = await response.json();
      const rawText = resData.content[0]?.text || '{}';
      
      // Clean possible markdown wrapper
      let cleanText = rawText.trim();
      if (cleanText.startsWith('```')) {
        const start = cleanText.indexOf('{');
        const end = cleanText.lastIndexOf('}');
        if (start > -1 && end > -1) {
          cleanText = cleanText.substring(start, end + 1);
        }
      }
      
      const parsedData = JSON.parse(cleanText);
      const usage = {
        prompt_tokens: resData.usage?.input_tokens || 0,
        completion_tokens: resData.usage?.output_tokens || 0,
        total_tokens: (resData.usage?.input_tokens || 0) + (resData.usage?.output_tokens || 0)
      };
      return new Response(JSON.stringify({ ...parsedData, usage }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else if (provider === 'deepseek') {
      const deepSeekKey = apiKey || process.env.DEEPSEEK_API_KEY;
      if (!deepSeekKey) {
        throw new Error('DeepSeek API Key is missing. Please provide one in Settings.');
      }
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepSeekKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPromptText },
            { role: 'user', content: `Analyze the resiliency of this system blueprint: ${JSON.stringify(blueprint)}` }
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API returned status ${response.status}`);
      }

      const resData = await response.json();
      const parsedData = JSON.parse(resData.choices[0]?.message?.content || '{}');
      const usage = {
        prompt_tokens: resData.usage?.prompt_tokens || 0,
        completion_tokens: resData.usage?.completion_tokens || 0,
        total_tokens: resData.usage?.total_tokens || 0
      };
      return new Response(JSON.stringify({ ...parsedData, usage }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Resiliency Agent Failure' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
