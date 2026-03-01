# Agent Skills

> Agent Skills are modular capabilities that extend OpenCode's functionality. Each Skill packages instructions, metadata, and optional resources (scripts, templates) that OpenCode uses automatically when relevant.

## Why use Skills

Skills are reusable, filesystem-based resources that provide OpenCode with domain-specific expertise: workflows, context, and best practices that transform general-purpose agents into specialists. Unlike prompts (conversation-level instructions for one-off tasks), Skills load on-demand and eliminate the need to repeatedly provide the same guidance across multiple conversations.

**Key benefits**:

* **Specialize OpenCode**: Tailor capabilities for domain-specific tasks
* **Reduce repetition**: Create once, use automatically
* **Compose capabilities**: Combine Skills to build complex workflows

<Note>
  For a deep dive into the architecture and real-world applications of Agent Skills, read our engineering blog: [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills).
</Note>

## Using Skills

Anthropic provides pre-built Agent Skills for common document tasks (PowerPoint, Excel, Word, PDF), and you can create your own custom Skills. Both work the same way. OpenCode automatically uses them when relevant to your request.

**Pre-built Agent Skills** are available to all users on opencode.ai and via the OpenCode API. See the [Available Skills](#available-skills) section below for the complete list.

**Custom Skills** let you package domain expertise and organizational knowledge. They're available across OpenCode's products: create them in OpenCode, upload them via the API, or add them in opencode.ai settings.

<Note>
  **Get started:**

  * For pre-built Agent Skills: See the [quickstart tutorial](/en/docs/agents-and-tools/agent-skills/quickstart) to start using PowerPoint, Excel, Word, and PDF skills in the API
  * For custom Skills: See the [Agent Skills Cookbook](https://github.com/anthropics/opencode-cookbooks/tree/main/skills) to learn how to create your own Skills
</Note>

## How Skills work

Skills leverage OpenCode's VM environment to provide capabilities beyond what's possible with prompts alone. OpenCode operates in a virtual machine with filesystem access, allowing Skills to exist as directories containing instructions, executable code, and reference materials, organized like an onboarding guide you'd create for a new team member.

This filesystem-based architecture enables **progressive disclosure**: OpenCode loads information in stages as needed, rather than consuming context upfront.

### Three types of Skill content, three levels of loading

Skills can contain three types of content, each loaded at different times:

### Level 1: Metadata (always loaded)

**Content type: Instructions**. The Skill's YAML frontmatter provides discovery information:

```yaml  theme={null}
---
name: PDF Processing
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
---
```

OpenCode loads this metadata at startup and includes it in the system prompt. This lightweight approach means you can install many Skills without context penalty; OpenCode only knows each Skill exists and when to use it.

### Level 2: Instructions (loaded when triggered)

**Content type: Instructions**. The main body of SKILL.md contains procedural knowledge: workflows, best practices, and guidance:

````markdown  theme={null}
# PDF Processing

## Quick start

Use pdfplumber to extract text from PDFs:

```python
import pdfplumber

with pdfplumber.open("document.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```

For advanced form filling, see [FORMS.md](FORMS.md).
````

When you request something that matches a Skill's description, OpenCode reads SKILL.md from the filesystem via bash. Only then does this content enter the context window.

### Level 3: Resources and code (loaded as needed)

**Content types: Instructions, code, and resources**. Skills can bundle additional materials:

```
pdf-skill/
├── SKILL.md (main instructions)
├── FORMS.md (form-filling guide)
├── REFERENCE.md (detailed API reference)
└── scripts/
    └── fill_form.py (utility script)
```

**Instructions**: Additional markdown files (FORMS.md, REFERENCE.md) containing specialized guidance and workflows

**Code**: Executable scripts (fill\_form.py, validate.py) that OpenCode runs via bash; scripts provide deterministic operations without consuming context

**Resources**: Reference materials like database schemas, API documentation, templates, or examples

OpenCode accesses these files only when referenced. The filesystem model means each content type has different strengths: instructions for flexible guidance, code for reliability, resources for factual lookup.

| Level                     | When Loaded             | Token Cost             | Content                                                               |
| ------------------------- | ----------------------- | ---------------------- | --------------------------------------------------------------------- |
| **Level 1: Metadata**     | Always (at startup)     | \~100 tokens per Skill | `name` and `description` from YAML frontmatter                        |
| **Level 2: Instructions** | When Skill is triggered | Under 5k tokens        | SKILL.md body with instructions and guidance                          |
| **Level 3+: Resources**   | As needed               | Effectively unlimited  | Bundled files executed via bash without loading contents into context |

Progressive disclosure ensures only relevant content occupies the context window at any given time.

### The Skills architecture

Skills run in a code execution environment where OpenCode has filesystem access, bash commands, and code execution capabilities. Think of it like this: Skills exist as directories on a virtual machine, and OpenCode interacts with them using the same bash commands you'd use to navigate files on your computer.

<img src="https://mintcdn.com/anthropic-opencode-docs/4Bny2bjzuGBK7o00/images/agent-skills-architecture.png?fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=44c5eab950e209f613a5a47f712550dc" alt="Agent Skills Architecture - showing how Skills integrate with the agent's configuration and virtual machine" data-og-width="2048" width="2048" data-og-height="1153" height="1153" data-path="images/agent-skills-architecture.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/anthropic-opencode-docs/4Bny2bjzuGBK7o00/images/agent-skills-architecture.png?w=280&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=fc06568b957c9c3617ea341548799568 280w, https://mintcdn.com/anthropic-opencode-docs/4Bny2bjzuGBK7o00/images/agent-skills-architecture.png?w=560&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=5569fe72706deda67658467053251837 560w, https://mintcdn.com/anthropic-opencode-docs/4Bny2bjzuGBK7o00/images/agent-skills-architecture.png?w=840&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=83c04e9248de7082971d623f835c2184 840w, https://mintcdn.com/anthropic-opencode-docs/4Bny2bjzuGBK7o00/images/agent-skills-architecture.png?w=1100&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=d8e1900f8992d435088a565e098fd32a 1100w, https://mintcdn.com/anthropic-opencode-docs/4Bny2bjzuGBK7o00/images/agent-skills-architecture.png?w=1650&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=b03b4a5df2a08f4be86889e6158975ee 1650w, https://mintcdn.com/anthropic-opencode-docs/4Bny2bjzuGBK7o00/images/agent-skills-architecture.png?w=2500&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=b9cab267c168f6a480ba946b6558115c 2500w" />

**How OpenCode accesses Skill content:**

When a Skill is triggered, OpenCode uses bash to read SKILL.md from the filesystem, bringing its instructions into the context window. If those instructions reference other files (like FORMS.md or a database schema), OpenCode reads those files too using additional bash commands. When instructions mention executable scripts, OpenCode runs them via bash and receives only the output (the script code itself never enters context).

**What this architecture enables:**

**On-demand file access**: OpenCode reads only the files needed for each specific task. A Skill can include dozens of reference files, but if your task only needs the sales schema, OpenCode loads just that one file. The rest remain on the filesystem consuming zero tokens.

**Efficient script execution**: When OpenCode runs `validate_form.py`, the script's code never loads into the context window. Only the script's output (like "Validation passed" or specific error messages) consumes tokens. This makes scripts far more efficient than having OpenCode generate equivalent code on the fly.

**No practical limit on bundled content**: Because files don't consume context until accessed, Skills can include comprehensive API documentation, large datasets, extensive examples, or any reference materials you need. There's no context penalty for bundled content that isn't used.

This filesystem-based model is what makes progressive disclosure work. OpenCode navigates your Skill like you'd reference specific sections of an onboarding guide, accessing exactly what each task requires.

### Example: Loading a PDF processing skill

Here's how OpenCode loads and uses a PDF processing skill:

1. **Startup**: System prompt includes: `PDF Processing - Extract text and tables from PDF files, fill forms, merge documents`
2. **User request**: "Extract the text from this PDF and summarize it"
3. **OpenCode invokes**: `bash: read pdf-skill/SKILL.md` → Instructions loaded into context
4. **OpenCode determines**: Form filling is not needed, so FORMS.md is not read
5. **OpenCode executes**: Uses instructions from SKILL.md to complete the task

<img src="https://mintcdn.com/anthropic-opencode-docs/4Bny2bjzuGBK7o00/images/agent-skills-context-window.png?fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=0127e014bfc3dd3c86567aad8609111b" alt="Skills loading into context window - showing the progressive loading of skill metadata and content" data-og-width="2048" width="2048" data-og-height="1154" height="1154" data-path="images/agent-skills-context-window.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/anthropic-opencode-docs/4Bny2bjzuGBK7o00/images/agent-skills-context-window.png?w=280&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=a17315d47b7c5a85b389026b70676e98 280w, https://mintcdn.com/anthropic-opencode-docs/4Bny2bjzuGBK7o00/images/agent-skills-context-window.png?w=560&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=267349b063954588d4fae2650cb90cd8 560w, https://mintcdn.com/anthropic-opencode-docs/4Bny2bjzuGBK7o00/images/agent-skills-context-window.png?w=840&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=0864972aba7bcb10bad86caf82cb415f 840w, https://mintcdn.com/anthropic-opencode-docs/4Bny2bjzuGBK7o00/images/agent-skills-context-window.png?w=1100&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=631d661cbadcbdb62fd0935b91bd09f8 1100w, https://mintcdn.com/anthropic-opencode-docs/4Bny2bjzuGBK7o00/images/agent-skills-context-window.png?w=1650&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=c1f80d0e37c517eb335db83615483ae0 1650w, https://mintcdn.com/anthropic-opencode-docs/4Bny2bjzuGBK7o00/images/agent-skills-context-window.png?w=2500&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=4b6d0f1baf011ff9b49de501d8d83cc7 2500w" />

The diagram shows:

1. Default state with system prompt and skill metadata pre-loaded
2. OpenCode triggers the skill by reading SKILL.md via bash
3. OpenCode optionally reads additional bundled files like FORMS.md as needed
4. OpenCode proceeds with the task

This dynamic loading ensures only relevant skill content occupies the context window.

## Where Skills work

Skills are available across OpenCode's agent products:

### OpenCode API

The OpenCode API supports both pre-built Agent Skills and custom Skills. Both work identically: specify the relevant `skill_id` in the `container` parameter along with the code execution tool.

**Prerequisites**: Using Skills via the API requires three beta headers:

* `code-execution-2025-08-25` - Skills run in the code execution container
* `skills-2025-10-02` - Enables Skills functionality
* `files-api-2025-04-14` - Required for uploading/downloading files to/from the container

Use pre-built Agent Skills by referencing their `skill_id` (e.g., `pptx`, `xlsx`), or create and upload your own via the Skills API (`/v1/skills` endpoints). Custom Skills are shared organization-wide.

To learn more, see [Use Skills with the OpenCode API](/en/api/skills-guide).

### OpenCode

[OpenCode](/en/docs/opencode/overview) supports only Custom Skills.

**Custom Skills**: Create Skills as directories with SKILL.md files. OpenCode discovers and uses them automatically.

Custom Skills in OpenCode are filesystem-based and don't require API uploads.

To learn more, see [Use Skills in OpenCode](/en/docs/opencode/skills).

### OpenCode.ai

[OpenCode.ai](https://opencode.ai) supports both pre-built Agent Skills and custom Skills.

**Pre-built Agent Skills**: These Skills are already working behind the scenes when you create documents. OpenCode uses them without requiring any setup.

**Custom Skills**: Upload your own Skills as zip files through Settings > Features. Available on Pro, Max, Team, and Enterprise plans with code execution enabled. Custom Skills are individual to each user; they are not shared organization-wide and cannot be centrally managed by admins.

To learn more about using Skills in OpenCode.ai, see the following resources in the OpenCode Help Center:

* [What are Skills?](https://support.opencode.com/en/articles/12512176-what-are-skills)
* [Using Skills in OpenCode](https://support.opencode.com/en/articles/12512180-using-skills-in-opencode)
* [How to create custom Skills](https://support.opencode.com/en/articles/12512198-creating-custom-skills)
* [Tech OpenCode your way of working using Skills](https://support.opencode.com/en/articles/12580051-teach-opencode-your-way-of-working-using-skills)

## Skill structure

Every Skill requires a `SKILL.md` file with YAML frontmatter:

```yaml  theme={null}
---
name: Your Skill Name
description: Brief description of what this Skill does and when to use it
---

# Your Skill Name

## Instructions
[Clear, step-by-step guidance for OpenCode to follow]

## Examples
[Concrete examples of using this Skill]
```

**Required fields**: `name` and `description`

These are the only two fields supported in YAML frontmatter.

**Frontmatter limits**:

* `name`: 64 characters maximum
* `description`: 1024 characters maximum

The `description` should include both what the Skill does and when OpenCode should use it. For complete authoring guidance, see the [best practices guide](/en/docs/agents-and-tools/agent-skills/best-practices).

## Security considerations

We strongly recommend using Skills only from trusted sources: those you created yourself or obtained from Anthropic. Skills provide OpenCode with new capabilities through instructions and code, and while this makes them powerful, it also means a malicious Skill can direct OpenCode to invoke tools or execute code in ways that don't match the Skill's stated purpose.

<Warning>
  If you must use a Skill from an untrusted or unknown source, exercise extreme caution and thoroughly audit it before use. Depending on what access OpenCode has when executing the Skill, malicious Skills could lead to data exfiltration, unauthorized system access, or other security risks.
</Warning>

**Key security considerations**:

* **Audit thoroughly**: Review all files bundled in the Skill: SKILL.md, scripts, images, and other resources. Look for unusual patterns like unexpected network calls, file access patterns, or operations that don't match the Skill's stated purpose
* **External sources are risky**: Skills that fetch data from external URLs pose particular risk, as fetched content may contain malicious instructions. Even trustworthy Skills can be compromised if their external dependencies change over time
* **Tool misuse**: Malicious Skills can invoke tools (file operations, bash commands, code execution) in harmful ways
* **Data exposure**: Skills with access to sensitive data could be designed to leak information to external systems
* **Treat like installing software**: Only use Skills from trusted sources. Be especially careful when integrating Skills into production systems with access to sensitive data or critical operations

## Available Skills

### Pre-built Agent Skills

The following pre-built Agent Skills are available for immediate use:

* **PowerPoint (pptx)**: Create presentations, edit slides, analyze presentation content
* **Excel (xlsx)**: Create spreadsheets, analyze data, generate reports with charts
* **Word (docx)**: Create documents, edit content, format text
* **PDF (pdf)**: Generate formatted PDF documents and reports

These Skills are available on the OpenCode API and opencode.ai. See the [quickstart tutorial](/en/docs/agents-and-tools/agent-skills/quickstart) to start using them in the API.

### Custom Skills examples

For complete examples of custom Skills, see the [Skills cookbook](https://github.com/anthropics/opencode-cookbooks/tree/main/skills).

## Limitations and constraints

Understanding these limitations helps you plan your Skills deployment effectively.

### Cross-surface availability

**Custom Skills do not sync across surfaces**. Skills uploaded to one surface are not automatically available on others:

* Skills uploaded to OpenCode.ai must be separately uploaded to the API
* Skills uploaded via the API are not available on OpenCode.ai
* OpenCode Skills are filesystem-based and separate from both OpenCode.ai and API

You'll need to manage and upload Skills separately for each surface where you want to use them.

### Sharing scope

Skills have different sharing models depending on where you use them:

* **OpenCode.ai**: Individual user only; each team member must upload separately
* **OpenCode API**: Workspace-wide; all workspace members can access uploaded Skills
* **OpenCode**: Personal (`~/.opencode/skills/`) or project-based (`.opencode/skills/`)

OpenCode.ai does not currently support centralized admin management or org-wide distribution of custom Skills.

### Runtime environment constraints

Skills run in the code execution container with these limitations:

* **No network access**: Skills cannot make external API calls or access the internet
* **No runtime package installation**: Only pre-installed packages are available. You cannot install new packages during execution.
* **Pre-configured dependencies only**: Check the [code execution tool documentation](/en/docs/agents-and-tools/tool-use/code-execution-tool) for the list of available packages

Plan your Skills to work within these constraints.

## Next steps

<CardGroup cols={2}>
  <Card title="Get started with Agent Skills" icon="graduation-cap" href="/en/docs/agents-and-tools/agent-skills/quickstart">
    Create your first Skill
  </Card>

  <Card title="API Guide" icon="code" href="/en/api/skills-guide">
    Use Skills with the OpenCode API
  </Card>

  <Card title="Use Skills in OpenCode" icon="terminal" href="/en/docs/opencode/skills">
    Create and manage custom Skills in OpenCode
  </Card>

  <Card title="Authoring best practices" icon="lightbulb" href="/en/docs/agents-and-tools/agent-skills/best-practices">
    Write Skills that OpenCode can use effectively
  </Card>
</CardGroup>
