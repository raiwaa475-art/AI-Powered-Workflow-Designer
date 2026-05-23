import { NextRequest } from 'next/server';
import { getProviderConfig } from '@/lib/providerSession';

const SYSTEM_PROMPT = `You are an Elite Principal DevOps & Infrastructure Engineer.
Your job is to read the user's system architecture blueprint (WorkflowData JSON containing layers, nodes, and steps) and generate production-ready, beautiful infrastructure-as-code files like docker-compose.yml, nginx.conf, and Dockerfile/Env configs matching the system structure.

You MUST output ONLY a valid JSON object matching the schema below. No markdown wrapping. Output pure JSON.

JSON Output Schema:
{
  "explanation": "string (Short summary of the generated infrastructure design, setup steps, and port mappings)",
  "files": {
    "docker-compose.yml": "string (A complete, high-fidelity docker-compose.yml file configuring all the nodes from the presentation, application, queue, and data layers. Use official microservice, cache, database, and broker base images, include environment variables, mapped ports, volumes, network configurations, and healthchecks.)",
    "nginx.conf": "string (A detailed Nginx configuration acting as an API gateway / reverse proxy, routing traffic to application containers with upstream load balancing, gzip, and SSL settings.)",
    "src/README.md": "string (A comprehensive setup guide explaining how to spin up the local environment, verify healthcheck statuses, and run load testing.)"
  }
}

Guidelines:
1. Ensure the docker-compose.yml defines realistic containers matching the node IDs in the blueprint (e.g., redis-cache, rabbitmq-queue, postgres-db, express-app).
2. The nginx.conf should route paths dynamically to application servers based on your blueprint.
3. All explanations and setup guides in the JSON must be in the requested language (Thai or English).`;

export async function POST(req: NextRequest) {
  try {
    const { blueprint, techStack, language } = await req.json();
    const stack = techStack || 'docker';
    const lang = language || 'th';

    if (!blueprint) {
      return new Response(JSON.stringify({ error: 'Blueprint data is required' }), { status: 400 });
    }

    // Read provider + API key from HttpOnly cookie
    const { provider, apiKey } = getProviderConfig(req);

    if (provider === 'mock') {
      const { getMockInfrastructureCode } = await import('@/lib/mockAgentEngine');
      const infraData = getMockInfrastructureCode(blueprint, stack, lang);
      return new Response(JSON.stringify(infraData), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const finalSystemPrompt = SYSTEM_PROMPT + `\nSelected Stack: ${stack}\nAll explanations and setup instructions inside the JSON MUST be written in ${lang === 'th' ? 'THAI' : 'ENGLISH'} language.`;

    if (provider === 'openai') {
      const openAiKey = apiKey;
      if (!openAiKey) {
        return new Response(JSON.stringify({ error: 'OpenAI API Key is missing. Check settings.' }), { status: 400 });
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: finalSystemPrompt },
            { 
              role: 'user', 
              content: `System blueprint specifications JSON:\n${JSON.stringify(blueprint, null, 2)}\n\nGenerate infrastructure code including a docker-compose.yml and nginx.conf that orchestrates this exact layout.` 
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `OpenAI API returned status ${response.status}`);
      }

      const resData = await response.json();
      const content = resData.choices[0]?.message?.content;
      const promptTokens = resData.usage?.prompt_tokens || 0;
      const completionTokens = resData.usage?.completion_tokens || 0;
      const totalTokens = resData.usage?.total_tokens || 0;
      return new Response(content, {
        headers: { 
          'Content-Type': 'application/json',
          'X-Prompt-Tokens': String(promptTokens),
          'X-Completion-Tokens': String(completionTokens),
          'X-Total-Tokens': String(totalTokens)
        }
      });
    }

    if (provider === 'anthropic') {
      const claudeKey = apiKey || process.env.ANTHROPIC_API_KEY;
      if (!claudeKey) {
        return new Response(JSON.stringify({ error: 'Claude API Key is missing. Check settings.' }), { status: 400 });
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          system: finalSystemPrompt,
          messages: [
            { 
              role: 'user', 
              content: `System blueprint specifications JSON:\n${JSON.stringify(blueprint, null, 2)}\n\nGenerate infrastructure code including a docker-compose.yml and nginx.conf that orchestrates this exact layout.` 
            }
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Claude API returned status ${response.status}`);
      }

      const resData = await response.json();
      const text = resData.content[0]?.text || '{}';
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const promptTokens = resData.usage?.input_tokens || 0;
      const completionTokens = resData.usage?.output_tokens || 0;
      const totalTokens = promptTokens + completionTokens;
      return new Response(cleanedText, {
        headers: { 
          'Content-Type': 'application/json',
          'X-Prompt-Tokens': String(promptTokens),
          'X-Completion-Tokens': String(completionTokens),
          'X-Total-Tokens': String(totalTokens)
        }
      });
    }

    if (provider === 'deepseek') {
      const deepSeekKey = apiKey || process.env.DEEPSEEK_API_KEY;
      if (!deepSeekKey) {
        return new Response(JSON.stringify({ error: 'DeepSeek API Key is missing. Check settings.' }), { status: 400 });
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
            { role: 'system', content: finalSystemPrompt },
            { 
              role: 'user', 
              content: `System blueprint specifications JSON:\n${JSON.stringify(blueprint, null, 2)}\n\nGenerate infrastructure code including a docker-compose.yml and nginx.conf that orchestrates this exact layout.` 
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `DeepSeek API returned status ${response.status}`);
      }

      const resData = await response.json();
      const content = resData.choices[0]?.message?.content || '{}';
      const promptTokens = resData.usage?.prompt_tokens || 0;
      const completionTokens = resData.usage?.completion_tokens || 0;
      const totalTokens = resData.usage?.total_tokens || 0;
      return new Response(content, {
        headers: { 
          'Content-Type': 'application/json',
          'X-Prompt-Tokens': String(promptTokens),
          'X-Completion-Tokens': String(completionTokens),
          'X-Total-Tokens': String(totalTokens)
        }
      });
    }

    return new Response(JSON.stringify({ error: 'Unsupported provider' }), { status: 400 });
  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message || 'Server error generating code' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
