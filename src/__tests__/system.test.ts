/**
 * @jest-environment node
 */

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import crypto from 'crypto';
import WebSocket from 'ws';
import { NextRequest } from 'next/server';

// Import our server API route handlers directly
import { POST as generateHandler } from '../app/api/generate/route';
import { POST as resiliencyHandler } from '../app/api/analyze-resiliency/route';
import { POST as scaleHandler } from '../app/api/analyze-scale/route';
import { POST as modifyBlueprintHandler } from '../app/api/modify-blueprint/route';
import { POST as generatePromptsHandler } from '../app/api/generate-prompts/route';
import { POST as generateQuestionsHandler } from '../app/api/generate-questions/route';
import { GET as collabTokenHandler } from '../app/api/collab-token/route';
import { GET as getProviderHandler } from '../app/api/get-provider/route';
import { POST as setProviderHandler, DELETE as deleteProviderHandler } from '../app/api/set-provider/route';
import { POST as chatHandler } from '../app/api/chat/route';
import { POST as reverseEngineerHandler } from '../app/api/reverse-engineer/route';

describe('System Integration & E2E Test Suite', () => {
  
  // ─── 1. Next.js API Routes Integration Tests ──────────────────────────────────
  describe('AI Agent API Route Endpoints', () => {
    it('should handle Blueprint Agent generation request in simulation mode', async () => {
      const mockReqBody = {
        prompt: 'Concert ticket booking system',
        language: 'en'
      };

      const request = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        body: JSON.stringify(mockReqBody),
      });

      const response = await generateHandler(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/event-stream');

      // Since it's a stream, we can read the response body as text / buffer
      const reader = response.body?.getReader();
      let streamContent = '';
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = new TextDecoder().decode(value);
          const sseLines = chunk.split('\n');
          for (const sseLine of sseLines) {
            if (sseLine.startsWith('data: ')) {
              const dataStr = sseLine.substring(6).trim();
              if (dataStr === '[DONE]') continue;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  streamContent += parsed.text;
                }
              } catch (e) {
                // Ignore partial JSON parsing errors
              }
            }
          }
        }
      }
      
      expect(streamContent.length).toBeGreaterThan(0);
      expect(streamContent).toContain('Concert ticket booking system');
    });

    it('should analyze resiliency and return node risks', async () => {
      const mockReqBody = {
        blueprint: {
          title: 'Ticket System',
          description: 'SaaS ticketing layout',
          layers: [
            {
              id: 'presentation',
              name: 'Client Tiers',
              nodes: [{ id: 'api-gw', name: 'API Gateway', type: 'Gateway', description: 'Entry point' }]
            }
          ],
          steps: []
        },
        language: 'en'
      };

      const request = new NextRequest('http://localhost:3000/api/analyze-resiliency', {
        method: 'POST',
        body: JSON.stringify(mockReqBody),
      });

      const response = await resiliencyHandler(request);
      expect(response.status).toBe(200);
      
      const json = await response.json();
      expect(json).toHaveProperty('node_risks');
      expect(json).toHaveProperty('step_flows');
      expect(json.node_risks.length).toBeGreaterThanOrEqual(0);
    });

    it('should compute load sizing profiles in Thai language', async () => {
      const mockReqBody = {
        blueprint: {
          title: 'รถเช่าไฟฟ้า',
          description: 'ระบบ IoT คุมรถจักรยาน',
          layers: [],
          steps: []
        },
        language: 'th',
        backendStack: 'node-express'
      };

      const request = new NextRequest('http://localhost:3000/api/analyze-scale', {
        method: 'POST',
        body: JSON.stringify(mockReqBody),
      });

      const response = await scaleHandler(request);
      expect(response.status).toBe(200);
      
      const json = await response.json();
      expect(json).toHaveProperty('load_estimates');
      expect(json).toHaveProperty('deploy_stages');
      expect(json).toHaveProperty('optimization_configs');
      expect(json.load_estimates[0].tier).toBe('Small');
    });

    it('should handle modify blueprint agent requests and return modifications patch', async () => {
      const mockReqBody = {
        blueprint: {
          title: 'E-Commerce system',
          layers: [],
          steps: []
        },
        prompt: 'Change database to MongoDB',
        language: 'en'
      };

      const request = new NextRequest('http://localhost:3000/api/modify-blueprint', {
        method: 'POST',
        body: JSON.stringify(mockReqBody),
      });

      const response = await modifyBlueprintHandler(request);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toHaveProperty('explanation');
      expect(json).toHaveProperty('modifications');
      expect(json.modifications).toHaveProperty('nodes_to_add_or_update');
      expect(json.modifications).toHaveProperty('nodes_to_remove');
    });

    it('should handle generate prompts requests and slice architecture into 3 phases', async () => {
      const mockReqBody = {
        blueprint: {
          title: 'Ticket Engine',
          layers: [
            {
              id: 'data',
              name: 'Databases',
              nodes: [{ id: 'redis-lock', name: 'Redis Cache', type: 'Cache' }]
            }
          ],
          steps: []
        },
        scaleInfo: {},
        language: 'th'
      };

      const request = new NextRequest('http://localhost:3000/api/generate-prompts', {
        method: 'POST',
        body: JSON.stringify(mockReqBody),
      });

      const response = await generatePromptsHandler(request);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toHaveProperty('explanation');
      expect(json).toHaveProperty('phases');
      expect(json.phases.length).toBeGreaterThanOrEqual(3);
      expect(json.phases[0]).toHaveProperty('ai_instructions_prompt');
      expect(json.phases[0]).toHaveProperty('definition_of_done');
    });

    it('should formulate target business logic questions for the designer', async () => {
      const mockReqBody = {
        blueprint: {
          title: 'E-Bike Rent Platform',
          layers: [],
          steps: []
        },
        language: 'en'
      };

      const request = new NextRequest('http://localhost:3000/api/generate-questions', {
        method: 'POST',
        body: JSON.stringify(mockReqBody),
      });

      const response = await generateQuestionsHandler(request);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toHaveProperty('questions');
      expect(json.questions.length).toBeGreaterThanOrEqual(1);
      expect(json.questions[0]).toHaveProperty('question');
    });

    it('should generate secure room HMAC tokens for collaboration paths', async () => {
      const request = new NextRequest('http://localhost:3000/api/collab-token?room=workspace-session-abc', {
        method: 'GET'
      });

      const response = await collabTokenHandler(request);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toHaveProperty('token');
      expect(json.token.length).toBe(64); // 64 hex characters for SHA-256 HMAC
    });

    it('should set, retrieve, decrypt, and clear LLM credentials using secure HttpOnly cookies', async () => {
      // 1. POST to /api/set-provider
      const setReq = new NextRequest('http://localhost:3000/api/set-provider', {
        method: 'POST',
        body: JSON.stringify({
          provider: 'deepseek',
          apiKey: 'my-super-secret-deepseek-key-2026'
        })
      });
      const setRes = await setProviderHandler(setReq);
      expect(setRes.status).toBe(200);
      
      const cookie = setRes.cookies.get('wfd_provider_cfg');
      expect(cookie).toBeDefined();

      // 2. GET from /api/get-provider using encrypted cookie
      const getReq = new NextRequest('http://localhost:3000/api/get-provider', {
        method: 'GET'
      });
      getReq.cookies.set('wfd_provider_cfg', cookie!.value);

      const getRes = await getProviderHandler(getReq);
      expect(getRes.status).toBe(200);
      const getJson = await getRes.json();
      expect(getJson.configured).toBe(true);
      expect(getJson.provider).toBe('deepseek');
      expect(getJson.maskedKey).toContain('my-s');
      expect(getJson.maskedKey).toContain('2026');

      // 3. DELETE configuration
      const delRes = await deleteProviderHandler();
      expect(delRes.status).toBe(200);
    });

    it('should respond to architect chat agent requests in simulation mode', async () => {
      const mockReqBody = {
        message: 'How should I optimize seat allocation locks?',
        blueprint: {
          layers: [{ id: 'data', name: 'Cache Layer', nodes: [{ id: 'redis-lock', name: 'Redis', type: 'Cache' }] }]
        },
        language: 'th'
      };

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(mockReqBody),
      });

      const response = await chatHandler(request);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toHaveProperty('answer');
      expect(json.answer).toContain('Cache Layer');
    });

    it('should static scan and reverse engineer code AST layouts', async () => {
      const mockReqBody = {
        zipBase64: 'UEsDBAoAAAAAAIiDk1YAAAAAAAAAAAAAAAAFAAAAc3JjL/VQsQoAIAgD/Z4eH2/rLwKxNfgEHTyCS69/rEDQwsDCwMLAwtDDBQSwECFAAKAAAAAAIiDk1YAAAAAAAAAAAAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAc3JjL1BLBQYAAAAAAQABAEQAAAA8AAAAAAA=',
        language: 'th'
      };

      const request = new NextRequest('http://localhost:3000/api/reverse-engineer', {
        method: 'POST',
        body: JSON.stringify(mockReqBody),
      });

      const response = await reverseEngineerHandler(request);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toHaveProperty('explanation');
      expect(json).toHaveProperty('blueprint');
      expect(json.blueprint).toHaveProperty('title');
      expect(json.blueprint).toHaveProperty('layers');
    });
  });

  // ─── 2. Collaboration Server E2E Tests ──────────────────────────────────────────
  describe('Multiplayer Collaboration Server', () => {
    let serverProcess: ChildProcess;
    const TEST_PORT = '3009';
    const TEST_SECRET = 'test-collab-secret-999';
    const ROOM_ID = 'integration-test-room';

    beforeAll((done) => {
      // Spawn collab-server.js in a separate background process
      const serverPath = path.resolve(__dirname, '../../collab-server.js');
      
      serverProcess = spawn('node', [serverPath], {
        env: {
          ...process.env,
          PORT: TEST_PORT,
          COLLAB_SECRET: TEST_SECRET,
          NODE_ENV: 'development'
        }
      });

      serverProcess.stdout?.on('data', (data) => {
        const text = data.toString();
        // Wait for server connection logs
        if (text.includes('📡 Space-Age Collaboration Server')) {
          done();
        }
      });

      serverProcess.stderr?.on('data', (data) => {
        console.error('[Collab Server Error LOG]:', data.toString());
      });
    });

    afterAll((done) => {
      // Clean shutdown of collaboration server
      if (serverProcess) {
        serverProcess.kill('SIGTERM');
      }
      done();
    });

    function generateHMAC(roomId: string, secret: string) {
      return crypto
        .createHmac('sha256', secret)
        .update(`${roomId}:${secret}`)
        .digest('hex');
    }

    it('should connect two WebSocket clients, authenticate via HMAC, and broadcast cursor moves', (done) => {
      const token = generateHMAC(ROOM_ID, TEST_SECRET);
      const wsUrl = `ws://localhost:${TEST_PORT}?room=${ROOM_ID}&token=${token}`;

      const client1 = new WebSocket(wsUrl);
      const client2 = new WebSocket(wsUrl);

      let client1Id = '';
      let client2Id = '';
      let welcomeCount = 0;

      // Assert client connections
      client1.on('open', () => {
        // Connected successfully
      });

      client2.on('open', () => {
        // Connected successfully
      });

      client1.on('message', (dataRaw) => {
        const data = JSON.parse(dataRaw.toString());
        if (data.type === 'welcome') {
          client1Id = data.payload.yourId;
          welcomeCount++;
          checkWelcomeCompleted();
        }
      });

      client2.on('message', (dataRaw) => {
        const data = JSON.parse(dataRaw.toString());
        if (data.type === 'welcome') {
          client2Id = data.payload.yourId;
          welcomeCount++;
          checkWelcomeCompleted();
        } else if (data.type === 'cursor_move') {
          // Verify that client 2 received the broadcast move event from client 1
          expect(data.senderId).toBe(client1Id);
          expect(data.payload.x).toBe(150);
          expect(data.payload.y).toBe(280);
          
          client1.close();
          client2.close();
          done();
        }
      });

      function checkWelcomeCompleted() {
        if (welcomeCount === 2) {
          // Both clients are welcome. Let client 1 send a cursor move packet
          client1.send(JSON.stringify({
            type: 'cursor_move',
            payload: { x: 150, y: 280 }
          }));
        }
      }
    });

    it('should reject client connection with invalid HMAC token signature', (done) => {
      const invalidToken = 'wrong-crypto-hmac-hash';
      const wsUrl = `ws://localhost:${TEST_PORT}?room=${ROOM_ID}&token=${invalidToken}`;

      const client = new WebSocket(wsUrl);

      client.on('error', () => {
        // Error expected on handshake refusal
      });

      client.on('close', (code, reason) => {
        // Code 4001 indicates unauthorized gate closed
        expect(code).toBe(4001);
        expect(reason.toString()).toContain('Unauthorized');
        done();
      });
    });
  });
});
