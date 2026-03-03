---
layout: post
title: "GitHub Copilot CLI: Senior Developer Reference"
date: 2026-02-25 10:00:00 -0500
category: Blog
tags: [github, copilot, cli, ai, agents, automation, governance]
excerpt: "A reference-style guide for senior developers using Copilot CLI (GA). Focus on agent runtime architecture, composition patterns, autopilot mode, memory, programmatic automation, and team-scale governance."
---

## Introduction

GitHub Copilot CLI [went GA on February 25, 2026](https://github.blog/changelog/2026-02-25-github-copilot-cli-is-now-generally-available/) and is available with all Copilot plans (Free, Pro, Pro+, Business, Enterprise). It is an agent runtime, not a chatbot. If you are a senior engineer evaluating it for org-scale use or building automation around it, skip the marketing sprints and learn the actual surface: modes, tool governance, composition model, memory, and how subagents work.

This is reference material for staff and principal engineers who ship code at scale and care about reproducibility, audit trails, and control.

<!-- more -->

## The Architecture You Need to Understand

Copilot CLI runs an agentic loop: sense, plan, execute, iterate. You interact with it through two interfaces (interactive and programmatic) and you can customize behavior through a layered composition model: instructions, skills, agents, hooks, MCP servers, and plugins.

The power is not in asking it questions. The power is in delegating work while keeping governance sane.

## Modes and Entry Points

### Interactive mode

```bash
copilot
```

Default loop mode: ask, review, approve/reject, iterate. Press `Shift+Tab` to cycle between three modes:

1. **Ask mode** (default): Execute immediately, asking for approval on tool use.
2. **[Plan mode](https://docs.github.com/en/copilot/how-tos/copilot-cli/cli-best-practices#2-plan-before-you-code)**: Copilot analyzes your request, asks clarifying questions, and builds a structured implementation plan before writing code. Review and approve the plan, then watch it execute.
3. **[Autopilot mode](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/autopilot)**: Copilot works fully autonomously—executing tools, running commands, and iterating without stopping for approval. When prompted, choose a permission level for the session.

### Programmatic mode

```bash
copilot -p "your task here" [approval flags]
```

Single-shot execution. The agent completes the task and exits. Useful for CI pipelines, scripts, or workflows.

For autopilot in programmatic mode:

```bash
copilot --autopilot --yolo --max-autopilot-continues 10 \
  -p "Run the full test suite, fix any failures, and commit"
```

### Piping

```bash
./generate-options.sh | copilot
```

Script outputs options, `copilot` consumes them. Enables complex automation patterns.

### Background delegation

Prefix a prompt with `&` or use `/delegate` to push work to the Copilot coding agent in the cloud:

```text
& complete the API integration tests and fix any failing edge cases
/delegate complete the API integration tests and fix any failing edge cases
```

Copilot commits unstaged changes as a checkpoint, creates a branch, opens a draft PR, and works in the background. Use `/resume` to switch between local and remote coding agent sessions.

### Session resume

Pick up where you left off:

```bash
copilot --resume    # Select from previous sessions (local and remote)
copilot --continue  # Resume the most recently closed local session
```

Inside an interactive session, use `/resume` to browse and resume any session, including Copilot coding agent sessions running on GitHub.

## Approval and Permission Model

This is the security model. Understand it before deploying.

### Per-invocation approvals

Default behavior in interactive mode. The agent asks before using tools that modify or execute. You have three choices per request:

```
1. Yes (this command only)
2. Yes, and approve TOOL for the rest of this session
3. No, and tell Copilot what to do differently (Esc)
```

Choosing option 2 for a tool family (like `shell`) grants broad permission for that tool class in the current session only.

### [Headless approval flags](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/configure-copilot-cli#setting-allowed-tools)

`--allow-all-tools`
: The agent can use any tool without asking. High risk.

`--allow-tool 'shell(git)'`
: Allow specific tools. Combine multiple times.

`--allow-tool 'shell'`
: Allow all shell commands.

`--allow-tool 'write'`
: Allow all file modifications.

`--allow-tool 'MCP_SERVER_NAME'`
: Allow tools from a specific MCP server.

`--deny-tool 'shell(rm)'`
: Deny specific tools. Takes precedence over allow flags.

### Real-world pattern for automation

```bash
copilot -p "Revert the last commit and push the branch" \
  --allow-all-tools \
  --deny-tool 'shell(rm)' \
  --deny-tool 'shell(git push --force)'
```

This approves everything except destructive commands. Safer than yolo-mode, still risky. Test in containers first.

## The Composition Model: How to Reach Team Scale

This is where Copilot CLI goes from personal productivity to org-level tool.

### Layer 1: [Custom Instructions](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions)

Files in default search paths:
- `.github/copilot-instructions.md` ([repository-wide](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions#repository-wide-custom-instructions))
- `.github/instructions/**/*.instructions.md` ([path-specific](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions#creating-path-specific-custom-instructions))
- `AGENTS.md` ([agent instructions](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions#agent-instructions))
- `$HOME/.copilot/copilot-instructions.md` ([user-level](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions#local-instructions))

Use for persistent, always-on guidance: coding standards, repo conventions, team preferences. All instruction files now merge instead of using priority fallback.

Skip loading them with `--no-custom-instructions`. Use `/init` to auto-generate instructions tailored to your project.

**When to use**: You want defaults to apply across all sessions.

**When not to use**: You have workflow-specific or high-volume instructions. Use skills instead.

### Layer 2: [Skills](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-skills)

Discrete, reusable playbooks for specific tasks. A skill is minimally a Markdown file with instructions; it can optionally include scripts, configs, or resources in a directory.

Discovery and invocation:

```text
/skills list                  # List all available skills
/SkillName do-something      # Invoke skill directly
```

Copilot CLI also auto-invokes relevant skills when it detects a matching task.

**When to use**: You need a repeatable workflow (release notes, docs checks, code review criteria) that isn't always relevant. Skills are loaded on-demand.

**When not to use**: You want always-on behavior. Use custom instructions.

### Layer 3: [Custom Agents](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-custom-agents-for-cli)

Specialized personas defined in `.agent.md` files ([configuration reference](https://docs.github.com/en/copilot/reference/custom-agents-configuration)) with YAML frontmatter:
- A description and expertise area
- Tool permission constraints (which tools it can use)
- Optional MCP server access
- Optional auto-inference flag (when `infer: true`, Copilot may auto-delegate matching work)

Copilot CLI ships with **built-in agents** that it auto-delegates to:

| Agent | Purpose |
|---|---|
| **Explore** | Fast codebase analysis without polluting main context |
| **Task** | Runs builds and tests; brief summaries on success, full output on failure |
| **General-purpose** | Complex, multi-step tasks with full toolset in a separate context |
| **Code-review** | Reviews changes, surfaces genuine issues, minimizes noise |
| **Plan** | Implementation planning and scoping |

Multiple built-in agents can run in parallel.

Define your own at three levels:

| Scope | Location | Applies to |
|---|---|---|
| [User](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-custom-agents-for-cli#creating-a-custom-agent) | `~/.copilot/agents/` | All projects |
| [Repository](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-custom-agents-for-cli#creating-a-custom-agent) | `.github/agents/` | Current project |
| [Org/Enterprise](https://docs.github.com/en/copilot/reference/custom-agents-configuration) | `.github-private/agents/` | All projects in the org/enterprise |

Naming conflicts resolve: system > repository > organization.

Invoke custom agents three ways:

```bash
# Interactive: browse available agents
/agent

# Natural language (Copilot infers the agent)
Use the refactoring agent to refactor this code block

# Explicit CLI flag
copilot --agent=refactor-agent --prompt "Refactor this code block"
```

**When to use**: You need a specialist role with constrained permissions (security auditor, release manager, frontend reviewer).

**When not to use**: You just need guidance text (skills are simpler) or the default agent already works well.

### Layer 4: [Hooks](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/use-hooks)

Programmable lifecycle events that execute shell commands:

- `preToolUse` / `postToolUse`: Before/after any tool runs
- `userPromptSubmitted`: When user submits input
- `sessionStart` / `sessionEnd`: Session lifecycle
- `errorOccurred`: On errors
- `agentStop`: When main agent completes
- `subagentStop`: When subagent finishes

Configuration in `hooks.json` or `.github/hooks.json`. See the [hooks configuration reference](https://docs.github.com/en/copilot/reference/hooks-configuration).

**Use case examples**:
- Enforce guardrails: block file edits to protected paths unless a ticket ID is mentioned
- Log every tool invocation to an audit sink
- Validate tool output before returning to the user
- Auto-retry on specific errors with capped retry count

**When to use**: You need enforced policy, not just suggestions. Hooks are where guardrails become real.

### Layer 5: [MCP Servers](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers)

The [Model Context Protocol](https://docs.github.com/en/copilot/concepts/about-mcp). Adds external data sources and tools.

GitHub always includes the GitHub MCP server by default. You can add:
- Custom internal services (ticketing, incident management, knowledge bases)
- Public MCP servers (calendar, email, databases)

Manage them inside interactive mode:

```text
/mcp               # List configured servers
/mcp add           # Interactive wizard to add a server
```

Server configs are stored in `~/.copilot/mcp-config.json` (customizable via `XDG_CONFIG_HOME`).

> **Known limitation**: Copilot CLI does not currently support organization-level MCP server policies (the "MCP servers in Copilot" and "MCP Registry URL" settings).

**When to use**: Built-in tools (read, write, shell, git) are insufficient. You need integration with external systems.

### Layer 6: [Plugins](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-finding-installing)

Distributable packages that bundle customizations: skills, agents, hooks, MCP configs, LSP configs. Single installation unit.

```text
/plugin install copilot-plugins/my-plugin
/plugin list
/plugin update my-plugin
/plugin uninstall my-plugin
```

Default marketplaces:
- `copilot-plugins` (official GitHub plugins)
- `awesome-copilot`

**When to use**: You want to ship a team-wide customization bundle without manual copy/paste.

## Delegation and Subagents

When you ask Copilot CLI to do complex work, it can spin up subagents:

- **For codebase exploration**: Map dependencies, find endpoints, model the structure
- **For builds/tests**: Run a test suite, parse failures, report
- **For code review**: Analyze staged changes, find issues
- **For multi-step features**: Implement across files, test, commit
- **For custom agents**: If you've defined a custom agent with `infer: true`, Copilot may auto-delegate matching work to that subagent

Each subagent has its own context window, so it doesn't bloat the main session. Multiple built-in agents can [run in parallel](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/fleet). This is where the tool shifts from chatbot to actual system.

### Steering while thinking

You can interact with Copilot while it's processing:

- **Enqueue messages**: Send follow-up prompts to steer direction or queue additional instructions for after the current response.
- **Inline rejection feedback**: When you reject a tool permission request, provide inline feedback so Copilot can adapt without stopping entirely.

## Context Management for Long Sessions

### Auto-compaction

When your conversation token usage approaches 95% of the limit, Copilot automatically compresses history in the background without stopping you.

### Manual control

```text
/context          # Show detailed token usage breakdown
/compact          # Force compression (press Esc to cancel)
/usage            # Session stats: premium requests used, duration, lines edited, tokens per model
```

This enables virtually infinite sessions. Useful for multi-day tasks or CI jobs that run for hours.

### [Copilot Memory](https://docs.github.com/en/copilot/concepts/agents/copilot-memory) (Repository Memory)

Copilot Memory is a persistent, repository-scoped knowledge system. As Copilot works on your codebase, it stores "memories"—tightly scoped facts about conventions, patterns, and preferences it discovers. Memories:

- Persist across sessions (auto-expire after 28 days if unused)
- Are validated against the current codebase before use (stale memories are ignored)
- Are shared across Copilot surfaces (CLI, coding agent, code review)
- Are repository-scoped, not user-scoped
- Require write permission to the repo

This means if Copilot coding agent discovers how your repo handles database connections, Copilot code review can later apply that knowledge to spot inconsistencies in a PR.

Copilot Memory is off by default. Enable it in enterprise, organization, or personal Copilot settings. Repository owners can review and delete stored memories.

**When to use**: You want Copilot to learn your codebase over time without maintaining elaborate custom instruction files.

**When not to use**: You need deterministic, version-controlled behavior. Use custom instructions instead.

## Review, Diff, and Undo

GA added dedicated workflows for reviewing and reverting changes:

| Command | Description |
|---|---|
| `/diff` | Review all session changes with syntax-highlighted inline diffs. Add line-specific comments as structured feedback. Toggle between session changes and branch diffs. |
| `/review` | Analyze staged or unstaged code changes for a quick sanity check before committing. |
| `Esc`-`Esc` | Rewind file changes to any previous snapshot in the session. |

## Prompt Helpers

### File references

Use `@` followed by a relative path to include a file's contents as context:

```text
Explain @config/ci/ci-required-checks.yml
Fix the bug in @src/app.js
```

Tab-completion works on file paths.

### Direct shell execution

Prefix with `!` to run shell commands directly, without a model call:

```text
!git clone https://github.com/github/copilot-cli
!npm test
```

### Reasoning visibility

Press `Ctrl+T` to show or hide the model's reasoning process. This setting persists across sessions.

### Longer prompts

Press `Ctrl+X`, `Ctrl+E` to open your `$EDITOR` for composing multi-line prompts.

### Working directory management

```text
/add-dir /path/to/directory    # Add a trusted directory mid-session
/cd /path/to/directory         # Switch working directory without restarting
```

## Programmatic Integration: CI, Webhooks, Automation

### In CI pipelines

```bash
#!/bin/bash
copilot -p "Run tests, report coverage" \
  --allow-tool 'shell(npm)' \
  --allow-tool 'shell(git)' \
  --deny-tool 'shell(git push)' \
  --allow-tool 'write'
```

For fully autonomous CI runs:

```bash
copilot --autopilot --yolo --max-autopilot-continues 10 \
  -p "Run the full test suite and fix any failures"
```

### Error handling

Combine with exit codes and conditional logic:

```bash
if copilot -p "Does this PR pass security checks?" --allow-tool 'shell'; then
  echo "Security checks passed"
else
  echo "Security issue detected"
  exit 1
fi
```

### Via ACP (Agent Client Protocol)

Copilot CLI runs an ACP server, so compatible tools, IDEs, and automation systems can invoke it as an agent. See the [Copilot CLI ACP reference](https://docs.github.com/en/copilot/reference/acp-server).

## [Trusted Directories](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/configure-copilot-cli#setting-trusted-directories) and Risk Mitigation

**Treat trusted directories seriously.** You should only launch `copilot` from directories you trust.

Do not:
- Launch from your home directory
- Launch in directories with executables you can't verify
- Launch in directories with sensitive data you don't want modified

On first launch, you'll confirm trust. Scoping is heuristic; GitHub does not guarantee files outside trusted directories are protected.

**For higher-risk automation**, run Copilot CLI in a restricted environment: container, VM, or isolated system with tight file permissions and network policy. This confines blast radius if something goes wrong.

## Team Rollout Pattern (Conservative to Bold)

### Phase 1: Baseline

- Install `copilot` locally with default settings
- Test in interactive mode with manual approvals
- Use only built-in tools and the `/review` command
- Monitor token usage with `/usage`

### Phase 2: Lightweight Governance

- Add custom instructions (coding standards, test requirements)
- Run `/init` to bootstrap repo-specific instructions
- Create one skill for a high-value workflow (e.g., release notes)
- Enable Copilot Memory for persistent codebase learning
- Still use manual approvals

### Phase 3: Specialist Delegation

- Create a custom agent with constrained tools (e.g., read-only security auditor)
- Use `infer: true` to enable auto-delegation for security reviews
- Use `/delegate` to offload longer tasks to Copilot coding agent
- Monitor which work gets delegated

### Phase 4: Programmatic Automation

- Use programmatic mode in CI scripts
- Test autopilot mode (`--autopilot`) in isolated environments
- Add hooks for policy enforcement (e.g., audit logging)
- Start with `--allow-tool` for specific, safe tools
- Never use `--allow-all-tools` unless you have strict environment isolation

### Phase 5: Distribution

- Package all customizations as a plugin
- Distribute to team via `/plugin install`
- Version and update centrally
- Gather feedback, iterate

## Model Selection

The default model is Claude Sonnet 4.6. Available models at GA include:

- **Claude Opus 4.6**, **Claude Sonnet 4.6** (Anthropic)
- **GPT-5.3-Codex** (OpenAI)
- **Gemini 3 Pro** (Google)
- **Claude Haiku 4.5** (fast tasks)

**GPT-5 mini** and **GPT-4.1** are included at no additional premium request cost.

Switch mid-session with `/model` or at launch with `--model`. Each prompt submission counts as one [premium request](https://docs.github.com/en/copilot/concepts/billing/copilot-requests), multiplied by the model's multiplier (shown in the model list).

## Enterprise Features

For org-scale deployment:

- **Organization policies**: Administrators control model availability and Copilot CLI enablement via Copilot policy settings.
- **Proxy support**: HTTPS proxy for environments behind corporate firewalls.
- **Authentication**: OAuth device flow, GitHub CLI token reuse, and `GITHUB_ASKPASS` for CI/CD.
- **[Hook-based policy enforcement](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/use-hooks)**: Use `preToolUse` hooks to enforce file access policies, argument sanitization, and custom approval workflows.
- **[Configuration](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/configure-copilot-cli)**: Adjust settings in `~/.copilot/config.json` (customizable via `XDG_CONFIG_HOME`). Use `copilot help config` for details.

For Copilot Business and Enterprise subscribers, an administrator must enable Copilot CLI from the Policies page.

## Key Slash Commands Reference

| Command | Purpose |
|---------|---------|
| `/login` | Authenticate with GitHub |
| `/model` | Switch models (Claude Sonnet 4.6, GPT-5.3-Codex, etc.) |
| `/agent` | Browse and select available custom agents |
| `/init` | Auto-generate custom instructions for the current project |
| `/context` | Show token usage breakdown |
| `/compact` | Manually compress session context |
| `/usage` | Session stats: requests used, duration, lines edited, tokens per model |
| `/diff` | Review session changes with inline diffs and comments |
| `/review` | Analyze staged/unstaged changes before committing |
| `/delegate` | Push work to Copilot coding agent in the cloud |
| `/resume` | Browse and resume previous sessions (local and remote) |
| `/skills list` | List available skills |
| `/SkillName args` | Invoke a skill |
| `/mcp` | List/manage MCP servers |
| `/mcp add` | Interactive wizard to add an MCP server |
| `/plugin install PKG` | Install a plugin |
| `/plugin list` | List plugins |
| `/plugin update PKG` | Update a plugin |
| `/add-dir PATH` | Add a trusted directory mid-session |
| `/cd PATH` | Change working directory without restarting |
| `/theme` | Choose from built-in themes (GitHub Dark, Light, colorblind variants) |
| `/experimental` | Toggle experimental features (e.g., alt-screen mode) |
| `/allow-all` | Allow all tools for the session |
| `/yolo` | Alias for `/allow-all` (shorthand, same risk) |
| `/feedback` | Send feedback survey to GitHub |
| `?` | Show all available commands and keyboard shortcuts |

## Key Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Shift+Tab` | Cycle modes: Ask → Plan → Autopilot |
| `Esc` | Stop current operation |
| `Esc`-`Esc` | Rewind/undo to a previous snapshot |
| `Ctrl+T` | Toggle reasoning visibility (persists across sessions) |
| `Ctrl+X`, `Ctrl+E` | Open `$EDITOR` for longer prompts |
| `Ctrl+Z` | Suspend/resume Copilot CLI |
| `Ctrl+A/E/W/U/K` | Standard UNIX line editing |
| `Alt+arrows` | Word-level cursor movement |
| `?` | Quick help overlay |

## Final Thought

Copilot CLI is operationally useful when you treat it as a runtime, not a toy. The composition model (instructions, skills, agents, hooks, MCP, plugins) is deep. You can build real governance, audit trails, and team standardization on top of it.

The real leverage is not in asking it to write code. It's in delegating work while staying in control.

## Sources

- [GA announcement (Feb 25, 2026)](https://github.blog/changelog/2026-02-25-github-copilot-cli-is-now-generally-available/)
- [GitHub Copilot CLI feature page](https://github.com/features/copilot/cli)
- [GitHub Copilot CLI repository](https://github.com/github/copilot-cli)
- [Official docs: About Copilot CLI](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/about-copilot-cli)
- [Official docs: Using Copilot CLI](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/use-copilot-cli)
- [Official docs: Getting started](https://docs.github.com/en/copilot/how-tos/copilot-cli/cli-getting-started)
- [Official docs: Configure Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/configure-copilot-cli)
- [Official docs: Custom instructions](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions)
- [Official docs: Custom agents](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-custom-agents-for-cli)
- [Official docs: Skills](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-skills)
- [Official docs: Hooks](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/use-hooks)
- [Official docs: MCP servers](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers)
- [Official docs: Plugins](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-finding-installing)
- [Official docs: Autopilot mode](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/autopilot)
- [Official docs: Comparing CLI customization features](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/comparing-cli-features)
- [Official docs: About CLI plugins](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/about-cli-plugins)
- [Official docs: About Copilot Memory](https://docs.github.com/en/copilot/concepts/agents/copilot-memory)
- [Official docs: Best practices](https://docs.github.com/en/copilot/how-tos/copilot-cli/cli-best-practices)
- [Official docs: CLI command reference](https://docs.github.com/en/copilot/reference/cli-command-reference)
- [Official docs: Custom agents configuration](https://docs.github.com/en/copilot/reference/custom-agents-configuration)
- [Official docs: Hooks configuration](https://docs.github.com/en/copilot/reference/hooks-configuration)
- [Copilot CLI ACP server reference](https://docs.github.com/en/copilot/reference/acp-server)

## Closing

*Have questions about Copilot CLI or agent runtimes? Find me on [GitHub](https://github.com/jmassardo), [LinkedIn](https://www.linkedin.com/in/jenna-massardo/), or [Bluesky](https://bsky.app/profile/jmassardo.bsky.social).*
