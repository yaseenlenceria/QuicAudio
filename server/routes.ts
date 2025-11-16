import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { matchmakingQueue } from "./matchmaking-queue";
import { insertAbuseReportSchema, wsMessageSchema } from "@shared/schema";

interface WSClient {
  ws: WebSocket;
  userId: string;
}

interface ActiveCall {
  user1: string;
  user2: string;
  sessionId: string;
  startTime: number;
}

const clients = new Map<string, WSClient>();
const activeCalls = new Map<string, ActiveCall>();

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/users", async (req, res) => {
    try {
      const { id, country } = req.body;
      
      let user = await storage.getUser(id);
      if (!user) {
        user = await storage.createUser({ id, country });
      } else {
        await storage.updateUserActivity(id);
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error creating/getting user:', error);
      res.status(500).json({ error: 'Failed to create/get user' });
    }
  });

  app.post("/api/reports", async (req, res) => {
    try {
      const data = insertAbuseReportSchema.parse(req.body);
      const report = await storage.createAbuseReport(data);
      res.json(report);
    } catch (error) {
      console.error('Error creating report:', error);
      res.status(400).json({ error: 'Invalid report data' });
    }
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const onlineUsers = clients.size;
      const activeCallsCount = activeCalls.size;
      const queueSize = matchmakingQueue.getQueueSize();
      
      res.json({
        onlineUsers,
        activeCalls: activeCallsCount,
        queueSize,
      });
    } catch (error) {
      console.error('Error getting stats:', error);
      res.status(500).json({ error: 'Failed to get stats' });
    }
  });

  const httpServer = createServer(app);
  
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws'
  });

  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection');
    let currentUserId: string | null = null;

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('Received message:', message.type, message);

        const validated = wsMessageSchema.parse(message);

        switch (validated.type) {
          case 'join-queue': {
            currentUserId = validated.userId;
            clients.set(validated.userId, { ws, userId: validated.userId });

            const user = await storage.getUser(validated.userId);
            if (!user) {
              await storage.createUser({ id: validated.userId });
            }

            const position = matchmakingQueue.addUser({
              userId: validated.userId,
              socketId: validated.userId,
              joinedAt: Date.now(),
              preferences: validated.preferences || {},
              abuseScore: user?.abuseScore || 0,
              trustLevel: user?.trustLevel || 'new',
            });

            ws.send(JSON.stringify({
              type: 'queue-joined',
              position,
            }));

            broadcastOnlineCount();

            setTimeout(() => tryMatchUser(validated.userId), 1000);
            break;
          }

          case 'leave-queue': {
            matchmakingQueue.removeUser(validated.userId);
            break;
          }

          case 'offer':
          case 'answer':
          case 'ice-candidate': {
            const targetClient = clients.get(validated.targetUserId);
            if (targetClient && targetClient.ws.readyState === WebSocket.OPEN) {
              targetClient.ws.send(JSON.stringify(validated));
            }
            break;
          }

          case 'end-call': {
            const callInfo = Array.from(activeCalls.entries()).find(
              ([_, info]) => info.user1 === validated.userId || info.user2 === validated.userId
            );

            if (callInfo) {
              const [callId, info] = callInfo;
              const duration = Math.floor((Date.now() - info.startTime) / 1000);
              
              await storage.endCallSession(
                info.sessionId,
                duration,
                validated.userId,
                'strong'
              );

              await storage.updateUserStats(info.user1, duration);
              await storage.updateUserStats(info.user2, duration);

              activeCalls.delete(callId);

              const otherUserId = info.user1 === validated.userId ? info.user2 : info.user1;
              const otherClient = clients.get(otherUserId);
              if (otherClient && otherClient.ws.readyState === WebSocket.OPEN) {
                otherClient.ws.send(JSON.stringify({
                  type: 'peer-disconnected',
                }));
              }
            }
            break;
          }

          case 'heartbeat': {
            await storage.updateUserActivity(validated.userId);
            ws.send(JSON.stringify({ type: 'heartbeat-ack' }));
            break;
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
        }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket disconnected');
      if (currentUserId) {
        clients.delete(currentUserId);
        matchmakingQueue.removeUser(currentUserId);
        
        const callInfo = Array.from(activeCalls.entries()).find(
          ([_, info]) => info.user1 === currentUserId || info.user2 === currentUserId
        );

        if (callInfo) {
          const [callId, info] = callInfo;
          const otherUserId = info.user1 === currentUserId ? info.user2 : info.user1;
          const otherClient = clients.get(otherUserId);
          
          if (otherClient && otherClient.ws.readyState === WebSocket.OPEN) {
            otherClient.ws.send(JSON.stringify({
              type: 'peer-disconnected',
            }));
          }
          
          activeCalls.delete(callId);
        }

        broadcastOnlineCount();
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  async function tryMatchUser(userId: string): Promise<void> {
    const match = await matchmakingQueue.findMatch(userId);
    
    if (match) {
      console.log('Match found:', userId, '<->', match.partnerId);

      const session = await storage.createCallSession({
        user1Id: userId,
        user2Id: match.partnerId,
      });

      const callId = `${userId}-${match.partnerId}`;
      activeCalls.set(callId, {
        user1: userId,
        user2: match.partnerId,
        sessionId: session.id,
        startTime: Date.now(),
      });

      const client1 = clients.get(userId);
      const client2 = clients.get(match.partnerId);

      if (client1 && client1.ws.readyState === WebSocket.OPEN) {
        client1.ws.send(JSON.stringify({
          type: 'match-found',
          partnerId: match.partnerId,
          score: match.score,
        }));
      }

      if (client2 && client2.ws.readyState === WebSocket.OPEN) {
        client2.ws.send(JSON.stringify({
          type: 'match-found',
          partnerId: userId,
          score: match.score,
        }));
      }
    } else {
      setTimeout(() => {
        if (matchmakingQueue.getUserSocketId(userId)) {
          tryMatchUser(userId);
        }
      }, 2000);
    }
  }

  function broadcastOnlineCount(): void {
    const count = clients.size;
    const message = JSON.stringify({
      type: 'online-count',
      count,
    });

    clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
  }

  setInterval(broadcastOnlineCount, 10000);

  return httpServer;
}
