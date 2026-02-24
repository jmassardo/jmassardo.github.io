---
layout: post
title: "GitHub Copilot CLI: Senior Developer Reference"
date: 2026-02-19 10:00:00 -0500
category: Blog
tags: [github, copilot, cli, ai, agents, automation, governance]
excerpt: "A reference-style guide for senior developers using Copilot CLI. Focus on agent runtime architecture, composition patterns, programmatic automation, and team-scale governance."
---

## Introduction

GitHub Copilot CLI is an agent runtime, not a chatbot. If you are a senior engineer evaluating it for org-scale use or building automation around it, skip the marketing sprints and learn the actual surface: modes, tool governance, composition model, and how subagents work.

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

Default loop mode: ask, review, approve/reject, iterate. Switch to plan mode with `Shift+Tab` to force upfront planning and clarifying questions before edits.

### Programmatic mode

```bash
copilot -p "your task here" [approval flags]
```

Single-shot execution. The agent completes the task and exits. Useful for CI pipelines, scripts, or workflows.

### Piping

```bash
./generate-options.sh | copilot
```

Script outputs options, `copilot` consumes them. Enables complex automation patterns.

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

### Headless approval flags

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

### Layer 1: Custom Instructions

Files in default search paths:
- `.github/copilot-instructions.md`
- `AGENTS.md`
- `$HOME/.copilot/copilot-instructions.md`

Use for persistent, always-on guidance: coding standards, repo conventions, team preferences. All instruction files now merge instead of using priority fallback.

**When to use**: You want defaults to apply across all sessions.

**When not to use**: You have workflow-specific or high-volume instructions. Use skills instead.

### Layer 2: Skills

Discrete, reusable playbooks for specific tasks. A skill is minimally a Markdown file with instructions; it can optionally include scripts, configs, or resources in a directory.

Discovery and invocation:

```text
/skills list                  # List all available skills
/SkillName do-something      # Invoke skill directly
```

Copilot CLI also auto-invokes relevant skills when it detects a matching task.

**When to use**: You need a repeatable workflow (release notes, docs checks, code review criteria) that isn't always relevant. Skills are loaded on-demand.

**When not to use**: You want always-on behavior. Use custom instructions.

### Layer 3: Custom Agents

Specialized personas with:
- A description and expertise area
- Tool permission constraints (which tools it can use)
- Optional MCP server access
- Optional auto-inference flag (when `infer: true`, Copilot may auto-delegate matching work)

Example: create a read-only audit agent that only has `read/grep/glob` access, no write/shell.

**When to use**: You need a specialist role with constrained permissions (security auditor, release manager, frontend reviewer).

**When not to use**: You just need guidance text (skills are simpler) or the default agent already works well.

### Layer 4: Hooks

Programmable lifecycle events that execute shell commands:

- `preToolUse` / `postToolUse`: Before/after any tool runs
- `userPromptSubmitted`: When user submits input
- `sessionStart` / `sessionEnd`: Session lifecycle
- `errorOccurred`: On errors
- `agentStop`: When main agent completes
- `subagentStop`: When subagent finishes

Configuration in `hooks.json` or `.github/hooks.json`.

**Use case examples**:
- Enforce guardrails: block file edits to protected paths unless a ticket ID is mentioned
- Log every tool invocation to an audit sink
- Validate tool output before returning to the user
- Auto-retry on specific errors with capped retry count

**When to use**: You need enforced policy, not just suggestions. Hooks are where guardrails become real.

### Layer 5: MCP Servers

The Model Context Protocol. Adds external data sources and tools.

GitHub always includes the GitHub MCP server by default. You can add:
- Custom internal services (ticketing, incident management, knowledge bases)
- Public MCP servers (calendar, email, databases)

Manage them inside interactive mode:

```text
/mcp               # List configured servers
/mcp add SPEC      # Add a server
```

**When to use**: Built-in tools (read, write, shell, git) are insufficient. You need integration with external systems.

### Layer 6: Plugins

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

Each subagent has its own context window, so it doesn't bloat the main session. This is where the tool shifts from chatbot to actual system.

## Context Management for Long Sessions

### Auto-compaction

When your conversation token usage approaches 95% of the limit, Copilot automatically compresses history in the background without stopping you.

### Manual control

```text
/context          # Show detailed token usage breakdown
/compact          # Force compression (press Esc to cancel)
```

This enables virtually infinite sessions. Useful for multi-day tasks or CI jobs that run for hours.

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

## Trusted Directories and Risk Mitigation

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
- Use only built-in tools
- Monitor token usage

### Phase 2: Lightweight Governance

- Add custom instructions (coding standards, test requirements)
- Create one skill for a high-value workflow (e.g., release notes)
- Still use manual approvals

### Phase 3: Specialist Delegation

- Create a custom agent with constrained tools (e.g., read-only security auditor)
- Use `infer: true` to enable auto-delegation for security reviews
- Monitor which work gets delegated

### Phase 4: Programmatic Automation

- Use programmatic mode in CI scripts
- Add hooks for policy enforcement (e.g., audit logging)
- Start with `--allow-tool` for specific, safe tools
- Never use `--allow-all-tools` unless you have strict environment isolation

### Phase 5: Distribution

- Package all customizations as a plugin
- Distribute to team via `/plugin install`
- Version and update centrally
- Gather feedback, iterate

## Key Slash Commands Reference

| Command | Purpose |
|---------|---------|
| `/login` | Authenticate with GitHub |
| `/model` | Switch models (Claude Sonnet 4.5, GPT-5, etc.) |
| `/context` | Show token usage breakdown |
| `/compact` | Manually compress session context |
| `/experimental` | Toggle experimental features (e.g., autopilot) |
| `/skills list` | List available skills |
| `/SkillName args` | Invoke a skill |
| `/mcp` | List/manage MCP servers |
| `/plugin install PKG` | Install a plugin |
| `/plugin list` | List plugins |
| `/plugin update PKG` | Update a plugin |
| `/allow-all` | Allow all tools for the session |
| `/yolo` | Alias for `/allow-all` (shorthand, same risk) |
| `/feedback` | Send feedback survey to GitHub |

## Remember: This Is Still Public Preview

Features change. Update frequently. If you hit bugs or limitations, run `/feedback` to report. The team iterates quickly.

## Final Thought

Copilot CLI is operationally useful when you treat it as a runtime, not a toy. The composition model (instructions, skills, agents, hooks, MCP, plugins) is deep. You can build real governance, audit trails, and team standardization on top of it.

The real leverage is not in asking it to write code. It's in delegating work while staying in control.

## Sources

- [GitHub Copilot CLI feature page](https://github.com/features/copilot/cli)
- [GitHub Copilot CLI repository](https://github.com/github/copilot-cli)
- [Official docs: About Copilot CLI](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/about-copilot-cli)
- [Official docs: Comparing CLI customization features](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/comparing-cli-features)
- [Official docs: About CLI plugins](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/about-cli-plugins)
- [Copilot CLI ACP server reference](https://docs.github.com/en/copilot/reference/acp-server)

---

*Questions, suggestions, or strong opinions on agent runtimes? Get in touch:*

- [LinkedIn](https://www.linkedin.com/in/jenna-massardo/)
- [GitHub](https://github.com/jmassardo)
- [Bluesky](https://bsky.app/profile/jmassardo.bsky.social)
- [Instagram](https://www.instagram.com/jennamassardo/)
- [Email](mailto:jenna@dxrf.com)
