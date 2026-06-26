---
marp: true
title: From Adoption to Craft for AI-Assisted Development
description: A practical playbook to make daily AI coding workflows faster, cleaner, and more efficient.
author: Jenna Massardo
paginate: true
theme: default
style: |
  section {
    font-family: Avenir Next, Avenir, Helvetica, Arial, sans-serif;
    background: linear-gradient(135deg, #f4f7fb 0%, #eef6ff 45%, #f8fbff 100%);
    color: #102033;
    padding: 52px;
  }

  h1, h2, h3 {
    color: #0c4a7d;
    letter-spacing: 0.2px;
  }

  h1 {
    font-size: 1.9em;
    margin-bottom: 0.3em;
  }

  h2 {
    font-size: 1.45em;
    margin-bottom: 0.35em;
  }

  p, li {
    font-size: 0.94em;
    line-height: 1.4;
  }

  strong {
    color: #083b65;
  }

  code {
    background: #e9f3ff;
    color: #0a3f69;
    border-radius: 6px;
    padding: 0.1em 0.3em;
  }

  table {
    font-size: 0.78em;
    border-collapse: collapse;
    width: 100%;
  }

  th {
    background: #d9ecff;
    color: #0b4674;
    text-align: left;
    padding: 8px;
  }

  td {
    background: rgba(255, 255, 255, 0.75);
    padding: 8px;
    border-top: 1px solid #d3e6fb;
  }

  blockquote {
    border-left: 5px solid #2f80c7;
    background: rgba(255, 255, 255, 0.7);
    padding: 10px 14px;
    border-radius: 8px;
    margin: 0.6em 0;
    font-size: 0.9em;
  }

  .lead {
    font-size: 1.1em;
    color: #184f7d;
  }

  .small {
    font-size: 0.75em;
    color: #36516b;
  }

  .pill {
    display: inline-block;
    border: 1px solid #86b4dc;
    border-radius: 999px;
    padding: 0.15em 0.6em;
    margin-right: 0.25em;
    font-size: 0.7em;
    color: #0f4f83;
    background: #e9f3ff;
  }
---

# From Adoption to Craft

<p class="lead">Token optimization for AI-assisted development workflows</p>

<span class="pill">Instructions</span>
<span class="pill">Prompt Files</span>
<span class="pill">Skills</span>
<span class="pill">Agent Prompts</span>
<span class="pill">Context Hygiene</span>

> Audience promise: leave with a practical playbook to get faster, better AI coding outcomes with less context waste.

---

## Why This Talk Now

- We are past adoption mode
- The old question was: "Are people using it?"
- The new question is: "Are we getting better at using it?"
- Maturity means:
  - higher signal, lower noise
  - predictable speed and quality
  - repeatable team practices

> This is craft work now, not feature novelty.

---

## Session Flow

1. Where tokens burn in daily development
2. The three customization layers and when to use each
3. Prompting and context habits that improve outcomes
4. Tooling hygiene: MCP and interaction mode choice
5. Team rollout plan to level up fast

<p class="small">Talk track: optimize for quality, speed, and context efficiency together.</p>

---

## Why Tokens Matter Even on high budget plans

| Concern | Impact on your day |
|---|---|
| Response quality | Bloated context dilutes useful signal |
| Speed | Larger contexts usually increase latency |
| Context window limits | Irrelevant tokens displace relevant ones |

- high budgets don't remove latency and context constraints
- Efficient context design improves both quality and pace

---

## Where Daily Token Spend Actually Comes From

- Always-on instructions
- Open file and tab context
- Chat history accumulation
- Agent exploration and tool calls
- Retrieved docs and workspace content
- MCP tool descriptions and schemas

> Fixed context costs compound across every interaction.

---

## Use the Right Layer for the Right Job

| Layer | Loaded when | Best use |
|---|---|---|
| Instructions | Automatic | Universal project rules |
| Prompt files | You invoke | Repeatable workflows |
| Skills | AI decides | Specialized procedures |

- Maturity pattern: remove rarely-needed detail from always-on instructions
- Move specialized guidance to prompt files and skills

---

## The Core Efficiency Move

Ask this every time:

"Does this need to be present on every interaction?"

- If yes: keep in instructions
- If manually triggered workflow: prompt file
- If task-specific guidance the AI can detect: skill

| Placement strategy | Typical result |
|---|---|
| Everything in instructions | High noise, slower focus |
| Scoped and layered context | Cleaner signal, better outputs |

---

## Instruction Hygiene: Keep, Cut, Link

**Keep in instructions**
- Architecture constraints
- Stack-specific conventions
- Non-negotiable team rules

**Cut from instructions**
- Generic coding advice
- Rarely used procedures
- Long examples for niche tasks

**Link instead of inline**
- Point to docs so the agent reads them on demand
- Use clear topic labels so retrieval is intentional

---

## Scoped Instructions Beat Monolithic Rules

- Path-specific instruction files load only when relevant
- Example areas:
  - tests
  - api handlers
  - database code
- Benefits:
  - less context noise
  - stronger local guidance
  - easier ownership by domain teams

> One giant instruction file is usually an anti-pattern.

---

## Prompting Agents Like an Engineer

High-efficiency prompt anatomy:
- clear goal
- explicit scope
- explicit constraints
- precise deliverable

Example structure:

```text
Add JWT auth for /api/v2 routes.
- Use existing user model and password flow
- Return 401 with standard error format
- Do not modify frontend or existing tests
```

---

## Common Prompting Mistakes

- Vague asks that trigger broad exploration
- Multi-topic prompts that should be separate tasks
- Missing out-of-scope boundaries
- Pasting large snippets instead of referencing files

Better practice:
- break work into focused units
- reference concrete files and patterns
- define done criteria before execution

---

## Context Hygiene Inside the IDE

- Write clear signatures before function bodies
- Use descriptive naming for free context
- Keep relevant tabs open, close noisy tabs
- Keep workspace clean:
  - exclude generated artifacts
  - remove abandoned files
  - maintain ignore rules

> Your codebase quality is your model context quality.

---

## MCP and Tool Context Discipline

- Every connected tool adds context overhead
- More tools is not automatically better

Good habits:
- disconnect unused servers
- scope tools per workflow
- prefer focused toolsets for focused tasks

Result:
- better tool selection behavior
- lower context overhead
- fewer accidental detours

---

## Right-Size the Interaction Mode

| Mode | Cost profile | Best for |
|---|---|---|
| Inline | Lowest | Local completions and known patterns |
| Chat | Medium | Targeted edits and explanation |
| Agent | Highest | Multi-file implementation and exploration |

- Do not use agent mode for a one-line fix
- Use the lightest mode that can complete the task correctly

---

## Team Metrics That Show Maturity

- Time to useful response
- First-pass acceptance rate
- Rework rate after AI-generated changes
- Context efficiency indicators (noise vs useful context)
- Prompt-to-completion cycle time

<p class="small">Do not optimize raw usage. Optimize outcome quality and flow efficiency.</p>

---

## 30-Day Team Upgrade Plan

**Week 1**
- Audit and trim instruction files
- Separate universal rules from specialized procedures

**Week 2**
- Add scoped instructions by domain
- Create prompt files for top repeat workflows

**Week 3**
- Convert specialized procedures into skills
- tighten agent prompt templates

**Week 4**
- Review metrics, refine patterns, publish team playbook

---

## Final Message

- Adoption got us started
- Optimization makes us better
- Better context design improves quality, speed, and consistency
- This is a craft discipline, not a one-time tuning exercise

<p class="lead">The goal is simple: less noise, better engineering outcomes.</p>

---

## Q and A Prompts

- Which always-on instruction is currently noise?
- Which workflow should become a prompt file this week?
- Which specialized process deserves a skill?
- Where are we still using agent mode when chat or inline would be better?

<p class="small">Backup close: "Pick one workflow. Tighten context. Measure improvement. Repeat."</p>
