# Multi-Agent Observability System

Real-time monitoring and visualization for OpenCode agents through a native plugin and event tracking.

<img src="images/app.png" alt="Multi-Agent Observability Dashboard" style="max-width: 800px; width: 100%;">

## Architecture

```
OpenCode Session → Plugin (observability.ts) → HTTP POST → Bun Server → SQLite → WebSocket → Vue Dashboard
```

The system uses a **native OpenCode plugin** (`.opencode/plugins/observability.ts`) that auto-loads when OpenCode starts in this project directory. The plugin intercepts session lifecycle events, tool executions, and message updates, then forwards them as JSON to the backend server.

## Quick Start

```bash
# 1. Clone and install
bun install --cwd apps/server
bun install --cwd apps/client
bun install --cwd .opencode/hooks

# 2. Configure environment
cp .env.sample .env
# Edit .env with your API keys

# 3. Start the system
./scripts/start-system.sh     # or: just start

# 4. Open the dashboard
open http://localhost:5173

# 5. Use OpenCode in this project — events stream to the dashboard automatically
```

## How It Works

When OpenCode starts in this project directory, it auto-loads `.opencode/plugins/observability.ts`. The plugin:

1. Sends a `PluginLoaded` event on initialization
2. Captures `session.created`, `session.idle`, `session.error` lifecycle events
3. Intercepts `tool.execute.before` → `PreToolUse` and `tool.execute.after` → `PostToolUse`
4. Forwards `message.updated`, `file.edited`, and all other events to the dashboard

No `settings.json` configuration is needed — plugins in `.opencode/plugins/` auto-load.

## Add Observability to Another Project

Copy the plugin file and point it at the running server. See the full [Integration Guide](docs/integration-guide.md).

```bash
mkdir -p /path/to/your/project/.opencode/plugins
cp .opencode/plugins/observability.ts /path/to/your/project/.opencode/plugins/
```

## Project Structure

```
├── apps/
│   ├── server/                 # Bun + SQLite event API (port 4000)
│   │   └── src/
│   │       ├── index.ts        # HTTP/WebSocket server
│   │       ├── db.ts           # SQLite with WAL mode
│   │       └── types.ts        # Shared interfaces
│   │
│   └── client/                 # Vue 3 dashboard (port 5173)
│       └── src/
│           ├── components/     # EventTimeline, TopologyView, FilterPanel
│           ├── composables/    # useWebSocket, useEventColors, useChartData
│           └── types.ts
│
├── .opencode/
│   ├── plugins/
│   │   └── observability.ts    # ← Native OpenCode plugin (auto-loaded)
│   ├── hooks/                  # Standalone hook scripts + utilities
│   │   ├── stop.ts             # Session completion + TTS
│   │   ├── notification.ts     # User notification + TTS
│   │   ├── subagent_stop.ts    # Subagent lifecycle tracking
│   │   └── utils/              # TTS, constants
│   ├── agents/                 # Custom agent definitions
│   └── agents/team/            # Multi-agent team definitions
│
├── docs/                       # Documentation
│   ├── hooks-reference.md      # Plugin events + hook scripts reference
│   ├── integration-guide.md    # Setup guide for other projects
│   ├── hitl-guide.md           # Human-in-the-Loop guide
│   └── model-extraction.md     # Model name caching guide
│
├── scripts/
│   ├── start-system.sh         # Launch server + client
│   └── reset-system.sh         # Stop all processes
│
├── justfile                    # Task runner (just start, just stop, etc.)
└── CHANGELOG.md
```

## Configuration

### Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `OBSERVABILITY_SERVER_URL` | No (default: `http://localhost:4000`) | Backend server URL |
| `OPENROUTER_API_KEY` | For AI summaries | LLM-powered event summarization |
| `VOICEAI_API_KEY` | Optional | Voice announcements |
| `ENGINEER_NAME` | Optional | Personalized messages |

### Ports

| Service | Port |
|---------|------|
| Server (HTTP/WS) | `4000` |
| Client (Vite) | `5173` |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Server | Bun, TypeScript, SQLite |
| Client | Vue 3, TypeScript, Vite, Tailwind CSS |
| Plugin | TypeScript (OpenCode native plugin API) |
| Communication | HTTP REST, WebSocket |

## Documentation

- [Hooks Reference](docs/hooks-reference.md) — Plugin events and hook scripts
- [Integration Guide](docs/integration-guide.md) — Add observability to any project
- [HITL Guide](docs/hitl-guide.md) — Human-in-the-Loop architecture
- [Model Extraction](docs/model-extraction.md) — Cached model name extraction

## Testing

```bash
just test-event    # Send a test event via curl
just health        # Check server/client status
```

## License

MIT
