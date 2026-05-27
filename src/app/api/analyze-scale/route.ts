import { NextRequest } from 'next/server';
import { getProviderConfig } from '@/lib/providerSession';
import { callLLM } from '@/lib/llmClient';

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
    const { blueprint, prompt, language = 'en', backendStack } = await req.json();
    const lang = language === 'th' ? 'th' : 'en';

    if (!blueprint) {
      throw new Error('Blueprint data is required.');
    }

    // 1. Strict Engine Authentication Validation
    const { provider, apiKey } = getProviderConfig(req);

    if (provider === 'mock') {
      const { getMockScale } = await import('@/lib/mockAgentEngine');
      const scaleData = getMockScale(blueprint, prompt, lang, backendStack);
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

    if (backendStack) {
      systemPromptText += `\n\nCRITICAL: The user has selected the backend stack: "${backendStack}". 
      You MUST customize and tune the "optimization_configs" (nginx, postgres, and redis) specifically for this stack:
      - If Go (Gin) is selected: Tune Nginx reverse proxy parameters for high-performance Go, Postgres for sql.DB pool (max_connections, work_mem), and document Go sql.DB pool configurations.
      - If Node.js (Express) is selected: Tune Nginx reverse proxy headers for Node clustering, and Postgres connection parameters for pg-pool/Sequelize.
      - If Python (FastAPI) is selected: Tune Nginx reverse proxy for Uvicorn/FastAPI concurrent workers, and Postgres connection pooling for SQLAlchemy (pool_size, max_overflow).
      - If Java (Spring Boot) is selected: Tune Postgres connection parameters specifically for HikariCP (maximumPoolSize, connectionTimeout, idleTimeout), and tune Tomcat proxy buffering in Nginx.
      - If C# (.NET Core) is selected: Tune Postgres connection pools for Entity Framework / ADO.NET, and tune Nginx proxy buffering for Kestrel.
      Please write actual, functional parameters in these configuration scripts with clear descriptive comments.`;
    }

    const { content, usage } = await callLLM({
      provider: provider as any,
      apiKey,
      systemPrompt: systemPromptText,
      userMessage: `Generate scaling recommendations for the prompt: "${prompt}" and blueprint: ${JSON.stringify(blueprint)}`,
      jsonMode: true,
      maxTokens: 2500
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
    return new Response(JSON.stringify({ error: error.message || 'Scale Agent Failure' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
