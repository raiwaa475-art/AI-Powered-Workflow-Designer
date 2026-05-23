import { NextRequest } from 'next/server';
import JSZip from 'jszip';
import { getProviderConfig } from '@/lib/providerSession';

const SYSTEM_PROMPT = `You are a Senior Systems Architect and Reverse Engineering Agent.
Your job is to read the provided source code folder structure, key configuration contents, and AST-extracted architectural hints, then reconstruct a complete, beautiful architecture diagram blueprint.
You MUST output ONLY a valid JSON object matching our standard system schema. No markdown wrapping. Output pure JSON.

JSON Blueprint Output Schema:
{
  "explanation": "string (Short summary of the parsed code structure, identified frameworks, and databases)",
  "blueprint": {
    "title": "string (Clean, professional system title)",
    "description": "string (Overview of what this project code accomplishes)",
    "layers": [
      {
        "id": "presentation" | "application" | "queue" | "data",
        "name": "string (Layer Title, e.g. Client Portal, Core Engines, Message brokers, Databases)",
        "nodes": [
          {
            "id": "string (unique-kebab-case-id)",
            "name": "string (e.g. Order Processing Service)",
            "type": "string (e.g. Express API Gateway, Kafka Broker, PostgreSQL Cluster)",
            "description": "string (Brief summary of this node's exact role in the code, matched files, and framework)"
          }
        ]
      }
    ],
    "steps": [
      {
        "id": "string",
        "number": 1,
        "title": "string (Action step title)",
        "description": "string (Detailed operational flow, showing how data passes between nodes)",
        "involved_nodes": ["string (node IDs involved in this step)"]
      }
    ]
  }
}

Guidelines:
1. Translate code modules to appropriate layers:
   - Web portals, CLI tools, mobile apps, or API gateways belong in "presentation".
   - Backend servers, worker controllers, routers belong in "application".
   - RabbitMQ, Kafka, SQS queues belong in "queue".
   - Cache databases (Redis), relational databases (PostgreSQL, MySQL), or NoSQL databases (MongoDB) belong in "data".
2. Match dependencies found in config files:
   - "pg" or "sequelize" -> PostgreSQL Database.
   - "redis" or "ioredis" -> Redis Cache.
   - "kafkajs" -> Apache Kafka Broker.
   - "express", "fastapi", "gin" -> API Services.
3. Keep the nodes fully linked by defining 3-5 operational steps that describe standard request routing in the code.
4. Output all titles and explanations in the requested language (Thai or English).`;

export async function POST(req: NextRequest) {
  try {
    const { repoUrl, zipBase64, language } = await req.json();
    const lang = language || 'th';

    // Read provider + API key from HttpOnly cookie
    const { provider, apiKey } = getProviderConfig(req);

    if (provider === 'mock') {
      const { getMockReverseEngineer } = await import('@/lib/mockAgentEngine');
      const mockResult = getMockReverseEngineer({ repoUrl, zipBase64 }, lang);
      return new Response(JSON.stringify(mockResult), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let fileFingerprint: any = {
      detectedFrameworks: [] as string[],
      detectedDatabases: [] as string[],
      detectedQueues: [] as string[],
      fileCount: 0,
      endpointsFound: [] as string[],
      structureSummary: "",
      rawDetails: ""
    };

    // 1. AST Static Scan ZIP files if base64 provided
    if (zipBase64) {
      try {
        const zipBuffer = Buffer.from(zipBase64, 'base64');
        const zip = await JSZip.loadAsync(zipBuffer);
        fileFingerprint.fileCount = Object.keys(zip.files).length;

        let readmeContent = "";
        let packageJsonContent = "";
        let dockerComposeContent = "";

        // Scan the files inside ZIP
        for (const [filename, fileObj] of Object.entries(zip.files)) {
          if (fileObj.dir) continue;

          const lowercaseName = filename.toLowerCase();

          // Read package.json / requirements.txt / go.mod for dependency checking
          if (lowercaseName.endsWith('package.json')) {
            packageJsonContent = await fileObj.async('string');
            fileFingerprint.detectedFrameworks.push("Node.js (Next/Express)");
            if (packageJsonContent.includes('"pg"') || packageJsonContent.includes('"sequelize"')) fileFingerprint.detectedDatabases.push("PostgreSQL");
            if (packageJsonContent.includes('"mongodb"') || packageJsonContent.includes('"mongoose"')) fileFingerprint.detectedDatabases.push("MongoDB");
            if (packageJsonContent.includes('"redis"') || packageJsonContent.includes('"ioredis"')) fileFingerprint.detectedDatabases.push("Redis");
            if (packageJsonContent.includes('"kafkajs"')) fileFingerprint.detectedQueues.push("Apache Kafka");
            if (packageJsonContent.includes('"amqplib"')) fileFingerprint.detectedQueues.push("RabbitMQ");
          }
          else if (lowercaseName.endsWith('requirements.txt')) {
            const reqs = await fileObj.async('string');
            fileFingerprint.detectedFrameworks.push("Python (FastAPI/Flask)");
            if (reqs.includes('fastapi') || reqs.includes('uvicorn')) fileFingerprint.detectedFrameworks.push("FastAPI Service");
            if (reqs.includes('sqlalchemy') || reqs.includes('psycopg2')) fileFingerprint.detectedDatabases.push("PostgreSQL");
            if (reqs.includes('pymongo')) fileFingerprint.detectedDatabases.push("MongoDB");
            if (reqs.includes('redis')) fileFingerprint.detectedDatabases.push("Redis");
            if (reqs.includes('celery')) fileFingerprint.detectedQueues.push("Celery Task Queue");
          }
          else if (lowercaseName.endsWith('go.mod')) {
            const mod = await fileObj.async('string');
            fileFingerprint.detectedFrameworks.push("Go (Gin/Fiber)");
            if (mod.includes('gin-gonic')) fileFingerprint.detectedFrameworks.push("Gin Router");
            if (mod.includes('go-redis')) fileFingerprint.detectedDatabases.push("Redis");
            if (mod.includes('gorm')) fileFingerprint.detectedDatabases.push("Relational SQL Database");
          }
          else if (lowercaseName.includes('docker-compose.yml') || lowercaseName.includes('docker-compose.yaml')) {
            dockerComposeContent = await fileObj.async('string');
          }
          else if (lowercaseName.endsWith('readme.md')) {
            readmeContent = await fileObj.async('string');
          }

          // Scan individual file source codes briefly for routing and imports
          if (lowercaseName.endsWith('.ts') || lowercaseName.endsWith('.js') || lowercaseName.endsWith('.py') || lowercaseName.endsWith('.go')) {
            const text = await fileObj.async('string');
            // Static analysis scan
            if (text.includes('router.get(') || text.includes('app.get(') || text.includes('app.post(')) {
              fileFingerprint.endpointsFound.push(`${filename} (REST Routes)`);
            }
            if (text.includes('Client(') && text.includes('pg')) fileFingerprint.detectedDatabases.push("PostgreSQL");
            if (text.includes('new Redis(') || text.includes('createClient(')) fileFingerprint.detectedDatabases.push("Redis");
            if (text.includes('new Kafka(') || text.includes('kafkajs')) fileFingerprint.detectedQueues.push("Apache Kafka");
          }
        }

        // Aggregate static analysis structure summary
        fileFingerprint.structureSummary = `Scanned ${fileFingerprint.fileCount} source files. Found dependencies: ${fileFingerprint.detectedFrameworks.join(', ') || 'Standard server'}. Databases identified: ${fileFingerprint.detectedDatabases.join(', ') || 'N/A'}. Messaging queues: ${fileFingerprint.detectedQueues.join(', ') || 'N/A'}.`;
        
        let details = "";
        if (readmeContent) details += `\n--- README.md ---\n${readmeContent.substring(0, 1000)}\n`;
        if (packageJsonContent) details += `\n--- package.json ---\n${packageJsonContent}\n`;
        if (dockerComposeContent) details += `\n--- docker-compose.yml ---\n${dockerComposeContent.substring(0, 1000)}\n`;
        fileFingerprint.rawDetails = details;

      } catch (err) {
        console.error("ZIP scanning error, falling back to basic analysis:", err);
      }
    } 
    else if (repoUrl) {
      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) {
        throw new Error("Invalid GitHub repository URL. Must be in the format: https://github.com/owner/repo");
      }
      const owner = match[1];
      const repo = match[2].replace(/\.git$/, '');

      const headers: Record<string, string> = {
        'User-Agent': 'AI-Powered-Workflow-Designer-Agent'
      };
      if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
      }

      // 1. Get default branch dynamically
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      if (!repoRes.ok) {
        throw new Error(`Failed to fetch repository info from GitHub: ${repoRes.statusText} (Is the repository public?)`);
      }
      const repoData = await repoRes.json();
      const defaultBranch = repoData.default_branch || 'main';

      // 2. Fetch recursive git tree
      const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`, { headers });
      if (!treeRes.ok) {
        throw new Error(`Failed to fetch file tree from GitHub: ${treeRes.statusText}`);
      }
      const treeData = await treeRes.json();
      const files: any[] = treeData.tree || [];

      fileFingerprint.fileCount = files.length;

      // Filter and capture contents of configuration and README files
      let readmeContent = "";
      let packageJsonContent = "";
      let dockerComposeContent = "";

      const sourceFilesToScan: string[] = [];

      for (const file of files) {
        if (file.type !== 'blob') continue;

        const path = file.path;
        const lowercasePath = path.toLowerCase();

        // Download specific configuration and information files
        if (lowercasePath.endsWith('package.json')) {
          try {
            const fileRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${path}`);
            if (fileRes.ok) {
              packageJsonContent = await fileRes.text();
              fileFingerprint.detectedFrameworks.push("Node.js (Next/Express)");
              if (packageJsonContent.includes('"pg"') || packageJsonContent.includes('"sequelize"')) fileFingerprint.detectedDatabases.push("PostgreSQL");
              if (packageJsonContent.includes('"mongodb"') || packageJsonContent.includes('"mongoose"')) fileFingerprint.detectedDatabases.push("MongoDB");
              if (packageJsonContent.includes('"redis"') || packageJsonContent.includes('"ioredis"')) fileFingerprint.detectedDatabases.push("Redis");
              if (packageJsonContent.includes('"kafkajs"')) fileFingerprint.detectedQueues.push("Apache Kafka");
              if (packageJsonContent.includes('"amqplib"')) fileFingerprint.detectedQueues.push("RabbitMQ");
            }
          } catch (_) {}
        }
        else if (lowercasePath.endsWith('requirements.txt')) {
          try {
            const fileRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${path}`);
            if (fileRes.ok) {
              const reqs = await fileRes.text();
              fileFingerprint.detectedFrameworks.push("Python (FastAPI/Flask)");
              if (reqs.includes('fastapi') || reqs.includes('uvicorn')) fileFingerprint.detectedFrameworks.push("FastAPI Service");
              if (reqs.includes('sqlalchemy') || reqs.includes('psycopg2')) fileFingerprint.detectedDatabases.push("PostgreSQL");
              if (reqs.includes('pymongo')) fileFingerprint.detectedDatabases.push("MongoDB");
              if (reqs.includes('redis')) fileFingerprint.detectedDatabases.push("Redis");
              if (reqs.includes('celery')) fileFingerprint.detectedQueues.push("Celery Task Queue");
            }
          } catch (_) {}
        }
        else if (lowercasePath.endsWith('go.mod')) {
          try {
            const fileRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${path}`);
            if (fileRes.ok) {
              const mod = await fileRes.text();
              fileFingerprint.detectedFrameworks.push("Go (Gin/Fiber)");
              if (mod.includes('gin-gonic')) fileFingerprint.detectedFrameworks.push("Gin Router");
              if (mod.includes('go-redis')) fileFingerprint.detectedDatabases.push("Redis");
              if (mod.includes('gorm')) fileFingerprint.detectedDatabases.push("Relational SQL Database");
            }
          } catch (_) {}
        }
        else if (lowercasePath.includes('docker-compose.yml') || lowercasePath.includes('docker-compose.yaml')) {
          try {
            const fileRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${path}`);
            if (fileRes.ok) {
              dockerComposeContent = await fileRes.text();
            }
          } catch (_) {}
        }
        else if (lowercasePath.endsWith('readme.md')) {
          try {
            const fileRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${path}`);
            if (fileRes.ok) {
              readmeContent = await fileRes.text();
            }
          } catch (_) {}
        }
        else if (lowercasePath.endsWith('.ts') || lowercasePath.endsWith('.js') || lowercasePath.endsWith('.py') || lowercasePath.endsWith('.go')) {
          if (lowercasePath.includes('route') || lowercasePath.includes('controller') || lowercasePath.includes('server') || lowercasePath.includes('app') || lowercasePath.includes('main')) {
            sourceFilesToScan.push(path);
          }
        }
      }

      // Scan up to 10 key source files for routing definitions
      const filesToFetch = sourceFilesToScan.slice(0, 10);
      for (const path of filesToFetch) {
        try {
          const fileRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${path}`);
          if (fileRes.ok) {
            const text = await fileRes.text();
            const filename = path.split('/').pop() || path;
            
            if (text.includes('router.get(') || text.includes('app.get(') || text.includes('app.post(') || text.includes('router.post(')) {
              fileFingerprint.endpointsFound.push(`${filename} (REST Routes)`);
            }
            if (text.includes('Client(') && text.includes('pg')) fileFingerprint.detectedDatabases.push("PostgreSQL");
            if (text.includes('new Redis(') || text.includes('createClient(')) fileFingerprint.detectedDatabases.push("Redis");
            if (text.includes('new Kafka(') || text.includes('kafkajs')) fileFingerprint.detectedQueues.push("Apache Kafka");
          }
        } catch (_) {}
      }

      // Aggregate static analysis structure summary
      fileFingerprint.structureSummary = `Scanned ${fileFingerprint.fileCount} files in GitHub tree recursively for branch '${defaultBranch}'. Found dependencies: ${fileFingerprint.detectedFrameworks.join(', ') || 'Standard server'}. Databases identified: ${fileFingerprint.detectedDatabases.join(', ') || 'N/A'}. Messaging queues: ${fileFingerprint.detectedQueues.join(', ') || 'N/A'}.`;
      
      let details = "";
      if (readmeContent) details += `\n--- README.md ---\n${readmeContent.substring(0, 1000)}\n`;
      if (packageJsonContent) details += `\n--- package.json ---\n${packageJsonContent}\n`;
      if (dockerComposeContent) details += `\n--- docker-compose.yml ---\n${dockerComposeContent.substring(0, 1000)}\n`;
      fileFingerprint.rawDetails = details;
    } else {
      return new Response(JSON.stringify({ error: 'Please provide either a ZIP file upload or a GitHub repository link.' }), { status: 400 });
    }

    if (!apiKey) {
      throw new Error(`API Authentication Key for ${provider} is missing. Please configure it in Engine Settings.`);
    }

    // 4. OpenAI / Claude Integrations
    const finalSystemPrompt = SYSTEM_PROMPT + `\nSelected Output Language: ${lang === 'th' ? 'THAI' : 'ENGLISH'}`;
    const payloadQuery = `AST Extraction File Fingerprints:\n${JSON.stringify(fileFingerprint, null, 2)}\n\nReconstruct a clean architecture diagram from this code state structure. Ensure nodes match dependencies (e.g. pg package maps to a postgresql database, kafkajs to a kafka broker).`;

    if (provider === 'openai') {
      const openAiKey = apiKey || process.env.OPENAI_API_KEY;
      if (!openAiKey) throw new Error('OpenAI key missing');

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
            { role: 'user', content: payloadQuery }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1
        })
      });

      if (!response.ok) throw new Error('OpenAI reverse engineering query failed');

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

    if (provider === 'anthropic') {
      const claudeKey = apiKey || process.env.ANTHROPIC_API_KEY;
      if (!claudeKey) throw new Error('Claude key missing');

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          system: finalSystemPrompt,
          messages: [{ role: 'user', content: payloadQuery }],
          temperature: 0.1
        })
      });

      if (!response.ok) throw new Error('Claude reverse engineering query failed');

      const resData = await response.json();
      const text = resData.content[0]?.text || '{}';
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const promptTokens = resData.usage?.input_tokens || 0;
      const completionTokens = resData.usage?.output_tokens || 0;
      const totalTokens = promptTokens + completionTokens;
      return new Response(cleaned, {
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
      if (!deepSeekKey) throw new Error('DeepSeek key missing');

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
            { role: 'user', content: payloadQuery }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1
        })
      });

      if (!response.ok) throw new Error('DeepSeek reverse engineering query failed');

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
    console.error("Reverse Engineering failure:", error);
    return new Response(JSON.stringify({ error: error.message || 'Server error reverse engineering source files' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
