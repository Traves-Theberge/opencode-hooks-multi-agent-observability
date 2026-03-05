# Integration Guide

How to add OpenCode observability hooks to any project.

## Quick Setup

1. **Copy the `.opencode` directory** to your project root:
   ```bash
   cp -R .opencode /path/to/your/project/
   ```

2. **Install hook dependencies:**
   ```bash
   cd /path/to/your/project/.opencode/hooks && bun install
   ```

3. **Update `settings.json`** — replace `YOUR_PROJECT_NAME` with your app identifier:
   ```json
   {
     "hooks": {
       "PreToolUse": [{
         "matcher": "",
         "hooks": [
           { "type": "command", "command": "bun run .opencode/hooks/pre_tool_use.ts" },
           { "type": "command", "command": "bun run .opencode/hooks/send_event.ts --source-app YOUR_PROJECT_NAME --event-type PreToolUse --summarize" }
         ]
       }],
       "PostToolUse": [{
         "matcher": "",
         "hooks": [
           { "type": "command", "command": "bun run .opencode/hooks/post_tool_use.ts" },
           { "type": "command", "command": "bun run .opencode/hooks/send_event.ts --source-app YOUR_PROJECT_NAME --event-type PostToolUse --summarize" }
         ]
       }],
       "Stop": [{
         "matcher": "",
         "hooks": [
           { "type": "command", "command": "bun run .opencode/hooks/stop.ts --chat" },
           { "type": "command", "command": "bun run .opencode/hooks/send_event.ts --source-app YOUR_PROJECT_NAME --event-type Stop --add-chat" }
         ]
       }]
     }
   }
   ```
   See the full [settings.json](.opencode/settings.json) for all 12 event types.

4. **Start the observability server** (from this repo):
   ```bash
   ./scripts/start-system.sh
   ```

5. **Open the dashboard**: [http://localhost:5173](http://localhost:5173)

## Minimal Setup

If you only want event streaming without local logging or TTS:

```bash
# Copy just the event sender
cp .opencode/hooks/send_event.ts YOUR_PROJECT/.opencode/hooks/
cp .opencode/hooks/utils/constants.ts YOUR_PROJECT/.opencode/hooks/utils/
cp .opencode/hooks/package.json YOUR_PROJECT/.opencode/hooks/
cd YOUR_PROJECT/.opencode/hooks && bun install
```

Then configure one hook per event type pointing to `send_event.ts`.

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENROUTER_API_KEY` | For AI summaries | LLM-powered event summarization |
| `VOICEAI_API_KEY` | Optional | Voice TTS announcements |
| `ENGINEER_NAME` | Optional | Personalized TTS messages |
