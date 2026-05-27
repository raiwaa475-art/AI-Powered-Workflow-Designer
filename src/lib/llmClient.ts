import { jsonrepair } from 'jsonrepair';

export interface LLMCallOptions {
  provider: 'openai' | 'anthropic' | 'deepseek';
  apiKey: string;
  systemPrompt: string;
  userMessage: string;
  jsonMode?: boolean; // default true
  temperature?: number; // default undefined (provider default)
  maxTokens?: number; // default undefined (provider default)
  model?: string; // override default model
}

export interface LLMResponse {
  content: string; // raw JSON string from LLM
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export interface LLMStreamOptions {
  provider: 'openai' | 'anthropic' | 'deepseek';
  apiKey: string;
  systemPrompt: string;
  userMessage: string;
  prompt: string; // for self-correction prompt if malformed
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export async function callLLM(opts: LLMCallOptions): Promise<LLMResponse> {
  const {
    provider,
    apiKey,
    systemPrompt,
    userMessage,
    jsonMode = true,
    temperature,
    maxTokens,
    model,
  } = opts;

  let rawContent = '';
  let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

  if (provider === 'openai') {
    const defaultModel = model || 'gpt-4o';
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
        ...(temperature !== undefined ? { temperature } : {}),
        ...(maxTokens !== undefined ? { max_tokens: maxTokens } : {}),
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `OpenAI API returned status ${response.status}`);
    }

    const resData = await response.json();
    rawContent = resData.choices[0]?.message?.content || '{}';
    usage = {
      promptTokens: resData.usage?.prompt_tokens || 0,
      completionTokens: resData.usage?.completion_tokens || 0,
      totalTokens: resData.usage?.total_tokens || 0
    };

  } else if (provider === 'anthropic') {
    const defaultModel = model || 'claude-3-5-sonnet-20241022';
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: defaultModel,
        max_tokens: maxTokens || 2000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userMessage }
        ],
        ...(temperature !== undefined ? { temperature } : {}),
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Anthropic API returned status ${response.status}`);
    }

    const resData = await response.json();
    const rawText = resData.content[0]?.text || '{}';
    
    // Clean possible markdown wrapper
    rawContent = rawText.trim();
    if (jsonMode && rawContent.startsWith('```')) {
      const start = rawContent.indexOf('{');
      const end = rawContent.lastIndexOf('}');
      if (start > -1 && end > -1) {
        rawContent = rawContent.substring(start, end + 1);
      }
    }
    
    usage = {
      promptTokens: resData.usage?.input_tokens || 0,
      completionTokens: resData.usage?.output_tokens || 0,
      totalTokens: (resData.usage?.input_tokens || 0) + (resData.usage?.output_tokens || 0)
    };

  } else if (provider === 'deepseek') {
    const defaultModel = model || 'deepseek-chat';
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
        ...(temperature !== undefined ? { temperature } : {}),
        ...(maxTokens !== undefined ? { max_tokens: maxTokens } : {}),
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `DeepSeek API returned status ${response.status}`);
    }

    const resData = await response.json();
    rawContent = resData.choices[0]?.message?.content || '{}';
    usage = {
      promptTokens: resData.usage?.prompt_tokens || 0,
      completionTokens: resData.usage?.completion_tokens || 0,
      totalTokens: resData.usage?.total_tokens || 0
    };
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  // Robust JSON validation & Repair layer
  let content = rawContent;
  if (jsonMode) {
    try {
      JSON.parse(content);
    } catch (err: any) {
      console.warn('[callLLM] Malformed JSON received from provider. Attempting repair...', err.message);
      try {
        const repaired = jsonrepair(content);
        JSON.parse(repaired);
        content = repaired;
        console.log('[callLLM] JSON repaired successfully using jsonrepair.');
      } catch (repairErr: any) {
        console.error('[callLLM] jsonrepair failed. Attempting brace/bracket balancing...', repairErr.message);
        try {
          let tempJson = content.trim();
          if (tempJson.endsWith(',')) {
            tempJson = tempJson.slice(0, -1);
          }
          const openBraces = (tempJson.match(/\{/g) || []).length;
          const closeBraces = (tempJson.match(/\}/g) || []).length;
          const openBrackets = (tempJson.match(/\[/g) || []).length;
          const closeBrackets = (tempJson.match(/\]/g) || []).length;

          let suffix = '';
          if (openBrackets > closeBrackets) {
            suffix += ']'.repeat(openBrackets - closeBrackets);
          }
          if (openBraces > closeBraces) {
            suffix += '}'.repeat(openBraces - closeBraces);
          }

          const balanced = jsonrepair(tempJson + suffix);
          JSON.parse(balanced);
          content = balanced;
          console.log('[callLLM] JSON balanced and repaired successfully.');
        } catch (balanceErr: any) {
          console.error('[callLLM] Secondary brace balancing failed. Returning raw content anyway.', balanceErr.message);
        }
      }
    }
  }

  return { content, usage };
}

export async function streamLLM(opts: LLMStreamOptions): Promise<Response> {
  const { provider, apiKey, systemPrompt, userMessage, prompt, temperature, maxTokens, model } = opts;

  let fetchUrl = '';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  let bodyPayload: any = {};

  if (provider === 'openai') {
    fetchUrl = 'https://api.openai.com/v1/chat/completions';
    headers['Authorization'] = `Bearer ${apiKey}`;
    bodyPayload = {
      model: model || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      response_format: { type: 'json_object' },
      stream: true,
      stream_options: { include_usage: true },
      ...(temperature !== undefined ? { temperature } : {}),
      ...(maxTokens !== undefined ? { max_tokens: maxTokens } : {}),
    };
  } else if (provider === 'anthropic') {
    fetchUrl = 'https://api.anthropic.com/v1/messages';
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
    bodyPayload = {
      model: model || 'claude-3-5-sonnet-20241022',
      max_tokens: maxTokens || 4000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage }
      ],
      stream: true,
      ...(temperature !== undefined ? { temperature } : {}),
    };
  } else if (provider === 'deepseek') {
    fetchUrl = 'https://api.deepseek.com/chat/completions';
    headers['Authorization'] = `Bearer ${apiKey}`;
    bodyPayload = {
      model: model || 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      response_format: { type: 'json_object' },
      stream: true,
      stream_options: { include_usage: true },
      ...(temperature !== undefined ? { temperature } : {}),
      ...(maxTokens !== undefined ? { max_tokens: maxTokens } : {}),
    };
  } else {
    throw new Error(`Unsupported provider for streaming: ${provider}`);
  }

  const response = await fetch(fetchUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyPayload),
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.error?.message || `${provider} API streaming returned status ${response.status}`);
  }

  let resultText = '';
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
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
              const rawData = cleaned.substring(6);
              const parsed = JSON.parse(rawData);

              let text = '';
              let usage: any = null;

              if (provider === 'openai' || provider === 'deepseek') {
                text = parsed.choices[0]?.delta?.content || '';
                if (parsed.usage) {
                  usage = {
                    promptTokens: parsed.usage.prompt_tokens,
                    completionTokens: parsed.usage.completion_tokens,
                    totalTokens: parsed.usage.total_tokens,
                  };
                }
              } else if (provider === 'anthropic') {
                if (parsed.type === 'message_start') {
                  const inputTokens = parsed.message?.usage?.input_tokens || 0;
                  usage = { promptTokens: inputTokens, completionTokens: 0, totalTokens: inputTokens };
                } else if (parsed.type === 'content_block_delta') {
                  text = parsed.delta?.text || '';
                } else if (parsed.type === 'message_delta') {
                  const outputTokens = parsed.usage?.output_tokens || 0;
                  usage = { promptTokens: 0, completionTokens: outputTokens, totalTokens: outputTokens };
                }
              }

              if (text) {
                resultText += text;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              }
              if (usage) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ usage })}\n\n`));
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
          try {
            // Reprompt non-stream using callLLM for unified correction block
            const correctionPrompt = `Here is the malformed JSON output you previously generated for prompt: "${prompt}".\nIt has the following error: ${err.message}.\n\nPlease fix the JSON string and return ONLY the fully corrected valid JSON object strictly complying with the schema. No markdown formatting.\n\nBad output:\n${resultText}`;
            
            const correctionRes = await callLLM({
              provider,
              apiKey,
              systemPrompt,
              userMessage: correctionPrompt,
              jsonMode: true,
              temperature: 0.1,
              model: provider === 'openai' ? 'gpt-4o' : provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'deepseek-chat',
            });

            if (correctionRes.content) {
              resultText = correctionRes.content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: '\n\n/* corrected */\n\n' + correctionRes.content })}\n\n`));
            }
          } catch (corrErr) {
            console.error('Self-correction failure:', corrErr);
          }
        }
      }

      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
