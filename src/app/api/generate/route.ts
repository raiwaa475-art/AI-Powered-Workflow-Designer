import { NextRequest } from 'next/server';
import { jsonrepair } from 'jsonrepair';
import { getProviderConfig } from '@/lib/providerSession';

// Define standard JSON schema as a system prompt instruction for Web Design
const SYSTEM_PROMPT = `You are an Elite System Architect Agent. Your job is to design a high-fidelity, production-grade microservices and workflow system architecture based on the user's prompt.
You MUST output ONLY a valid JSON object matching the schema below.
DO NOT wrap the response in markdown code blocks like \`\`\`json ... \`\`\`. Do not add any explanatory text. Output pure JSON.

JSON Schema:
{
  "title": "string (A high-tech professional name for the system, e.g. '1M Users Ticket Booking Engine')",
  "description": "string (High-level architectural overview, caching strategies, scaling bottlenecks, and technology decisions)",
  "layers": [
    {
      "id": "presentation" | "application" | "queue" | "data",
      "name": "string (Display name for the layer, e.g. 'Client Gateways', 'Business Microservices', 'Ingestion Queues', 'Databases')",
      "nodes": [
        {
          "id": "string (Unique kebab-case ID, e.g., 'cdn-cloudflare', 'booking-service', 'kafka-cluster', 'postgres-primary')",
          "name": "string (Clear readable service name, e.g. 'Cloudflare CDN', 'Booking Service', 'Kafka Cluster', 'PostgreSQL Primary')",
          "type": "string (General component type, e.g., 'CDN', 'API Gateway', 'Load Balancer', 'Microservice', 'Message Broker', 'Cache', 'Relational DB', 'NoSQL DB')",
          "description": "string (Clear description of the service's role, tech stack used, and responsibility)"
        }
      ]
    }
  ],
  "steps": [
    {
      "id": "string (Unique kebab-case ID, e.g., 'user-request', 'queue-message')",
      "number": number (Sequential step sequence starting at 1),
      "title": "string (Action step title, e.g., 'Submit Ticket Reservation')",
      "description": "string (Detailed technical description of how data flows in this step)",
      "involved_nodes": ["string (Array of node IDs that participate in this step, ordered from source to target, e.g., ['web-client', 'api-gateway', 'booking-service'])"]
    }
  ]
}

Ensure that:
1. Provide a realistic system architecture with 4 to 12 microservice nodes distributed across the 4 layers (presentation, application, queue, data). If a layer is not needed, you can omit it or make it empty, but a robust design should utilize all relevant tiers.
2. The steps represent a sequential end-to-end data flow (data spectrum) of the core transaction described by the user.
3. Output the response in the language requested (Thai or English).`;

export async function POST(req: NextRequest) {
  try {
    const { prompt, language = 'en' } = await req.json();
    const lang = language === 'th' ? 'th' : 'en';

    if (!prompt) {
      throw new Error('Prompt is required.');
    }

    // Read provider + API key from HttpOnly cookie (never from request body)
    const { provider, apiKey } = getProviderConfig(req);

    if (provider === 'mock') {
      const { getMockBlueprintStream } = await import('@/lib/mockAgentEngine');
      return getMockBlueprintStream(prompt, lang);
    }

    let systemPromptText = SYSTEM_PROMPT;
    if (lang === 'th') {
      systemPromptText += "\nIMPORTANT: All output text (titles, descriptions, names) MUST be in THAI language.";
    } else {
      systemPromptText += "\nIMPORTANT: All output text (titles, descriptions, names) MUST be in ENGLISH language.";
    }

    let resultText = '';

    if (provider === 'openai') {
      const openAiKey = apiKey;
      if (!openAiKey) {
        throw new Error('OpenAI API Key is missing. Please configure it in Engine Settings.');
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
            { role: 'system', content: systemPromptText },
            { role: 'user', content: `Design this system architecture: ${prompt}` }
          ],
          response_format: { type: "json_object" }, // OpenAI strict JSON mode!
          stream: true,
          stream_options: { include_usage: true }
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `OpenAI API returned status ${response.status}`);
      }

      // Stream helper
      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          const encoder = new TextEncoder();
          if (!reader) {
            controller.close();
            return;
          }

          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const cleaned = line.trim();
              if (cleaned === 'data: [DONE]') continue;
              if (cleaned.startsWith('data: ')) {
                try {
                  const parsed = JSON.parse(cleaned.substring(6));
                  const text = parsed.choices[0]?.delta?.content || '';
                  if (text) {
                    resultText += text;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                  }
                  const usage = parsed.usage;
                  if (usage) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ usage: { promptTokens: usage.prompt_tokens, completionTokens: usage.completion_tokens, totalTokens: usage.total_tokens } })}\n\n`));
                  }
                } catch {}
              }
            }
          }
          
          // Verify JSON structure & perform Self-Correction Loop on failure
          let correctionCount = 0;
          let isValid = false;
          
          while (!isValid && correctionCount < 2) {
            try {
              const repaired = jsonrepair(resultText);
              JSON.parse(repaired);
              isValid = true;
            } catch (err: any) {
              correctionCount++;
              // Call correction API non-stream
              const correctResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${openAiKey}`,
                },
                body: JSON.stringify({
                  model: 'gpt-4o',
                  messages: [
                    { role: 'system', content: systemPromptText },
                    { role: 'user', content: `Here is the malformed JSON output you previously generated for prompt: "${prompt}".\nIt has the following error: ${err.message}.\n\nPlease fix the JSON string and return ONLY the fully corrected valid JSON object strictly complying with the schema. No markdown formatting.\n\nBad output:\n${resultText}` }
                  ],
                  response_format: { type: "json_object" },
                }),
              });
              
              if (correctResponse.ok) {
                const corrData = await correctResponse.json();
                const correctedText = corrData.choices[0]?.message?.content || '';
                if (correctedText) {
                  resultText = correctedText;
                  // Stream correction difference to UI
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: '\n\n/* corrected */\n\n' + correctedText })}\n\n`));
                }
              }
            }
          }

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
        },
      });

    } else if (provider === 'anthropic') {
      const anthropicKey = apiKey;
      if (!anthropicKey) {
        throw new Error('Anthropic API Key is missing. Please configure it in Engine Settings.');
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          system: systemPromptText,
          messages: [
            { role: 'user', content: `Design this system architecture: ${prompt}` }
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Anthropic API returned status ${response.status}`);
      }

      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          const encoder = new TextEncoder();
          if (!reader) {
            controller.close();
            return;
          }

          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const cleaned = line.trim();
              if (cleaned.startsWith('data: ')) {
                try {
                  const parsed = JSON.parse(cleaned.substring(6));
                  if (parsed.type === 'message_start') {
                    const inputTokens = parsed.message?.usage?.input_tokens || 0;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ usage: { promptTokens: inputTokens, completionTokens: 0, totalTokens: inputTokens } })}\n\n`));
                  } else if (parsed.type === 'content_block_delta') {
                    const text = parsed.delta?.text || '';
                    if (text) {
                      resultText += text;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                    }
                  } else if (parsed.type === 'message_delta') {
                    const outputTokens = parsed.usage?.output_tokens || 0;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ usage: { promptTokens: 0, completionTokens: outputTokens, totalTokens: outputTokens } })}\n\n`));
                  }
                } catch {}
              }
            }
          }
          
          // Schema repair loop
          let correctionCount = 0;
          let isValid = false;
          
          while (!isValid && correctionCount < 2) {
            try {
              const repaired = jsonrepair(resultText);
              JSON.parse(repaired);
              isValid = true;
            } catch (err: any) {
              correctionCount++;
              // Call correction API non-stream
              const correctResponse = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': anthropicKey,
                  'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                  model: 'claude-3-5-sonnet-20241022',
                  max_tokens: 4000,
                  system: systemPromptText,
                  messages: [
                    { role: 'user', content: `Here is the malformed JSON output you previously generated for prompt: "${prompt}".\nIt has the following error: ${err.message}.\n\nPlease fix the JSON string and return ONLY the fully corrected valid JSON object strictly complying with the schema. No markdown formatting.\n\nBad output:\n${resultText}` }
                  ]
                }),
              });
              
              if (correctResponse.ok) {
                const corrData = await correctResponse.json();
                const correctedText = corrData.content[0]?.text || '';
                if (correctedText) {
                  resultText = correctedText;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: '\n\n/* corrected */\n\n' + correctedText })}\n\n`));
                }
              }
            }
          }

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
        },
      });
    } else if (provider === 'deepseek') {
      const deepSeekKey = apiKey;
      if (!deepSeekKey) {
        throw new Error('DeepSeek API Key is missing. Please configure it in Engine Settings.');
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
            { role: 'user', content: `Design this system architecture: ${prompt}` }
          ],
          response_format: { type: "json_object" },
          stream: true,
          stream_options: { include_usage: true }
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `DeepSeek API returned status ${response.status}`);
      }

      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          const encoder = new TextEncoder();
          if (!reader) {
            controller.close();
            return;
          }

          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const cleaned = line.trim();
              if (cleaned === 'data: [DONE]') continue;
              if (cleaned.startsWith('data: ')) {
                try {
                  const parsed = JSON.parse(cleaned.substring(6));
                  const text = parsed.choices[0]?.delta?.content || '';
                  if (text) {
                    resultText += text;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                  }
                  const usage = parsed.usage;
                  if (usage) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ usage: { promptTokens: usage.prompt_tokens, completionTokens: usage.completion_tokens, totalTokens: usage.total_tokens } })}\n\n`));
                  }
                } catch {}
              }
            }
          }
          
          let correctionCount = 0;
          let isValid = false;
          
          while (!isValid && correctionCount < 2) {
            try {
              const repaired = jsonrepair(resultText);
              JSON.parse(repaired);
              isValid = true;
            } catch (err: any) {
              correctionCount++;
              const correctResponse = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${deepSeekKey}`,
                },
                body: JSON.stringify({
                  model: 'deepseek-chat',
                  messages: [
                    { role: 'system', content: systemPromptText },
                    { role: 'user', content: `Here is the malformed JSON output you previously generated for prompt: "${prompt}".\nIt has the following error: ${err.message}.\n\nPlease fix the JSON string and return ONLY the fully corrected valid JSON object strictly complying with the schema. No markdown formatting.\n\nBad output:\n${resultText}` }
                  ],
                  response_format: { type: "json_object" },
                }),
              });
              
              if (correctResponse.ok) {
                const corrData = await correctResponse.json();
                const correctedText = corrData.choices[0]?.message?.content || '';
                if (correctedText) {
                  resultText = correctedText;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: '\n\n/* corrected */\n\n' + correctedText })}\n\n`));
                }
              }
            }
          }

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
        },
      });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Unknown Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
