# AI Documentation Q&A: OpenCode Flash

> [!NOTE]
> This document contains answers and insights generated based on fetch results from various OpenCode documentation sources.

## Fetch Results

- ✅ **Success**: [OpenCode Hooks](https://docs.opencode.com/en/docs/opencode/hooks) → `hooks.md`
- ✅ **Success**: [OpenCode Sub-Agents](https://docs.opencode.com/en/docs/opencode/sub-agents) → `sub-agents.md`
- ✅ **Success**: [OpenCode Skills](https://docs.opencode.com/en/docs/opencode/skills) → `skills.md`
- ✅ **Success**: [OpenCode Plugins](https://docs.opencode.com/en/docs/opencode/plugins) → `plugins.md`
- ✅ **Success**: [Gemini 2.5 Computer Use](https://blog.google/technology/google-deepmind/gemini-computer-use-model/) → `gemini-computer-use.md`
- ✅ **Success**: [OpenAI Realtime API](https://developers.openai.com/blog/realtime-api) → `openai-realtime-api.md`
- ✅ **Success**: [OpenAI Responses API](https://developers.openai.com/blog/responses-api) → `openai-responses-api.md`

---

## Question 1: Subagents Priority System

**Answer**: The OpenCode subagent priority system uses a three-tier hierarchy to determine which subagent to use when naming conflicts occur.

1. **Project-level subagents** *(Highest Priority)*  
   Located in the `.opencode/agents/` directory. These take precedence over all other subagent sources.
2. **CLI-defined subagents** *(Middle Priority)*  
   Defined dynamically using the `--agents` CLI flag. Useful for quick testing or session-specific overrides.
3. **User-level subagents** *(Lowest Priority)*  
   Located locally in `~/.opencode/agents/`. Available globally across projects but fallback compared to project or CLI definitions.

> [!TIP]
> **Example Scenario**
> If you have a general `code-reviewer` at `~/.opencode/agents/code-reviewer.md` and a project-specific one at `.opencode/agents/code-reviewer.md`, OpenCode defaults to the project-level version. This enables customized project logic without losing the convenience of baseline general agents.

---

## Question 2: Plugin Directory Structure

**Answer**: A comprehensive OpenCode plugin utilizes the following structured format:

```text
my-plugin/
├── .opencode-plugin/           # MUST INCLUDE: Plugin manifest
│   └── plugin.json             # Required
├── commands/                   # Optional: Custom slash commands
│   └── hello.md
├── agents/                     # Optional: Custom agents
│   └── helper.md
├── hooks/                      # Optional: Event handlers
│   └── hooks.json
├── skills/                     # Optional: Agent Skills
│   └── skill-name/
│       └── SKILL.md
├── mcp/                        # Optional: Model Context Protocol servers
│   └── .mcp.json
├── README.md                   # Recommended: Documentation
└── other-files/                # Optional: Supporting resources
```

### Purpose of the `.opencode-plugin` Directory

The `.opencode-plugin` directory is the metadata container. OpenCode specifically searches for `plugin.json` here to understand and load the extension. 

When a plugin is enabled, its components naturally merge with local/user configurations. Furthermore, internal hooks can easily address files using the `${OPENCODE_PLUGIN_ROOT}` environment variable.

---

## Question 3: Skills vs. Subagents

**Answer**: Agent Skills and Subagents are distinct capabilities and differ primarily in how they are invoked and how they handle context.

### The Core Differences

**Agent Skills (Function Extensions)**
- **Model-invoked**: OpenCode autonomously decides to use a Skill implicitly based on conversation context.
- **Shared Context**: Operates directly inside the main conversation layout. Great for preserving continuity.
- **Progressive**: Efficiently loads specific files only when needed.

**Subagents (Delegated Experts)**
- **User-requested**: Explicitly invoked by naming ("Use the code-reviewer") or auto-delegated via task matching.
- **Isolated Context**: Spawns entirely separate context windows, preventing main-conversation pollution.
- **Clean Slate**: Useful for maintaining tight boundaries and restrictions on external tool access.

### Comparison Summary

| Aspect | Agent Skills | Subagents |
|--------|--------------|-----------|
| **Invocation** | Model-driven (automatic) | User-requested or auto-delegated |
| **Context** | Shared main context | Separate, isolated context window |
| **Discovery** | Autonomous | Explicit mention or task map |
| **Polution** | Minimal impact | Zero impact (sandboxed) |
| **Best For** | Processing PDFs, generating commits, running linters | Complex refactoring, dedicated code review, heavy analysis |

> [!NOTE]
> Choose **Skills** when you want OpenCode to *augment its own capabilities* autonomously. Choose **Subagents** when you need to *outsource heavy, multi-step work* safely.
