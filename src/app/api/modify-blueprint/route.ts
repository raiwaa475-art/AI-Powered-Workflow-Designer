import { NextRequest } from 'next/server';
import { getProviderConfig } from '@/lib/providerSession';
import { callLLM } from '@/lib/llmClient';

const SYSTEM_PROMPT = `You are an Elite System Architecture Modifier Agent.
Your job is to read the user's current system architecture blueprint (WorkflowData JSON containing layers, nodes, and steps) and their modification instructions, then output a Patch JSON of modifications strictly matching the ChatModification schema.

You MUST output ONLY a valid JSON object matching the schema below.
DO NOT wrap the response in markdown code blocks. Output pure JSON.

JSON Schema:
{
  "explanation": "string (A concise explanation of the changes made, written in the requested language, e.g. 'Added MongoDB Atlas node to data layer and updated write step to connect to it')",
  "modifications": {
    "nodes_to_add_or_update": [
      {
        "node_id": "string (exact unique kebab-case ID of the node, e.g., 'mongodb-atlas')",
        "layer_id": "presentation" | "application" | "queue" | "data",
        "node_name": "string (Clear readable service name, e.g., 'MongoDB Atlas')",
        "description": "string (Clear description of the service's role, tech stack, and responsibilities)",
        "type": "string (General component type, e.g., 'NoSQL DB', 'Relational DB', 'Cache', 'Microservice', 'Message Broker')"
      }
    ],
    "nodes_to_remove": ["string (IDs of nodes to be deleted from the graph)"],
    "steps_updated": [
      {
        "step_number": number (the 1-indexed step number, matches step sequence in the workflow),
        "title": "string (Action step title, e.g., 'Persist Booking to MongoDB')",
        "description": "string (Detailed technical description of data flow)",
        "involved_nodes": ["string (IDs of involved nodes in sequence, e.g. ['booking-service', 'mongodb-atlas'])"]
      }
    ],
    "steps_to_remove": [1] (optional, array of 1-indexed step numbers to be completely deleted from the sequence)
  }
}

Important Instructions:
1. Analyze what nodes are added, updated (modified in details/type/layer), or removed based on the user's prompt.
2. If the user asks to "change database to MongoDB", you should:
   - Identify the database node(s) in the "data" layer.
   - List the old database node ID in "nodes_to_remove".
   - List a new "mongodb-atlas" node in "nodes_to_add_or_update".
   - Update any steps that involved the old database node to now involve "mongodb-atlas" instead.
3. DATA INTEGRITY IS PARAMOUNT:
   - When removing a node (by adding its ID to "nodes_to_remove"), you MUST update/remove the node's ID from the "involved_nodes" list of any steps inside "steps_updated" to avoid leaving orphaned references!
   - If a step is no longer valid after node removal, you can add its number to "steps_to_remove".
   - When adding a new node, ALWAYS ensure that you either add a new step or update an existing step in "steps_updated" so that the new node is actually wired up and involved in the logical data flow sequence.
4. LOGICAL FLOW & LAYOUT:
   - When designing or modifying step sequences ("involved_nodes"), ensure the flow moves in a clear, logical down-facing order: Client/Gateways ("presentation") -> APIs/Processing ("application") -> Broker/Queues ("queue") -> Databases/Storage ("data").
   - Avoid creating zigzag or tangled loops of sync connections unless event-driven protocols are explicitly required. Keep routes straightforward and systematically aligned vertically (downwards).
5. Return ONLY a valid JSON object containing the patch modification without drawing unchanged components.
6. Output the response in the language requested (Thai or English).`;

export async function POST(req: NextRequest) {
  try {
    const { blueprint, prompt, language } = await req.json();
    const lang = language || 'th';

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), { status: 400 });
    }

    // Read provider + API key from HttpOnly cookie
    const { provider, apiKey } = getProviderConfig(req);

    if (provider === 'mock') {
      const { getMockModifyBlueprint } = await import('@/lib/mockAgentEngine');
      const patch = getMockModifyBlueprint(blueprint, prompt, lang);
      return new Response(JSON.stringify(patch), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!apiKey) {
      return new Response(JSON.stringify({ error: `Authentication Key for ${provider} is missing.` }), { status: 400 });
    }

    const finalSystemPrompt = SYSTEM_PROMPT + `\nIMPORTANT: All output text (explanation, titles, descriptions, names) MUST be written in ${lang === 'th' ? 'THAI' : 'ENGLISH'}.`;

    const { content, usage } = await callLLM({
      provider: provider as any,
      apiKey,
      systemPrompt: finalSystemPrompt,
      userMessage: `Current System Blueprint State:\n${JSON.stringify(blueprint, null, 2)}\n\nUser request to modify this system: ${prompt}`,
      jsonMode: true,
      temperature: 0.1,
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
    return new Response(JSON.stringify({ error: error.message || 'Server error modifying blueprint' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
