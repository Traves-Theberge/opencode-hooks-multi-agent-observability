# Hooks & Plugin Reference

Reference for the OpenCode observability plugin and remaining hook scripts.

## Native Plugin — `observability.ts`

Located at `.opencode/plugins/observability.ts`, this plugin auto-loads when OpenCode starts in the project directory. It uses `fetch()` to POST events directly to the backend server.

### Plugin Events Captured

| OpenCode Event | Mapped Event Type | When It Fires |
|---------------|-------------------|--------------|
| `session.created` | `SessionStart` | New session begins |
| `session.idle` | `SessionIdle` | Agent finishes work |
| `session.error` | `SessionError` | Session errors out |
| `session.updated` | `SessionUpdated` | Session metadata changes |
| `tool.execute.before` | `PreToolUse` | Before any tool runs |
| `tool.execute.after` | `PostToolUse` | After any tool completes |
| `message.updated` | `MessageUpdated` | LLM message changes |
| `message.part.updated` | `MessagePartUpdated` | Streaming message chunks |
| `file.edited` | `FileEdited` | File modifications |
| *(init)* | `PluginLoaded` | Plugin initializes |
| *(any other)* | *(forwarded as-is)* | All other OpenCode events |

### Tool Hook Payload

```typescript
// tool.execute.before receives:
{
  tool_name: "bash",          // Tool being called
  tool_input: { ... },        // Arguments passed to tool
  directory: "/project/path"
}

// tool.execute.after receives:
{
  tool_name: "bash",
  tool_input: { ... },
  tool_response: { success: true },
  directory: "/project/path"
}
```

## Standalone Hook Scripts

These scripts run independently via `bun run` for specific tasks:

| Script | Purpose |
|--------|---------|
| `stop.ts` | Session completion logging + TTS announcements |
| `notification.ts` | User notification handling + TTS alerts |
| `subagent_stop.ts` | Subagent lifecycle tracking |

## Utility Libraries

| Module | Purpose |
|--------|---------|
| `utils/constants.ts` | Shared constants, session log directory management |
| `utils/tts/voiceai_tts.ts` | Voice.ai text-to-speech integration |

## Event Visualization

| Event Type | Display |
|-----------|---------|
| PreToolUse | Tool call intercepted |
| PostToolUse | Tool execution completed |
| SessionStart | Session began |
| SessionIdle | Agent finished work |
| SessionError | Session errored |
| MessageUpdated | LLM response updated |
| PluginLoaded | Plugin initialized |
| FileEdited | File was modified |
