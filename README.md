# Multi-Agent Observability System

Real-time monitoring and visualization for OpenCode agents through hook event tracking.

<img src="images/app.png" alt="Multi-Agent Observability Dashboard" style="max-width: 800px; width: 100%;">

## Architecture

```
OpenCode Agents → Hook Scripts (TypeScript) → HTTP POST → Bun Server → SQLite → WebSocket → Vue Dashboard
```

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

# 5. Use OpenCode in any project — events stream to the dashboard in real-time
```

## Add Observability to Your Project

Copy the `.opencode` directory to any project and update the `source-app` name in `settings.json`. See the full [Integration Guide](docs/integration-guide.md).

```bash
cp -R .opencode /path/to/your/project/
cd /path/to/your/project/.opencode/hooks && bun install
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
│   ├── client/                 # Vue 3 dashboard (port 5173)
│   │   └── src/
│   │       ├── components/     # EventTimeline, EventRow, FilterPanel, LivePulseChart
│   │       ├── composables/    # useWebSocket, useEventColors, useChartData
│   │       └── types.ts
│   │
│   └── demo-opencode-agent/    # Example agent with hooks pre-configured
│
├── .opencode/
│   ├── hooks/                  # 12 TypeScript hook scripts + utilities
│   │   ├── send_event.ts       # Universal event sender
│   │   ├── pre_tool_use.ts     # Tool validation & blocking
│   │   ├── stop.ts             # Session completion + TTS
│   │   ├── utils/              # LLM, TTS, model extraction, HITL
│   │   └── validators/         # Stop hook file validators
│   ├── agents/team/            # Multi-agent team definitions
│   ├── commands/               # Custom slash commands
│   ├── skills/                 # Reusable agent skills
│   ├── output-styles/          # Response formatting templates
│   └── settings.json           # Hook configuration (all 12 events)
│
├── docs/                       # Documentation
│   ├── hooks-reference.md      # Complete hook API reference
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
| `OPENROUTER_API_KEY` | For AI summaries | LLM-powered event summarization |
| `OPENAI_API_KEY` | Optional | Alternative LLM + TTS |
| `ELEVENLABS_API_KEY` | Optional | Voice announcements |
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
| Hooks | TypeScript, Bun |
| Communication | HTTP REST, WebSocket |

## Documentation

- [Hooks Reference](docs/hooks-reference.md) — All 12 hook scripts and utilities
- [Integration Guide](docs/integration-guide.md) — Add observability to any project
- [HITL Guide](docs/hitl-guide.md) — Human-in-the-Loop architecture
- [Model Extraction](docs/model-extraction.md) — Cached model name extraction

## Testing

```bash
just test-event    # Send a test event
just health        # Check server/client status
just hook-test pre_tool_use  # Test a hook directly
```

## License

MIT
