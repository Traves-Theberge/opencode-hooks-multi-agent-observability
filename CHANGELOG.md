# Changelog

All notable changes to this project are documented here.  
Format based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Changed
- Consolidated documentation into `docs/` directory
- Rewrote `README.md` for clarity and brevity
- Fixed `justfile` hooks recipes to use Bun/TypeScript
- Migrated TTS from ElevenLabs/OpenAI to Voice.ai (`voiceai-tts-v1-latest`)
- Replaced `ELEVENLABS_API_KEY` and `OPENAI_API_KEY` with `VOICEAI_API_KEY`

### Removed
- Removed `apps/demo-opencode-agent/` (stale duplicate of hooks)
- Removed OpenAI LLM fallback (`oai.ts`) — OpenRouter is sole LLM provider
- Removed duplicate agents (`scout-report-suggest-fast`, `fetch-docs-opencode-flash`)
- Removed `create-worktree-skill/` (duplicated by `worktree-manager-skill/`)
- Removed 8 unused output styles (kept `tts-summary`, `observable-tools-diffs`, `ultra-concise`)
- Removed stale `prime.md` command, `logs/` test dirs, `system.log`
- Removed `ai_docs/` directory (stale external links)

## [1.0.0] - 2026-03-01

### Added
- TypeScript hook system with 12 event-specific scripts
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
