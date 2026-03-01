# Human-in-the-Loop (HITL) - Agent Integration Guide (TypeScript)

## Overview

Agent sends HITL request → Observability server broadcasts to dashboard → Human responds → Server forwards response back to agent via WebSocket.

### Ports

- **Observability HTTP API**: `http://localhost:4000/events` (POST requests here)
- **Agent WebSocket Server**: Random port (agent creates, includes in request as `responseWebSocketUrl`)

## Data Flow

```
Agent → Creates WebSocket server (random port)
      → POST to observability server with humanInTheLoop
      → Waits for response on WebSocket

Server → Stores event (status: pending)
       → Broadcasts to dashboard clients

Dashboard → Shows question UI
          → Human responds
          → POST /events/:id/respond

Server → Updates event (status: responded)
       → Opens WebSocket client connection to agent
       → Sends response JSON
       → Closes connection

Agent → Receives response on WebSocket
      → Extracts answer (permission/response/choice)
      → Returns to caller code
      → Continues execution
```

## TypeScript Types (Server)

```typescript
interface HookEvent {
  id?: number;                          // Auto-assigned by server
  source_app: string;                   // Your agent name
  session_id: string;                   // Unique session identifier
  hook_event_type: string;              // Event type (e.g., "DecisionPoint")
  payload: Record<string, any>;         // Custom payload data
  summary?: string;                     // Optional summary text
  timestamp?: number;                   // Unix timestamp in milliseconds
  humanInTheLoop?: HumanInTheLoop;      // HITL request data
  humanInTheLoopStatus?: HumanInTheLoopStatus;  // Response status (server-managed)
}

interface HumanInTheLoop {
  question: string;                     // The question to ask human
  responseWebSocketUrl: string;         // Agent's WebSocket URL
  type: 'question' | 'permission' | 'choice';  // Request type
  choices?: string[];                   // Options for choice type
  timeout?: number;                     // Seconds (default: 300)
  requiresResponse?: boolean;           // Always true
}

interface HumanInTheLoopStatus {
  status: 'pending' | 'responded' | 'timeout' | 'error';
  respondedAt?: number;
  response?: HumanInTheLoopResponse;
}

interface HumanInTheLoopResponse {
  response?: string;                    // Text answer
  permission?: boolean;                 // Yes/no answer
  choice?: string;                      // Selected choice
  respondedAt: number;                  // Unix timestamp in milliseconds
  hookEvent: HookEvent;                 // Original event echoed back
}
```

## Agent-Side Implementation (TypeScript)

### 1. WebSocket Server & Request Management

```typescript
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

class HITLManager {
    private pendingFutures: Map<string, (value: any) => void> = new Map();

    async requestApproval(
        sessionId: string, 
        question: string, 
        permissionType: string,
        hitlType: 'permission' | 'question' | 'choice' = 'permission'
    ): Promise<any> {
        // Find available port and start transient WS server
        const server = createServer();
        const wss = new WebSocketServer({ server });
        
        return new Promise((resolve) => {
            server.listen(0, 'localhost', async () => {
                const address = server.address() as any;
                const port = address.port;
                const wsUrl = `ws://localhost:${port}`;

                const eventPayload = {
                    source_app: 'my-ts-agent',
                    session_id: sessionId,
                    hook_event_type: 'DecisionPoint',
                    payload: { permission_type: permissionType, question },
                    humanInTheLoop: {
                        question,
                        responseWebSocketUrl: wsUrl,
                        type: hitlType,
                        timeout: 300,
                        requiresResponse: true
                    },
                    timestamp: Date.now(),
                    summary: `🔐 ${permissionType}: ${question.substring(0, 100)}`
                };

                // Handle incoming response
                wss.on('connection', (ws) => {
                    ws.on('message', (message) => {
                        const response = JSON.parse(message.toString());
                        resolve(response);
                        ws.close();
                        wss.close();
                        server.close();
                    });
                });

                // POST to observability server
                try {
                    await fetch('http://localhost:4000/events', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(eventPayload)
                    });
                } catch (e) {
                    console.error('Failed to send HITL request', e);
                    resolve(null);
                }
            });
        });
    }
}
```

## Reference Files

- **Server API types**: `apps/server/src/types.ts`
- **Client UI component**: `apps/client/src/components/EventRow.vue`
- **Example implementation**: `.opencode/hooks/utils/hitl.ts`

---

**Version**: 1.1 | **Updated**: 2026-03-01 | **Status**: Production Ready (TS Migrated)
