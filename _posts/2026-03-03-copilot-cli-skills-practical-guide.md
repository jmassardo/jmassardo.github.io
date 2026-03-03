---
layout: post
title: "Copilot CLI Skills: A Practical Guide With Examples for Every Role"
date: 2026-03-03 10:00:00 -0500
category: Blog
tags: [github, copilot, cli, ai, skills, automation, devops]
excerpt: "Skills are how you teach Copilot CLI to do your job your way. This guide covers what skills are, how to build them, and includes ready-to-use examples for developers, data engineers, DBAs, project managers, and technical writers."
---

## Introduction

If you have been using [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/cli-getting-started) for a while, you have probably noticed something: Copilot is smart, but it does not know *your* workflow. It does not know that your team uses a specific PR template, that your database migrations follow a naming convention, or that your release notes always need a "Breaking Changes" section.

That is where [skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills) come in. Skills are on-demand playbooks that teach Copilot how to handle specific tasks the way *you* want them handled. They are not always-on like custom instructions. They load only when they are relevant, which keeps Copilot's context window focused on the work at hand.

The best part? Skills are just Markdown files. No SDK. No API integration. No deployment pipeline. If you can write a README, you can write a skill.

This guide covers what skills are, how to create them, and then walks through practical examples across multiple roles. Not everyone who benefits from Copilot CLI is a developer, so we will cover skills for technical writers, project managers, data scientists, DBAs, and developers alike.

<!-- more -->

## What Is a Skill?

A skill is a folder containing a `SKILL.md` file and optionally supporting resources (scripts, templates, config files). The `SKILL.md` file has two parts:

1. **YAML frontmatter** with a `name` and `description`
2. **Markdown body** with the instructions Copilot should follow

When Copilot decides a skill is relevant to your prompt (based on the `description`), it loads the `SKILL.md` into its context and follows the instructions. You can also invoke a skill explicitly with a slash command.

Here is the minimal structure:

```
.github/skills/my-skill/
  SKILL.md
```

And the minimal `SKILL.md`:

```markdown
---
name: my-skill
description: Does a specific thing. Use this when asked to do that specific thing.
---

Instructions for Copilot go here. Be specific. Be prescriptive.
```

That is it. Copilot handles the rest.

## Where Skills Live

Skills can be stored in two places:

| Scope | Location | Applies to |
|---|---|---|
| **Project** | `.github/skills/` or `.claude/skills/` | Current repository only |
| **Personal** | `~/.copilot/skills/` or `~/.claude/skills/` | All projects on your machine |

Project skills are great for team conventions. Personal skills are great for your own workflows that you use everywhere. Organization-level and enterprise-level skill support is [coming soon](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills).

## Creating a Skill: Step by Step

1. **Create the directory.** Each skill gets its own folder under a `skills` parent. Use lowercase names with hyphens.

   ```bash
   mkdir -p .github/skills/my-new-skill
   ```

2. **Create the `SKILL.md` file.** The file *must* be named `SKILL.md` (case-sensitive).

   ```bash
   touch .github/skills/my-new-skill/SKILL.md
   ```

3. **Write the frontmatter.** Two fields are required:
   - `name`: Unique identifier, lowercase with hyphens. Should match the directory name.
   - `description`: Tells Copilot *what* the skill does and *when* to use it. This is the most important part for auto-invocation. Write it like you are telling a new hire when to reach for this playbook.

4. **Write the instructions.** Be prescriptive. Tell Copilot exactly what steps to follow, what tools to use, what format to produce, and what to avoid.

5. **Optionally, add supporting files.** Scripts, templates, example outputs, or reference docs can live in the same directory. Reference them in your instructions.

6. **Test the skill.** In a Copilot CLI session:

   ```text
   /skills list          # Verify it shows up
   /skills info          # See details and location
   /my-new-skill test    # Invoke it explicitly
   ```

   If you created the skill during an active session, reload with `/skills reload`.

## Skills vs. Custom Instructions: When to Use Which

This trips people up, so let's be clear:

| | Custom Instructions | Skills |
|---|---|---|
| **Loaded** | Always, every session | On-demand, when relevant |
| **Purpose** | General guidance (coding standards, team conventions) | Specific task playbooks |
| **Scope** | Everything Copilot does | One type of task |
| **Context cost** | Always consuming tokens | Only when active |

**Rule of thumb:** If it applies to *every* task, put it in custom instructions. If it applies to *one type of task*, make it a skill.

For a deeper comparison of all customization options, see [Comparing GitHub Copilot CLI customization features](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/comparing-cli-features).

## Writing Effective Skill Descriptions

The `description` field in your frontmatter is how Copilot decides whether to auto-invoke your skill. A vague description means Copilot will rarely pick it up. A specific description with trigger words means it fires reliably.

**Weak:**

```yaml
description: Helps with documentation.
```

**Strong:**

```yaml
description: Generates and updates user-facing documentation when frontend components are added or modified. Use this when asked to write docs, update docs, or when frontend code changes require documentation updates.
```

Include action verbs, the *type* of work, and explicit trigger scenarios. If your team uses a specific keyword (like "doccheck" or "releasenotes"), mention it in the description.

## Example Skills

Now for the good stuff. Here are practical, ready-to-use skills organized by persona. Copy them, modify them, ship them.

### Non-Developer Personas

These skills are for the people who are not writing application code but absolutely benefit from Copilot CLI. Project managers, technical writers, and team leads all have repetitive, structured tasks that skills can standardize.

#### Skill: Release Notes Drafter (Project Managers / Release Engineers)

**Location:** `.github/skills/release-notes-drafter/SKILL.md`

```markdown
---
name: release-notes-drafter
description: Drafts release notes by analyzing recent commits and pull requests. Use this when asked to create release notes, write a changelog, or prepare a release summary.
---

## Instructions

Generate release notes for the specified version or date range. Follow these steps:

1. Use the GitHub MCP server tools to list merged pull requests since the last release tag.
2. Categorize changes into the following sections (skip empty sections):
   - **Breaking Changes** - Any changes that break backwards compatibility
   - **New Features** - New functionality
   - **Bug Fixes** - Defect corrections
   - **Performance** - Performance improvements
   - **Documentation** - Docs-only changes
   - **Dependencies** - Dependency updates
   - **Internal** - Refactoring, CI changes, test improvements
3. For each entry, include:
   - A one-line summary written for end users (not developers)
   - The PR number as a link
   - The author's GitHub handle
4. Include a "Contributors" section at the bottom listing all unique contributors.
5. Write the output in Markdown format suitable for a GitHub Release.

## Formatting Rules

- Use past tense ("Added", "Fixed", "Removed")
- Do not include commit hashes in the user-facing notes
- If a PR title is unclear, read the PR description to write a better summary
- Group related PRs under a single bullet when they are part of the same feature
```

**Invocation:**

```text
/release-notes-drafter Draft release notes for everything since v2.4.0
```

#### Skill: Meeting Notes Structurer (Team Leads)

**Location:** `~/.copilot/skills/meeting-notes/SKILL.md`

```markdown
---
name: meeting-notes
description: Structures raw meeting notes into a formatted summary with action items. Use this when asked to clean up meeting notes, format meeting notes, or organize notes from a meeting.
---

## Instructions

Take the raw meeting notes provided and restructure them into the following format:

### Output Format

## Meeting: [Topic]
**Date:** [date]
**Attendees:** [list]

### Summary
[2-3 sentence executive summary of the meeting]

### Key Discussion Points
- [Bullet points of major topics discussed]

### Decisions Made
- [Numbered list of decisions with brief rationale]

### Action Items
| Owner | Action | Due Date | Priority |
|-------|--------|----------|----------|
| @name | task   | date     | H/M/L    |

### Open Questions
- [Items that need follow-up or were unresolved]

### Next Meeting
[Date/time if discussed]

## Rules

- Extract action items even if they are buried in discussion text
- If an owner is not explicitly assigned, note it as "TBD"
- If no due date is mentioned, leave the field as "TBD"
- Prioritize decisions and action items over general discussion
- Keep the summary concise. The reader should understand the meeting outcome in 30 seconds.
```

#### Skill: ADR Writer (Technical Writers / Architects)

**Location:** `.github/skills/adr-writer/SKILL.md`

```markdown
---
name: adr-writer
description: Creates Architecture Decision Records (ADRs) following the team's standard template. Use this when asked to write an ADR, document an architecture decision, or create a decision record.
---

## Instructions

Create an Architecture Decision Record using the following template. Save the file as `docs/adr/NNNN-title.md` where NNNN is the next sequential number. Check existing files in `docs/adr/` to determine the next number.

### Template

# ADR-NNNN: [Title]

## Status
[Proposed | Accepted | Deprecated | Superseded by ADR-XXXX]

## Context
[What is the issue? What forces are at play? Be specific about constraints,
requirements, and the problem being solved.]

## Decision
[What is the change being proposed or decided? State it clearly in one sentence,
then elaborate.]

## Alternatives Considered
### [Alternative 1]
- **Pros:** ...
- **Cons:** ...

### [Alternative 2]
- **Pros:** ...
- **Cons:** ...

## Consequences
### Positive
- [What becomes easier?]

### Negative
- [What becomes harder? What are the tradeoffs?]

### Neutral
- [What changes that is neither good nor bad?]

## References
- [Links to relevant docs, RFCs, discussions, or prior ADRs]

## Rules

- Always check the `docs/adr/` directory for existing ADRs before choosing a number
- Status should default to "Proposed" unless told otherwise
- Include at least two alternatives. "Do nothing" counts as an alternative.
- Consequences must include at least one negative consequence. Every decision has tradeoffs. If you cannot identify one, think harder.
- Write for a reader six months from now who has no context on this decision
```

---

### Data Science / DBA Personas

These skills target people who spend their time in databases, data pipelines, and analytical workflows.

#### Skill: SQL Migration Generator (DBAs)

**Location:** `.github/skills/sql-migration/SKILL.md`

````markdown
---
name: sql-migration
description: Generates database migration files following team conventions. Use this when asked to create a migration, alter a table, add a column, create an index, or make any schema change.
---

## Instructions

Generate a database migration following these project conventions:

### File Naming
- Pattern: `migrations/YYYYMMDDHHMMSS_description.sql`
- Use the current timestamp for the filename
- Description should be snake_case and descriptive (e.g., `add_index_users_email`)

### Migration Structure
Every migration file must contain both an UP and DOWN section:

```sql
-- migrate:up
-- Description: [what this migration does]
-- Author: [GitHub handle]
-- Ticket: [ticket ID if provided]

[SQL statements here]

-- migrate:down
-- WARNING: This will [describe what rollback does]

[Rollback SQL statements here]
```

### Rules
1. **Never** use `DROP TABLE` or `DROP DATABASE` without explicit user confirmation
2. **Always** include a rollback in the down section. If a rollback is destructive (data loss), add a comment warning about it.
3. Use `IF NOT EXISTS` / `IF EXISTS` where supported by the target database
4. For adding columns, always specify a DEFAULT value or explicitly note that NULL is intentional
5. For creating indexes, use `CREATE INDEX CONCURRENTLY` on PostgreSQL to avoid table locks
6. Include a comment block at the top explaining the purpose of the migration
7. If the migration modifies data (not just schema), add a count query before and after to verify the expected number of rows were affected

### Common Patterns

**Adding a column:**
```sql
ALTER TABLE table_name ADD COLUMN column_name type DEFAULT value;
```

**Adding an index:**
```sql
CREATE INDEX CONCURRENTLY idx_table_column ON table_name (column_name);
```

**Renaming a column:**
```sql
ALTER TABLE table_name RENAME COLUMN old_name TO new_name;
```
````

**Invocation:**

```text
/sql-migration Add a composite index on users table for email and created_at
```

#### Skill: Data Pipeline Validator (Data Engineers)

**Location:** `.github/skills/pipeline-validator/SKILL.md`

```markdown
---
name: pipeline-validator
description: Validates data pipeline configurations and suggests improvements. Use this when asked to review a pipeline, validate ETL config, check a DAG, or audit data pipeline code.
---

## Instructions

Review the specified data pipeline configuration or code and check for the following:

### Validation Checklist

1. **Schema validation**
   - Are input and output schemas explicitly defined?
   - Are data types specified for all fields?
   - Are nullable fields documented?

2. **Error handling**
   - Is there a dead letter queue or error output for failed records?
   - Are retries configured with backoff?
   - Is there alerting on pipeline failure?

3. **Idempotency**
   - Can the pipeline be re-run safely without duplicating data?
   - Are there deduplication keys defined?
   - Is there a watermark or checkpoint mechanism?

4. **Performance**
   - Are partitioning keys appropriate for the data volume?
   - Are there any full table scans that could be filtered?
   - Is incremental processing used where possible?

5. **Data quality**
   - Are there null checks on required fields?
   - Are there range/format validations on critical fields?
   - Is there row count validation between source and target?

6. **Security**
   - Are credentials stored in a secret manager (not hardcoded)?
   - Is data encrypted in transit and at rest?
   - Are PII fields identified and handled appropriately?

### Output Format

For each issue found, report:
- **Severity:** Critical / Warning / Suggestion
- **Location:** File and line reference
- **Issue:** What is wrong
- **Fix:** Specific recommended change

End with a summary: total issues by severity and an overall assessment.
```

#### Skill: Jupyter Notebook Cleaner (Data Scientists)

**Location:** `~/.copilot/skills/notebook-cleaner/SKILL.md`

```markdown
---
name: notebook-cleaner
description: Cleans and standardizes Jupyter notebooks for sharing or review. Use this when asked to clean a notebook, prepare a notebook for review, or standardize notebook formatting.
---

## Instructions

Clean the specified Jupyter notebook (.ipynb file) by performing the following:

### Cleanup Steps

1. **Remove outputs** - Clear all cell outputs and execution counts. Notebooks should be committed clean.
2. **Order imports** - Ensure all import statements are in the first code cell, organized as:
   - Standard library imports
   - Third-party imports
   - Local/project imports
3. **Add section headers** - Ensure the notebook has Markdown cells with headers that follow this structure:
   - `# Title` - Notebook purpose
   - `## Setup` - Imports and configuration
   - `## Data Loading` - Where data is read
   - `## Analysis` or `## Processing` - The main work
   - `## Results` or `## Output` - Findings or outputs
   - `## Conclusions` (if applicable)
4. **Check for hardcoded paths** - Flag any absolute file paths. Suggest using relative paths or environment variables.
5. **Check for credentials** - Flag any API keys, passwords, or tokens. Suggest using environment variables or a `.env` file.
6. **Add docstrings** - Ensure any function definitions have docstrings explaining parameters and return values.
7. **Remove dead code** - Flag commented-out code blocks and empty cells.

### Output

Provide a summary of changes made and any items that need manual attention.

### Rules
- Do not modify the analytical logic or results
- Preserve all Markdown explanations
- If the notebook is too large to process in one pass, work section by section
```

---

### Developer Personas

These skills target application developers doing everyday engineering work.

#### Skill: PR Review Checklist (All Developers)

**Location:** `.github/skills/pr-review/SKILL.md`

```markdown
---
name: pr-review
description: Performs a structured code review against team standards. Use this when asked to review a PR, review code changes, do a code review, or check a pull request.
---

## Instructions

Review the code changes using the following structured checklist. Use the GitHub MCP server tools to read the PR diff and details.

### Review Checklist

#### Correctness
- [ ] Does the code do what the PR description says it does?
- [ ] Are edge cases handled?
- [ ] Are error paths handled gracefully?
- [ ] Are there any obvious bugs or logic errors?

#### Tests
- [ ] Are there tests for new functionality?
- [ ] Do existing tests still pass?
- [ ] Are edge cases tested?
- [ ] Is test coverage adequate for the change size?

#### Security
- [ ] No secrets or credentials in the diff
- [ ] User inputs are validated and sanitized
- [ ] No SQL injection vectors
- [ ] No XSS vectors in frontend code
- [ ] Dependencies added are from trusted sources

#### Performance
- [ ] No N+1 query patterns
- [ ] No unnecessary loops over large datasets
- [ ] No blocking calls in async code paths
- [ ] Database queries use appropriate indexes

#### Maintainability
- [ ] Code is readable without extensive comments
- [ ] Functions are appropriately sized
- [ ] No duplicated logic that should be extracted
- [ ] Naming is clear and consistent

### Output Format

For each item, mark it as:
- PASS - No issues
- WARN - Minor concern, non-blocking
- FAIL - Must be addressed before merge
- N/A - Not applicable to this change

End with a summary: overall recommendation (Approve / Request Changes / Comment) with rationale.
```

**Invocation:**

```text
/pr-review Review #142
```

#### Skill: Test Generator (Backend Developers)

**Location:** `.github/skills/test-generator/SKILL.md`

```markdown
---
name: test-generator
description: Generates test files with comprehensive test cases following project conventions. Use this when asked to write tests, generate tests, add test coverage, or create unit tests.
---

## Instructions

Generate tests for the specified code. Follow these rules:

### Test Structure
1. Read the source file to understand the public API
2. Determine the test framework by checking existing test files in the project:
   - JavaScript/TypeScript: look for jest.config, vitest.config, or .mocharc
   - Python: look for pytest.ini, pyproject.toml, or setup.cfg
   - Go: use the standard testing package
   - Ruby: look for .rspec or Gemfile for rspec/minitest
3. Create the test file in the corresponding test directory following existing project patterns
4. Name the test file to match the source file (e.g., `user_service.py` -> `test_user_service.py`)

### Test Cases to Generate

For each public function or method, generate:

1. **Happy path** - Normal expected input and output
2. **Edge cases** - Empty inputs, boundary values, nil/null/undefined
3. **Error cases** - Invalid inputs, expected exceptions
4. **Type variations** (where applicable) - Different valid types that the function accepts

### Rules
- One assertion per test (prefer focused, descriptive tests)
- Use descriptive test names: `test_create_user_with_duplicate_email_raises_conflict`
- Do not mock what you do not own (mock your interfaces, not third-party libraries)
- Set up test data in each test or use a shared fixture. Do not rely on test execution order.
- If the function has side effects (database, file system, network), note which tests need mocking
- Include at least one integration test suggestion as a comment at the bottom of the file
```

#### Skill: API Endpoint Scaffolder (Full-Stack Developers)

**Location:** `.github/skills/api-scaffolder/SKILL.md`

````markdown
---
name: api-scaffolder
description: Scaffolds new REST API endpoints with validation, error handling, and tests. Use this when asked to create an API endpoint, add a new route, scaffold a REST endpoint, or build a CRUD API.
---

## Instructions

Scaffold a new API endpoint by generating the following files. Detect the project's framework and language by reading existing route/controller files.

### Files to Generate

1. **Route/Controller** - The endpoint handler with:
   - Input validation (reject bad requests early)
   - Authentication check (verify the user is authenticated)
   - Authorization check (verify the user has permission)
   - Business logic call (delegate to a service layer)
   - Structured error responses with appropriate HTTP status codes
   - Request/response logging

2. **Service layer** (if the project uses one) - Business logic separated from HTTP concerns

3. **Input validation schema** - Define expected request body, query params, and path params with types and constraints

4. **Tests** - Use the /test-generator skill patterns for the generated code

5. **Route registration** - Add the route to the existing router/app configuration

### Error Response Format

All error responses must follow this structure:

```json
{
  "error": {
    "code": "DESCRIPTIVE_ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

### HTTP Status Code Guide
- 200: Success (GET, PUT, PATCH)
- 201: Created (POST that creates a resource)
- 204: No Content (DELETE)
- 400: Bad Request (validation failure)
- 401: Unauthorized (no/invalid auth)
- 403: Forbidden (valid auth, insufficient permissions)
- 404: Not Found
- 409: Conflict (duplicate resource)
- 422: Unprocessable Entity (valid syntax, semantic error)
- 500: Internal Server Error (catch-all, should be rare)

### Rules
- Never return 200 for errors
- Always validate input before processing
- Sanitize user input before database queries
- Do not expose internal error details to the client in production
- Include rate limiting considerations as a comment if the endpoint is public
````

**Invocation:**

```text
/api-scaffolder Create a POST /api/v1/users endpoint for user registration
```

#### Skill: Git Commit Message Standardizer (All Developers)

**Location:** `~/.copilot/skills/commit-message/SKILL.md`

````markdown
---
name: commit-message
description: Generates standardized commit messages from staged changes. Use this when asked to write a commit message, generate a commit message, or create a conventional commit.
---

## Instructions

Analyze the currently staged changes (use `git diff --staged`) and generate a commit message following the Conventional Commits specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, whitespace (no logic change)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `build`: Build system or dependencies
- `ci`: CI/CD changes
- `chore`: Maintenance tasks

### Rules
- Subject line: max 72 characters, imperative mood ("Add" not "Added" or "Adds"), no period at the end
- Scope: the module, component, or area affected (optional but preferred)
- Body: explain *what* and *why*, not *how*. Wrap at 80 characters.
- Footer: reference issue/ticket numbers if applicable (e.g., `Closes #123`)
- If the staged changes span multiple concerns, suggest splitting into multiple commits
- If the changes are a breaking change, add `BREAKING CHANGE:` in the footer

### Output
Provide the commit message in a code block, ready to copy. If you suggest splitting the commit, provide commands for each partial commit.
````

---

## Managing Skills in the CLI

Once you have skills in place, here are the commands you will use day-to-day:

| Command | Purpose |
|---------|---------|
| `/skills list` | List all available skills |
| `/skills` | Toggle skills on/off interactively |
| `/skills info` | View skill details and file location |
| `/skills add` | Add an alternative skills directory |
| `/skills reload` | Reload skills without restarting the CLI |
| `/skills remove SKILL-DIR` | Remove a manually added skill |
| `/my-skill-name prompt` | Invoke a skill explicitly |

Copilot also auto-invokes skills when it detects a match, so you do not always need the slash command. If your description is well-written, just describe the task naturally and Copilot will pick the right skill.

## Tips for Building Great Skills

1. **Write the description like a trigger.** Include the action verbs and keywords that someone would naturally use when asking for this task. "Use this when asked to..." is a powerful pattern.

2. **Be prescriptive in instructions.** Vague instructions produce vague results. Tell Copilot the exact steps, the exact format, and the exact constraints.

3. **Include examples in the skill.** If you want a specific output format, show Copilot what it looks like. Templates embedded in the instructions are extremely effective.

4. **Add supporting scripts.** If a workflow involves running a shell script (linting, formatting, validation), include the script in the skill directory and reference it in the instructions.

5. **Test with edge cases.** Invoke the skill with unusual inputs to see how Copilot interprets your instructions. Refine the instructions based on what breaks.

6. **Keep skills focused.** One skill, one job. If your skill is trying to do five different things, split it into five skills.

7. **Version them with your code.** Project skills in `.github/skills/` are version-controlled with your repo. Treat them like code: review changes, iterate, and improve over time.

## TL;DR

- **Skills** are on-demand Markdown playbooks that teach Copilot CLI how to handle specific tasks.
- They live in `.github/skills/` (project) or `~/.copilot/skills/` (personal).
- Each skill is a `SKILL.md` file with YAML frontmatter (`name` + `description`) and Markdown instructions.
- The `description` field is critical because it is how Copilot decides whether to auto-invoke the skill.
- Use custom instructions for always-on guidance. Use skills for specific, repeatable workflows.
- Skills are not just for developers. Project managers, technical writers, DBAs, and data scientists all have repetitive structured tasks that skills can standardize.
- Include templates, checklists, and explicit step-by-step instructions for the best results.

## Sources

- [Official docs: About agent skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills)
- [Official docs: Creating agent skills for Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-skills)
- [Official docs: Comparing CLI customization features](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/comparing-cli-features)
- [Agent Skills open standard](https://github.com/agentskills/agentskills)
- [GitHub Awesome Copilot](https://github.com/github/awesome-copilot)
- [Anthropic skills repository](https://github.com/anthropics/skills)

## Closing

*Have questions about Copilot CLI skills or want to share one you have built? Find me on [GitHub](https://github.com/jmassardo), [LinkedIn](https://www.linkedin.com/in/jenna-massardo/), or [Bluesky](https://bsky.app/profile/jmassardo.bsky.social).*
