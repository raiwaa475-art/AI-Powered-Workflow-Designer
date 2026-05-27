import { NextRequest } from 'next/server';
import { getProviderConfig } from '@/lib/providerSession';
import { streamLLM } from '@/lib/llmClient';

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

    if (!apiKey) {
      throw new Error(`Authentication Key for ${provider} is missing. Please configure it in Engine Settings.`);
    }

    let systemPromptText = SYSTEM_PROMPT;
    if (lang === 'th') {
      systemPromptText += "\nIMPORTANT: All output text (titles, descriptions, names) MUST be in THAI language.";
    } else {
      systemPromptText += "\nIMPORTANT: All output text (titles, descriptions, names) MUST be in ENGLISH language.";
    }

    return await streamLLM({
      provider: provider as any,
      apiKey,
      systemPrompt: systemPromptText,
      userMessage: `Design this system architecture: ${prompt}`,
      prompt
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Unknown Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
