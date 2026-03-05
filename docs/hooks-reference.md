# Hooks Reference

Complete reference for all 12 OpenCode hook scripts in `.opencode/hooks/`.

## Core Script

### `send_event.ts`
Universal event sender that forwards hook data to the observability server.

```bash
bun run .opencode/hooks/send_event.ts --source-app YOUR_APP --event-type PreToolUse --summarize
```

**Flags:**
- `--source-app` — Unique identifier for your project
- `--event-type` — Hook event type (see table below)
- `--summarize` — Generate an AI summary of the event payload
- `--add-chat` — Include conversation transcript (used with Stop events)

## Event-Specific Hooks

| Script | Event | Purpose |
|--------|-------|---------|
| `pre_tool_use.ts` | PreToolUse | Blocks dangerous commands (`rm -rf`), validates tool usage, summarizes inputs |
| `post_tool_use.ts` | PostToolUse | Captures execution results, detects MCP tools (`mcp_server`, `mcp_tool_name`) |
| `post_tool_use_failure.ts` | PostToolUseFailure | Logs tool execution failures |
| `permission_request.ts` | PermissionRequest | Logs permission request events |
| `notification.ts` | Notification | Tracks user interactions, type-aware TTS (permission_prompt, idle_prompt) |
| `user_prompt_submit.ts` | UserPromptSubmit | Logs user prompts, supports JSON `{"decision": "block"}` validation |
| `stop.ts` | Stop | Records session completion with `stop_hook_active` guard |
| `subagent_stop.ts` | SubagentStop | Monitors subagent completion with transcript path |
| `subagent_start.ts` | SubagentStart | Tracks subagent lifecycle start events |
| `pre_compact.ts` | PreCompact | Tracks context compaction with custom instructions |
| `session_start.ts` | SessionStart | Logs session start with `agent_type`, `model`, `source` |
| `session_end.ts` | SessionEnd | Logs session end with reason tracking |

## Validators

| Script | Purpose |
|--------|---------|
| `validators/validate_new_file.ts` | Validates file creation in Stop hooks |
| `validators/validate_file_contains.ts` | Validates file content sections |

## Utility Libraries

| Module | Purpose |
|--------|---------|
| `utils/constants.ts` | Shared constants, log directory management |
| `utils/model_extractor.ts` | Extracts model name from transcripts with 60s cache |
| `utils/summarizer.ts` | AI-powered event summarization via LLM |
| `utils/hitl.ts` | Human-in-the-Loop WebSocket client |
| `utils/llm/openrouter.ts` | OpenRouter LLM integration |
| `utils/tts/voiceai_tts.ts` | Voice.ai text-to-speech |
| `utils/tts/system_tts.ts` | System native TTS fallback |

## Event Visualization

| Event Type | Emoji | Color Coding |
|-----------|-------|-------------|
| PreToolUse | 🔧 | Session-based |
| PostToolUse | ✅ | Session-based |
| PostToolUseFailure | ❌ | Session-based |
| PermissionRequest | 🔐 | Session-based |
| Notification | 🔔 | Session-based |
| Stop | 🛑 | Session-based |
| SubagentStart | 🟢 | Session-based |
| SubagentStop | 👥 | Session-based |
| PreCompact | 📦 | Session-based |
| UserPromptSubmit | 💬 | Session-based |
| SessionStart | 🚀 | Session-based |
| SessionEnd | 🏁 | Session-based |
