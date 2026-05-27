import { NextRequest } from 'next/server';
import { getProviderConfig } from '@/lib/providerSession';
import { callLLM } from '@/lib/llmClient';

const SYSTEM_PROMPT = `You are an AI Architect Assistant inside an AI-powered workflow designer.
Answer architecture, workflow, scaling, reliability, DevOps, and product-design questions clearly and practically.

If the user provides a current WorkflowData blueprint, ground your answer in that blueprint. Mention concrete nodes, layers, or steps when useful.
If no blueprint is available, answer as a general architecture assistant and avoid pretending that a canvas exists.

You do not directly modify the canvas in this endpoint. If the user asks for an actual canvas change, explain what would change and tell them the app can apply it through an edit request.
Keep answers concise, structured, and written in the requested language.`;

function getMockAnswer(message: string, blueprint: any, language: 'th' | 'en') {
  const hasBlueprint = !!blueprint?.layers?.length;
  if (language === 'th') {
    if (!hasBlueprint) {
      return `ตอนนี้ยังไม่มี blueprint บน canvas ครับ แต่ผมตอบคำถามเชิงสถาปัตยกรรมได้\n\nคำถามของคุณ: "${message}"\n\nโดยหลักการ ให้เริ่มจากแยกชั้น Presentation, Application, Queue และ Data แล้วค่อยดู bottleneck, จุดล้มเหลวเดี่ยว และเส้นทางข้อมูลหลักก่อนตัดสินใจเพิ่ม cache, broker หรือ load balancer`;
    }

    const layerNames = blueprint.layers.map((layer: any) => layer.name || layer.id).join(', ');
    return `จาก blueprint ปัจจุบัน ระบบมีเลเยอร์หลักคือ ${layerNames}\n\nคำถามของคุณ: "${message}"\n\nภาพรวมควรวิเคราะห์จาก flow ใน steps ก่อนว่า request วิ่งผ่าน gateway/service/queue/database อย่างไร จากนั้นตรวจจุดเสี่ยงเช่น service ที่รับโหลดมากเกินไป, database bottleneck, และจุดที่ควรเพิ่ม cache หรือ async queue`;
  }

  if (!hasBlueprint) {
    return `There is no active blueprint on the canvas yet, but I can still answer architecture questions.\n\nYour question: "${message}"\n\nA good starting point is to separate Presentation, Application, Queue, and Data layers, then inspect bottlenecks, single points of failure, and the main data path before adding caches, brokers, or load balancers.`;
  }

  const layerNames = blueprint.layers.map((layer: any) => layer.name || layer.id).join(', ');
  return `The current blueprint includes these main layers: ${layerNames}.\n\nYour question: "${message}"\n\nStart by reading the workflow steps end-to-end, then check for overloaded services, database bottlenecks, and places where cache or asynchronous queues would reduce pressure.`;
}

export async function POST(req: NextRequest) {
  try {
    const { message, blueprint = null, language = 'th' } = await req.json();
    const lang = language === 'en' ? 'en' : 'th';

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: 'Message is required' }), { status: 400 });
    }

    const { provider, apiKey } = getProviderConfig(req);

    if (provider === 'mock') {
      return new Response(JSON.stringify({ answer: getMockAnswer(message, blueprint, lang) }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!apiKey) {
      return new Response(JSON.stringify({ error: `Authentication Key for ${provider} is missing.` }), { status: 400 });
    }

    const finalSystemPrompt = `${SYSTEM_PROMPT}\nIMPORTANT: Write the answer in ${lang === 'th' ? 'THAI' : 'ENGLISH'}.`;
    const blueprintContext = blueprint
      ? `Current WorkflowData blueprint:\n${JSON.stringify(blueprint, null, 2)}`
      : 'Current WorkflowData blueprint: none is available yet.';

    const { content, usage } = await callLLM({
      provider: provider as any,
      apiKey,
      systemPrompt: finalSystemPrompt,
      userMessage: `${blueprintContext}\n\nUser question:\n${message}`,
      jsonMode: false,
      temperature: 0.3,
      maxTokens: 1400,
    });

    return new Response(JSON.stringify({ answer: content.trim() }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Prompt-Tokens': String(usage.promptTokens),
        'X-Completion-Tokens': String(usage.completionTokens),
        'X-Total-Tokens': String(usage.totalTokens),
      },
    });
  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message || 'Server error answering chat message' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
