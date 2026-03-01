# Human-in-the-Loop (HITL) - Agent Integration Guide

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

## Request Structure

### POST http://localhost:4000/events

**Example (Python)**:
```python
event_payload = {
    "source_app": f"big-three-agents: {agent_name}",
    "session_id": session_id,
    "hook_event_type": "DecisionPoint",
    "payload": {
        "agent_name": agent_name,
        "permission_type": permission_type,  # e.g., "env_file_access"
        "question": question
    },
    "humanInTheLoop": hitl_data.model_dump(by_alias=True),  # ✅ Valid
    "timestamp": int(time.time() * 1000),
    "summary": f"🔐 {permission_type}: {question[:100]}",
}
```

**JSON Format**:
```json
{
  "source_app": "big-three-agents: alice",
  "session_id": "session-123",
  "hook_event_type": "DecisionPoint",
  "payload": {
    "agent_name": "alice",
    "permission_type": "env_file_access",
    "question": "May I access .env files in the working directory?"
  },
  "humanInTheLoop": {
    "question": "May I access .env files in the working directory?",
    "responseWebSocketUrl": "ws://localhost:50123",
    "type": "permission",
    "choices": null,
    "timeout": 300,
    "requiresResponse": true
  },
  "timestamp": 1734189234000,
  "summary": "🔐 env_file_access: May I access .env files..."
}
```

## Response Structure

### Agent receives via WebSocket

```json
{
  "permission": true,
  "response": "Use async/await approach",
  "choice": "Option B",
  "respondedAt": 1734189245000,
  "hookEvent": {
    "id": 9675,
    "source_app": "big-three-agents: alice",
    "session_id": "session-123",
    "payload": {
      "agent_name": "alice",
      "permission_type": "env_file_access",
      "question": "May I access .env files..."
    },
    "humanInTheLoop": {
      "question": "May I access .env files...",
      "responseWebSocketUrl": "ws://localhost:50123",
      "type": "permission"
    }
  }
}
```

### Response Fields by Type

**Permission request** (`type: "permission"`):
- `permission`: `true` (approved) or `false` (denied)

**Question request** (`type: "question"`):
- `response`: Text answer from human

**Choice request** (`type: "choice"`):
- `choice`: Selected option from choices array

All include:
- `respondedAt`: Unix timestamp (milliseconds)
- `hookEvent`: Original event echoed back

## Agent-Side Implementation

### 1. WebSocket Server

```python
import asyncio
import json
from websockets.server import serve

class HITLManager:
    def __init__(self):
        self.pending_futures = {}  # permission_type -> asyncio.Future
        self.server_running = False

    async def start_server(self, port):
        """Start WebSocket server to receive responses"""

        async def handle_response(websocket):
            try:
                # Receive response from observability server
                message = await websocket.recv()
                response_data = json.loads(message)

                # Extract permission_type for matching
                original_event = response_data.get("hookEvent", {})
                payload = original_event.get("payload", {})
                permission_type = payload.get("permission_type", "")

                # Resolve pending future (wake up waiting code)
                if permission_type in self.pending_futures:
                    future = self.pending_futures.pop(permission_type)
                    if not future.done():
                        future.set_result(response_data)

                await websocket.close()

            except Exception as e:
                print(f"Error handling response: {e}")

        self.server_running = True
        async with serve(handle_response, "localhost", port):
            while self.server_running:
                await asyncio.sleep(1)
```

### 2. Send Request

```python
async def request_approval(self, permission_type: str, question: str, session_id: str, hitl_type: str):
    """Send HITL request and wait for response"""

    # Find available port
    port = find_free_port()  # Use socket to find random port

    # Prepare event payload
    event_payload = {
        "source_app": "my-agent",
        "session_id": session_id,
        "hook_event_type": "DecisionPoint",
        "payload": {
            "agent_name": "alice",
            "permission_type": permission_type,  # e.g., "env_file_access"
            "question": question
        },
        "humanInTheLoop": {
            "question": question,
            "responseWebSocketUrl": f"ws://localhost:{port}",
            "type": hitl_type,  # "permission" | "question" | "choice"
            "choices": None,
            "timeout": 300,
            "requiresResponse": True
        },
        "timestamp": int(time.time() * 1000),
        "summary": f"🔐 {permission_type}: {question[:100]}"
    }

    # Send to observability server
    response = requests.post(
        "http://localhost:4000/events",
        json=event_payload,
        headers={"Content-Type": "application/json"}
    )

    if response.status_code != 200:
        raise Exception(f"Failed to send HITL request: {response.status_code}")

    # Create future to wait for response (keyed by permission_type)
    future = asyncio.Future()
    self.pending_futures[permission_type] = future

    # Wait for response with timeout
    try:
        response_data = await asyncio.wait_for(future, timeout=300)
        return response_data
    except asyncio.TimeoutError:
        self.pending_futures.pop(permission_type, None)
        return None  # Timeout
```

### 3. Extract Response

```python
def extract_answer(self, response_data: dict, hitl_type: str):
    """Extract answer based on request type"""

    if hitl_type == "permission":
        return response_data.get("permission", False)

    elif hitl_type == "question":
        return response_data.get("response", None)

    elif hitl_type == "choice":
        return response_data.get("choice", None)

    return None
```

### 4. Usage in Agent Code

```python
# In your agent's decision point
hitl_manager = HITLManager()

# Start WebSocket server (do this once at agent startup)
await hitl_manager.start_server(port=0)  # 0 = random port

# Request approval with explicit permission type
response_data = await hitl_manager.request_approval(
    permission_type=DECISION_POINT_ENV_FILE_ACCESS,
    question="May I access .env files in the working directory?",
    session_id="session-123",
    hitl_type="permission"
)

# Extract answer
if response_data:
    approved = hitl_manager.extract_answer(response_data, "permission")
    if approved:
        # Execute operation
        modify_env_file()
    else:
        # Block operation
        return {"error": "Permission denied"}
else:
    # Timeout - use default behavior
    return {"error": "No response - operation blocked"}
```

## Request Type Details

### Permission Request

**Use when**: Need yes/no approval

```python
{
  "type": "permission",
  "question": "Delete 500 old records?",
  "choices": null
}

# Response
{
  "permission": true  # or false
}
```

### Question Request

**Use when**: Need free-form text answer

```python
{
  "type": "question",
  "question": "What naming convention should I use?",
  "choices": null
}

# Response
{
  "response": "Use snake_case for functions"
}
```

### Choice Request

**Use when**: Need selection from options

```python
{
  "type": "choice",
  "question": "Which testing framework?",
  "choices": ["Jest", "Vitest", "Mocha"]
}

# Response
{
  "choice": "Vitest"
}
```

## Port Configuration

### Observability Server (Fixed)
- **HTTP API**: `http://localhost:4000`
- **POST endpoint**: `http://localhost:4000/events`

### Agent WebSocket Server (Dynamic)

Use OS-assigned random port to avoid conflicts:

```python
import socket

def find_free_port() -> int:
    """Find an available port for agent's WebSocket server"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))  # 0 = let OS choose port
        s.listen(1)
        port = s.getsockname()[1]
    return port

# Example: port = 50123 (random)
# responseWebSocketUrl = f"ws://localhost:{port}"
```

## Permission Type Matching

Use explicit permission type constants for matching (not hashes):

```python
# Define permission type constants
DECISION_POINT_ENV_FILE_ACCESS = "env_file_access"
DECISION_POINT_DELETE_FILES = "delete_files"
DECISION_POINT_INSTALL_PACKAGES = "install_packages"
DECISION_POINT_DEPLOY_PRODUCTION = "deploy_production"
DECISION_POINT_DATABASE_MODIFY = "database_modify"

# Use in requests
permission_type = DECISION_POINT_ENV_FILE_ACCESS

# Match responses using permission_type from hookEvent.payload
payload = response_data.get("hookEvent", {}).get("payload", {})
permission_type = payload.get("permission_type", "")
```

## Error Handling

**Network failure**:
- Auto-approve on send failure
- Log error, don't block agent

**Timeout**:
- Clear pending future after timeout
- Return `None` or default behavior
- Don't crash agent

**Malformed response**:
- Validate JSON structure
- Log warning
- Treat as timeout

## Field Name Convention

Use **camelCase** in API (JSON), **snake_case** internally:

```python
# Pydantic model with aliases
class HumanInTheLoop(BaseModel):
    response_websocket_url: str = Field(..., alias="responseWebSocketUrl")
    requires_response: bool = Field(default=True, alias="requiresResponse")

    class Config:
        populate_by_name = True  # Allow both naming styles

# Serialization
hitl_data.model_dump(by_alias=True)  # Uses camelCase for API
```

## Performance

**Timing**:
- WebSocket server start: ~100ms
- HTTP POST to server: ~5-10ms
- Human response: 2-30 seconds
- Response delivery: ~10-20ms

**Total**: 2-30 seconds (human think time dominates)

## Security

- WebSocket binds to **localhost only** (not network-exposed)
- **Random port** prevents conflicts
- **No authentication** (local trust model)
- Suitable for development, not production

## Reference Files

- **Server API types**: `apps/server/src/types.ts`
- **Client UI component**: `apps/client/src/components/EventRow.vue`
- **Example implementation**: `.opencode/hooks/utils/hitl.py`

---

**Version**: 1.0 | **Updated**: 2025-10-14 | **Status**: Production Ready
