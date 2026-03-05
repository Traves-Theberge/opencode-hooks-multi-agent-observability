# Integration Guide

How to add OpenCode observability to any project.

## Quick Setup (Plugin Method)

The recommended approach uses OpenCode's native plugin system. No `settings.json` needed.

1. **Copy the plugin** to your project:
   ```bash
   mkdir -p /path/to/your/project/.opencode/plugins
   cp .opencode/plugins/observability.ts /path/to/your/project/.opencode/plugins/
   ```

2. **Start the observability server** (from this repo):
   ```bash
   ./scripts/start-system.sh    # or: just start
   ```

3. **Open the dashboard**: [http://localhost:5173](http://localhost:5173)

4. **Run OpenCode** in your project — events stream automatically.

## Customization

Edit the plugin file to change behavior:

```typescript
// .opencode/plugins/observability.ts

// Change the server URL (default: http://localhost:4000)
const SERVER_URL = process.env.OBSERVABILITY_SERVER_URL || "http://localhost:4000";

// Change the source app name (default: "opencode")
const SOURCE_APP = "your-project-name";
```

## Adding TTS Notifications

If you also want voice announcements on session completion:

```bash
cp -R .opencode/hooks /path/to/your/project/.opencode/hooks
cd /path/to/your/project/.opencode/hooks && bun install
```

Set `VOICEAI_API_KEY` in your `.env` for Voice.ai TTS.

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `OBSERVABILITY_SERVER_URL` | No (default: `http://localhost:4000`) | Backend server URL |
| `OPENROUTER_API_KEY` | For AI summaries | LLM-powered event summarization |
| `VOICEAI_API_KEY` | Optional | Voice TTS announcements |
| `ENGINEER_NAME` | Optional | Personalized TTS messages |

## Event Payload Format

The plugin sends JSON to `POST /events`:

```json
{
  "source_app": "opencode",
  "session_id": "uuid-string",
  "hook_event_type": "PreToolUse",
  "payload": {
    "tool_name": "bash",
    "tool_input": { "command": "echo hello" },
    "directory": "/path/to/project"
  },
  "timestamp": 1772677581225
}
```

Required fields: `source_app`, `session_id`, `hook_event_type`, `payload`.
