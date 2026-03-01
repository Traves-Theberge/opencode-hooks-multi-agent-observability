# Changelog

## [1.0.0] - 2026-03-01

### Changed
- **Branding Migration:** Fully migrated the application's underlying focus and nomenclature from "Claude Code" to "OpenCode".
- **Directory Migrations:**
  - Renamed `.claude/` directory to `.opencode/`.
  - Renamed `CLAUDE.md` to `OPENCODE.md`.
  - Renamed `apps/demo-cc-agent/` to `apps/demo-opencode-agent/`.
  - Renamed `apps/server/CLAUDE.md` to `apps/server/OPENCODE.md`.
  - Renamed `images/claude-code-multi-agent-orchestration.png` to `images/opencode-multi-agent-orchestration.png`.
- **Model References Migration:**
  - Renamed `ai_docs/sonnet45/` to `ai_docs/opencode-pro/`.
  - Renamed `ai_docs/haiku45/` to `ai_docs/opencode-flash/`.
  - Renamed agent implementations `.opencode/agents/fetch-docs-sonnet45.md` and `.opencode/agents/fetch-docs-haiku45.md` to use the `opencode-pro` and `opencode-flash` naming conventions.
  - Replaced internal mentions of specific models (`sonnet45`, `haiku45`, `claude-haiku`) with OpenCode abstractions (`opencode-pro`, `opencode-flash`) across UI components, READMEs, scripts, and documentation files.
- **Documentation Overhaul:**
  - Standardized terminology across all markdown files in `app_docs/` and `ai_docs/`.
  - Reformatted AI documentation answers using clean GitHub-flavoured markdown callouts and structured tables.
- **Internal APIs & UIs:**
  - Updated Vue.js components (`AgentSwimLane`, `ChatTranscript`, `EventRow`) to target OpenCode variables and text bindings.
  - Adjusted internal script tooling (like `justfile`, `scripts/*`) to properly query the new `.opencode/` pathways.
- **Hook Scripts Migration to TypeScript:**
  - Migrated all Python-based OpenCode hooks (`.opencode/hooks/*.py`) and utilities to TypeScript (`.ts`) for better integration with Node.js ecosystems.
  - Updated configuration (`.opencode/settings.json`) to execute hooks via `bun run` instead of `uv run`.
  - Replaced Python dependencies (`os`, `json`, `pathlib`) with Node.js standard modules (`fs`, `path`, `process`) across the hook lifecycle methods.
