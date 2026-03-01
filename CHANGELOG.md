# Changelog

All notable changes to this project are documented here.  
Format based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Changed
- Consolidated documentation into `docs/` directory
- Rewrote `README.md` for clarity and brevity
- Fixed `justfile` hooks recipes to use Bun/TypeScript

### Removed
- Removed `ai_docs/` directory (stale external links)
- Removed `app_docs/` directory (moved to `docs/`)
- Removed `specs/` directory (one-off planning artifacts)
- Removed `.mcp.json.firecrawl_7k.sample`

## [1.0.0] - 2026-03-01

### Added
- TypeScript hook system with 12 event-specific scripts
- Bun-powered SQLite server with WebSocket streaming
- Vue 3 real-time dashboard with filtering and live charts
- Human-in-the-Loop (HITL) WebSocket integration
- Multi-agent team orchestration support
- TTS announcements (ElevenLabs, OpenAI, system fallback)
- Model name extraction with 60-second file cache
- `justfile` task runner with dev recipes

### Changed
- Migrated all hook scripts from Python to TypeScript
- Replaced `uv run` with `bun run` across all configs
- Replaced `ANTHROPIC_API_KEY` with `OPENROUTER_API_KEY`
- Renamed project from Claude Code to OpenCode branding
