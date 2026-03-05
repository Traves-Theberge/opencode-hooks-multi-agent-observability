# Changelog

All notable changes to this project are documented here.  
Format based on [Keep a Changelog](https://keepachangelog.com/).

## [1.1.0] - 2026-03-04

### Added
- **Native OpenCode plugin** (`.opencode/plugins/observability.ts`) — replaces the old `settings.json` hook configuration with a proper OpenCode v1.2+ plugin that auto-loads at startup
- Plugin captures all session lifecycle events (`session.created`, `session.idle`, `session.error`), tool execution hooks (`tool.execute.before`, `tool.execute.after`), and message/file events
- Missing `utils/constants.ts` module for hook scripts

### Changed
- Migrated from `settings.json` hook definitions to native OpenCode plugin API
- Updated all agent config files to use valid `#RRGGBB` hex color format
- Scoped `.opencode/hooks/tsconfig.json` with `include`/`exclude` and `bun-types`
- Updated README.md, integration guide, and hooks reference for new architecture
- Bumped server version to `1.1.0`

### Removed
- Removed `apps/demo-opencode-agent/` (stale duplicate of hooks)
- Removed duplicate agents (`scout-report-suggest-fast`, `fetch-docs-opencode-flash`)
- Removed unused hook scripts that were replaced by the native plugin (`send_event.ts`, `pre_tool_use.ts`, `post_tool_use.ts`, `session_start.ts`, `session_end.ts`, etc.)
- Removed OpenAI npm dependency — OpenRouter is sole LLM provider

### Fixed
- Fixed agent config `color` fields using named colors instead of required hex format
- Fixed agent config `tools` fields using strings instead of required record format
- Fixed `.opencode/hooks/tsconfig.json` scanning entire project tree (missing `include`/`exclude`)
- Fixed SVG path `d` attribute errors in TopologyView (percentage signs in coordinates)

## [1.0.0] - 2026-03-01

### Added
- TypeScript hook system with event-specific scripts
- Bun-powered SQLite server with WebSocket streaming
- Vue 3 real-time dashboard with filtering and live charts
- Human-in-the-Loop (HITL) WebSocket integration
- Multi-agent team orchestration support
- TTS announcements (Voice.ai, system fallback)
- Model name extraction with 60-second file cache
- `justfile` task runner with dev recipes

### Changed
- Migrated all hook scripts from Python to TypeScript
- Replaced `uv run` with `bun run` across all configs
- Replaced `ANTHROPIC_API_KEY` with `OPENROUTER_API_KEY`
- Renamed project from Claude Code to OpenCode branding
