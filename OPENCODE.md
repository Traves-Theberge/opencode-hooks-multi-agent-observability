# OpenCode Multi-Agent Observability

## Instructions

Use `source_app` + `session_id` to uniquely identify an agent.

Every hook event includes these fields. Display agent identity as `source_app:session_id` with `session_id` truncated to 8 characters.

### Key Patterns

- All hooks are TypeScript, run with `bun run .opencode/hooks/<hook>.ts`
- Events are sent via HTTP POST to `http://localhost:4000/events`
- The server broadcasts events to all connected WebSocket clients
- Hook scripts read JSON from stdin and write JSON to stdout
- `stop_hook_active` guard prevents infinite hook loops in Stop/SubagentStop

### File Layout

- `apps/server/` — Bun HTTP/WebSocket server + SQLite
- `apps/client/` — Vue 3 real-time dashboard
- `.opencode/hooks/` — 12 TypeScript hook scripts + utilities
- `docs/` — Detailed documentation