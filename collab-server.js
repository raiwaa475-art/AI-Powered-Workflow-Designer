const { WebSocketServer, WebSocket } = require('ws');
const { createHmac } = require('crypto');

const PORT = 3002;
const wss = new WebSocketServer({ port: PORT });

// ─── Auth Secret ───────────────────────────────────────────────────────────────
// Set COLLAB_SECRET in your .env or environment to a strong random string.
// Client must use the matching NEXT_PUBLIC_COLLAB_SECRET value.
// Falls back to a hardcoded dev-only secret so the dev workflow still works
// without configuration.
const COLLAB_SECRET = process.env.COLLAB_SECRET || 'dev-collab-secret-2025';

/**
 * Validates the HMAC token sent by the client.
 * Expected format: HMAC-SHA256( "${roomId}:${COLLAB_SECRET}", COLLAB_SECRET )
 *
 * @param {string} roomId
 * @param {string} token - hex-encoded HMAC from the client
 * @returns {boolean}
 */
function validateToken(roomId, token) {
  if (!token || typeof token !== 'string') return false;
  try {
    const expected = createHmac('sha256', COLLAB_SECRET)
      .update(`${roomId}:${COLLAB_SECRET}`)
      .digest('hex');
    // Constant-time comparison to prevent timing attacks
    if (expected.length !== token.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

console.log(`📡 Space-Age Collaboration Server spinning up on ws://localhost:${PORT}`);

// Active room connections registry (local connections on this process)
// RoomId -> Map of ClientId -> User State
const rooms = new Map();

// ─── Pluggable Redis pub/sub + caching scaleout configuration ───────────────────
const REDIS_URL = process.env.REDIS_URL;
let redisClient = null;
let redisPub = null;
let redisSub = null;

if (REDIS_URL) {
  try {
    const { createClient } = require('redis');
    console.log(`🔄 Redis Scale-out: Connecting to Redis at ${REDIS_URL}...`);
    
    redisClient = createClient({ url: REDIS_URL });
    redisPub = createClient({ url: REDIS_URL });
    redisSub = createClient({ url: REDIS_URL });

    redisClient.on('error', (err) => console.error('Redis Client Error:', err));
    redisPub.on('error', (err) => console.error('Redis Pub Error:', err));
    redisSub.on('error', (err) => console.error('Redis Sub Error:', err));

    async function initRedis() {
      await redisClient.connect();
      await redisPub.connect();
      await redisSub.connect();
      console.log('✅ Connected to Redis. Multiplayer horizontal scale-out enabled!');
      
      // Subscribe to all room channels
      await redisSub.pSubscribe('collab:room:*', (message, channel) => {
        try {
          const roomId = channel.replace('collab:room:', '');
          const packet = JSON.parse(message);
          
          // Broadcast to local WebSocket clients in this room
          const roomUsers = rooms.get(roomId);
          if (roomUsers) {
            const rawString = JSON.stringify(packet);
            for (const [id, client] of roomUsers.entries()) {
              if (id !== packet.senderId && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(rawString);
              }
            }
          }
        } catch (err) {
          console.error('[Redis Sub] Message handler error:', err);
        }
      });
    }

    initRedis().catch(err => {
      console.error('❌ Redis failed to connect. Falling back to local In-Memory mode:', err);
      redisClient = null;
      redisPub = null;
      redisSub = null;
    });
  } catch (err) {
    console.error('❌ Redis dynamic load failed. Falling back to In-Memory mode:', err);
  }
} else {
  console.log('ℹ️ Redis URL not set. Running in single-instance in-memory fallback mode.');
}

const ADJECTIVES = ['Obsidian', 'Nebula', 'Quantum', 'Glitch', 'Cyber', 'Neon', 'Cosmic', 'Solar', 'Aero', 'Aether'];
const ROLES = ['Architect', 'DevOps', 'Engineer', 'Synthesizer', 'Strategist', 'Designer', 'Oracle', 'Sentry'];
const NEON_COLORS = [
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#eab308', // Yellow
  '#f43f5e'  // Rose
];

function generateUserIdentity() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const role = ROLES[Math.floor(Math.random() * ROLES.length)];
  const name = `${adj} ${role}`;
  const color = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
  return { name, color };
}

wss.on('connection', async (ws, req) => {
  // Parse URL params
  const urlParams = new URLSearchParams(req.url.split('?')[1] || '');
  const roomId = urlParams.get('room') || 'default-room';
  const token  = urlParams.get('token') || '';

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (!validateToken(roomId, token)) {
    console.warn(`🚫 Rejected unauthenticated connection attempt for room: ${roomId}`);
    ws.close(4001, 'Unauthorized: Invalid or missing collaboration token.');
    return;
  }

  const clientId = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const { name, color } = generateUserIdentity();

  // Create room mapping if absent
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Map());
  }
  const roomUsers = rooms.get(roomId);

  const userProfile = {
    id: clientId,
    username: name,
    color: color,
    cursor: { x: 0, y: 0 },
    isPresenter: false
  };

  // Register local client mapping
  roomUsers.set(clientId, { ws, profile: userProfile });

  console.log(`⚡ [Room: ${roomId}] ${name} joined (ID: ${clientId})`);

  // Write profile to Redis Cache if available
  if (redisClient) {
    try {
      await redisClient.hSet(`collab:room:${roomId}:users`, clientId, JSON.stringify(userProfile));
    } catch (err) {
      console.error('Failed to cache user profile in Redis:', err);
    }
  }

  // 1. Fetch existing users globally (across all servers using Redis Cache, or locally)
  let activeUsers = [];
  if (redisClient) {
    try {
      const rawUsers = await redisClient.hGetAll(`collab:room:${roomId}:users`);
      activeUsers = Object.entries(rawUsers)
        .filter(([id]) => id !== clientId)
        .map(([_, rawStr]) => JSON.parse(rawStr));
    } catch (err) {
      console.error('Redis fetch active users failed, using local fallback:', err);
      activeUsers = Array.from(roomUsers.values())
        .filter(u => u.profile.id !== clientId)
        .map(u => u.profile);
    }
  } else {
    activeUsers = Array.from(roomUsers.values())
      .filter(u => u.profile.id !== clientId)
      .map(u => u.profile);
  }

  // Acknowledge and transmit current user profiles to sender
  ws.send(JSON.stringify({
    type: 'welcome',
    payload: {
      yourId: clientId,
      profile: userProfile,
      users: activeUsers
    }
  }));

  // 2. Broadcast joining info to all other peers
  if (redisPub) {
    redisPub.publish(`collab:room:${roomId}`, JSON.stringify({
      type: 'user_join',
      senderId: clientId,
      payload: userProfile
    })).catch(console.error);
  } else {
    broadcastToRoom(roomId, clientId, {
      type: 'user_join',
      payload: userProfile
    });
  }

  // Handle incoming messages
  ws.on('message', async (messageRaw) => {
    try {
      const data = JSON.parse(messageRaw);

      switch (data.type) {
        case 'cursor_move':
          userProfile.cursor = data.payload;
          if (redisClient) {
            // Update cursor in Redis cache & publish event
            redisClient.hSet(`collab:room:${roomId}:users`, clientId, JSON.stringify(userProfile)).catch(() => {});
            redisPub.publish(`collab:room:${roomId}`, JSON.stringify({
              type: 'cursor_move',
              senderId: clientId,
              payload: data.payload
            })).catch(() => {});
          } else {
            broadcastToRoom(roomId, clientId, {
              type: 'cursor_move',
              senderId: clientId,
              payload: data.payload
            });
          }
          break;

        case 'node_drag':
          if (redisPub) {
            redisPub.publish(`collab:room:${roomId}`, JSON.stringify({
              type: 'node_drag',
              senderId: clientId,
              payload: data.payload
            })).catch(() => {});
          } else {
            broadcastToRoom(roomId, clientId, {
              type: 'node_drag',
              senderId: clientId,
              payload: data.payload
            });
          }
          break;

        case 'graph_update':
          if (redisPub) {
            redisPub.publish(`collab:room:${roomId}`, JSON.stringify({
              type: 'graph_update',
              senderId: clientId,
              payload: data.payload
            })).catch(() => {});
          } else {
            broadcastToRoom(roomId, clientId, {
              type: 'graph_update',
              senderId: clientId,
              payload: data.payload
            });
          }
          break;

        case 'playback_sync':
          userProfile.isPresenter = data.payload.isPresenter;
          if (redisClient) {
            redisClient.hSet(`collab:room:${roomId}:users`, clientId, JSON.stringify(userProfile)).catch(() => {});
            redisPub.publish(`collab:room:${roomId}`, JSON.stringify({
              type: 'playback_sync',
              senderId: clientId,
              payload: data.payload
            })).catch(() => {});
          } else {
            broadcastToRoom(roomId, clientId, {
              type: 'playback_sync',
              senderId: clientId,
              payload: data.payload
            });
          }
          break;
      }
    } catch (err) {
      console.error(`Error parsing multiplayer packet:`, err);
    }
  });

  ws.on('close', async () => {
    console.log(`🔌 [Room: ${roomId}] ${name} disconnected`);
    roomUsers.delete(clientId);

    if (redisClient) {
      try {
        await redisClient.hDel(`collab:room:${roomId}:users`, clientId);
        
        // Clean up empty rooms from cache
        const globalUsers = await redisClient.hGetAll(`collab:room:${roomId}:users`);
        if (Object.keys(globalUsers).length === 0) {
          await redisClient.del(`collab:room:${roomId}:users`);
        }
      } catch (err) {
        console.error('Redis disconnect cleanup error:', err);
      }
      
      redisPub.publish(`collab:room:${roomId}`, JSON.stringify({
        type: 'user_leave',
        senderId: clientId,
        payload: { id: clientId }
      })).catch(console.error);
    } else {
      if (roomUsers.size === 0) {
        rooms.delete(roomId);
      } else {
        broadcastToRoom(roomId, clientId, {
          type: 'user_leave',
          payload: { id: clientId }
        });
      }
    }
  });
});

// Broadcast utility to local room members (excluding the sender, fallback when Redis is absent)
function broadcastToRoom(roomId, senderId, packet) {
  const roomUsers = rooms.get(roomId);
  if (!roomUsers) return;

  const rawString = JSON.stringify(packet);

  for (const [id, client] of roomUsers.entries()) {
    if (id !== senderId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(rawString);
    }
  }
}
