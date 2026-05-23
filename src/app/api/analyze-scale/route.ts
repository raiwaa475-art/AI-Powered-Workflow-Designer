import { NextRequest } from 'next/server';
import { LoadEstimate, DeployStage, OptimizationConfigs, ScaleData } from '@/types';
import { getProviderConfig } from '@/lib/providerSession';

const SYSTEM_PROMPT = `You are a Principal Infrastructure & DevOps Engineer.
You will analyze the user prompt and the provided system architecture blueprint.
Generate professional scaling recommendations, load estimation benchmarks, progressive deployment pipelines, and system configurations.

You MUST output ONLY a valid JSON object matching the schema below.
DO NOT wrap the response in markdown code blocks like \`\`\`json ... \`\`\`.

JSON Schema:
{
  "load_estimates": [
    {
      "tier": "Small" | "Medium" | "Large",
      "concurrent_users": "string (e.g. 1,000 Users)",
      "requests_per_second": "string (e.g. 200 RPS)",
      "server_spec": "string (recommended CPU, RAM, Instance type)"
    }
  ],
  "deploy_stages": [
    {
      "stage": "Stage 1" | "Stage 2" | "Stage 3",
      "title": "string (Stage name, e.g. Docker Containerization)",
      "pros": ["string"],
      "cons": ["string"],
      "estimated_cost": "string (Mock monthly USD cost or details)"
    }
  ],
  "optimization_configs": {
    "nginx": "string (Nginx configuration block)",
    "postgres": "string (PostgreSQL tuned variables)",
    "redis": "string (Redis memory/eviction configurations)"
  },
  "monitoring_checklist": [
    "string (monitoring alert rules or checks)"
  ]
}

Ensure Nginx, Postgres, and Redis code blocks contain actual configuration code and parameters.
Output the analysis in the language requested (Thai or English).`;

export async function POST(req: NextRequest) {
  try {
    const { blueprint, prompt, language = 'en' } = await req.json();
    const lang = language === 'th' ? 'th' : 'en';

    if (!blueprint) {
      throw new Error('Blueprint data is required.');
    }

    // 1. Strict Engine Authentication Validation
    const { provider, apiKey } = getProviderConfig(req);

    if (provider === 'mock') {
      const { getMockScale } = await import('@/lib/mockAgentEngine');
      const scaleData = getMockScale(blueprint, prompt, lang);
      return new Response(JSON.stringify(scaleData), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!apiKey) {
      throw new Error(`API Authentication Key for ${provider} is missing. Please configure it in Engine Settings.`);
    }

    // 2. Real LLM Call
    let systemPromptText = SYSTEM_PROMPT;
    if (lang === 'th') {
      systemPromptText += "\nIMPORTANT: All text in estimates, stages, and checklist MUST be written in THAI. Config blocks remain in english server code.";
    } else {
      systemPromptText += "\nIMPORTANT: All text in estimates, stages, and checklist MUST be written in ENGLISH.";
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
            { role: 'user', content: `Generate scaling recommendations for the prompt: "${prompt}" and blueprint: ${JSON.stringify(blueprint)}` }
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
          max_tokens: 2500,
          system: systemPromptText,
          messages: [
            { role: 'user', content: `Generate scaling recommendations for the prompt: "${prompt}" and blueprint: ${JSON.stringify(blueprint)}` }
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
            { role: 'user', content: `Generate scaling recommendations for the prompt: "${prompt}" and blueprint: ${JSON.stringify(blueprint)}` }
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
    return new Response(JSON.stringify({ error: error.message || 'Scale Agent Failure' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
