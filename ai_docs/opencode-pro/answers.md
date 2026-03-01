# AI Documentation Q&A: OpenCode Pro

> [!NOTE]
> This document contains answers and insights generated based on fetch results from various OpenCode documentation sources.

## Fetch Results

- ✅ **Success**: [OpenCode Hooks](https://docs.anthropic.com/en/docs/opencode/hooks) → `ai_docs/opencode-pro/opencode-hooks.md`
- ✅ **Success**: [OpenCode Sub-Agents](https://docs.opencode.com/en/docs/opencode/sub-agents) → `ai_docs/opencode-pro/opencode-sub-agents.md`
- ✅ **Success**: [OpenCode Skills](https://docs.opencode.com/en/docs/opencode/skills) → `ai_docs/opencode-pro/opencode-skills.md`
- ✅ **Success**: [OpenCode Plugins](https://docs.opencode.com/en/docs/opencode/plugins) → `ai_docs/opencode-pro/opencode-plugins.md`
- ✅ **Success**: [Gemini 2.5 Computer Use](https://blog.google/technology/google-deepmind/gemini-computer-use-model/) → `ai_docs/opencode-pro/gemini-25-computer-use.md`
- ✅ **Success**: [OpenAI Realtime API](https://developers.openai.com/blog/realtime-api) → `ai_docs/opencode-pro/openai-realtime-api.md`
- ✅ **Success**: [OpenAI Responses API](https://developers.openai.com/blog/responses-api) → `ai_docs/opencode-pro/openai-responses-api.md`

---

## Question 1: Subagents Priority System

Based on the fetched documentation, there are two primary storage locations for subagents:

1. **Project-level**: `.opencode/agents/` — Stored within the project repository.
2. **User-level**: `~/.opencode/agents/` — Stored globally in the user's home directory.

> [!WARNING]
> **Important Limitation**
> The provided documentation summary does not explicitly detail a resolution system for handling naming conflicts between project-level and user-level subagents. 

### Key Behaviors
- Subagents can be configured at both project and user levels.
- Project-level subagents can be version-controlled for team collaboration.
- OpenCode can automatically delegate to subagents based on task descriptions, or accept explicit invocation.

**Example Scenario**:
If a team has a "code-reviewer" subagent in `.opencode/agents/code-reviewer.md` (project-specific) and a developer has their own in `~/.opencode/agents/code-reviewer.md` (personal), the current summary doesn't explicitly specify which takes precedence.

---

## Question 2: Plugin Directory Structure

A complete OpenCode plugin requires the following directory structure:

```text
plugin-name/
├── .opencode-plugin/           # MUST INCLUDE: Marks directory as a plugin
│   ├── plugin.json             # Required: Plugin metadata
│   └── marketplace.json        # Required for distribution
├── commands/                   # Optional: Custom slash commands
│   └── command-name.md
├── agents/                     # Optional: Custom agent definitions
│   └── agent-name.md
├── skills/                     # Optional: Agent Skills
│   └── SKILL.md
└── hooks/                      # Optional: Event handlers
    └── hooks.json
```

### Purpose of `.opencode-plugin` Directory

> [!IMPORTANT]
> The `.opencode-plugin` directory is the **required identifier**. Without it, OpenCode will not recognize the directory as a valid plugin.

1. **`plugin.json`** (Required)
   Contains crucial metadata such as name, description, version, author, and dependencies.
2. **`marketplace.json`** (Required for distribution)
   Contains marketplace information for discovery, distribution settings, and compatibility.

---

## Question 3: Skills vs. Subagents

Agent Skills and Subagents differ fundamentally in their invocation, context management, and use cases:

### Invocation Differences

**Agent Skills**
- **Autonomous/Model-Invoked**: OpenCode automatically activates a Skill based on the task description.
- Triggered based on relevance—no explicit user request necessary.

**Subagents**
- **Explicit or Automatic Delegation**: Can be invoked explicitly by name (e.g., "Use the code-reviewer subagent") or auto-delegated.
- Represents a more deliberate handoff of control to a specialized agent.

### Context Management

**Agent Skills**
- Operate within the **same conversation context**.
- Do not create separate context windows.
- Function as lightweight extensions to OpenCode's capabilities in-place.

**Subagents**
- **Isolated Context**: Each subagent operates in its own dedicated context window.
- Prevents context pollution of the main conversation.
- Each agent maintains its own custom system prompt and specific tool access configuration.

### When to Use Which?

| Feature | Best For | Typical Examples |
|---------|----------|------------------|
| **Agent Skills** | Lightweight, focused capabilities that don't require isolation. | Standardized docs generation, code formatting rules, PR checklists. |
| **Subagents** | Complex tasks requiring isolated context, restricted tools, or specialized expertise. | Deep code analysis, security auditing, complex refactoring. |
