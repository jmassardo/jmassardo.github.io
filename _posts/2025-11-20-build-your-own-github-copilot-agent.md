---
layout: post
title: "Build Your Own GitHub Copilot Agent: From Zero to Hero"
date: 2025-11-20 10:00:00 -0500
category: Blog
tags: [github, copilot, ai, automation, developer-tools, agents]
excerpt: "Learn how to create custom GitHub Copilot agents from scratch. This practical guide walks you through everything from understanding the differences between prompts, instructions, and agents to building your first custom agent."
---

## Introduction

GitHub Copilot has evolved far beyond simple code completions. With custom agents, you can create specialized AI assistants tailored to your specific workflows, coding standards, and team practices. Whether you want an agent that enforces your company's security policies, helps with specific framework patterns, or automates repetitive documentation tasks, custom agents give you that power.

In this guide, I'll walk you through everything you need to know to create your own custom GitHub Copilot agent from scratch. No guessing, no half-measures—just a complete, practical walkthrough.

## Understanding Your Options: Prompts vs Instructions vs Chat Modes vs Agents

Before diving into agent creation, let's clarify when to use each customization option. Here's a quick reference:

| Feature | What It Is | When to Use It | Scope | Complexity |
|---------|-----------|----------------|-------|------------|
| **Prompts** | Direct questions or commands in chat | One-off requests, quick clarifications | Single conversation | Low |
| **Instructions** | Global or workspace-level rules applied to all Copilot interactions | Setting coding standards, preferences that apply to everything | All conversations in workspace/globally | Low |
| **Chat Modes** | Pre-configured conversation contexts (e.g., `/explain`, `/fix`) | Switching between different interaction styles | Single conversation session | Medium |
| **Custom Agents** | Specialized AI assistants with specific roles and capabilities | Complex workflows, domain-specific tasks, role-based interactions | Activated per conversation | High |

**The Bottom Line:** Use prompts for quick questions, instructions for universal rules, chat modes for different interaction styles, and agents when you need a specialized assistant with a specific role and deep context.

## What Are Custom Agents?

Custom agents are specialized instances of GitHub Copilot that you configure with specific:
- **Roles and personas** (e.g., "security reviewer", "API documentation expert")
- **Instructions and guidelines** (e.g., "always check for SQL injection vulnerabilities")
- **Allowed tools and capabilities** (e.g., which files they can access, what actions they can perform)
- **Context and knowledge** (e.g., your team's coding standards, framework-specific patterns)

Think of agents as hiring a specialist consultant for your codebase—except this one never takes coffee breaks.

## Prerequisites

Before creating your first agent, ensure you have:
- GitHub Copilot subscription (Individual, Business, or Enterprise)
- VS Code with the GitHub Copilot extension installed and updated
- A project or repository where you want to use the agent
- Basic familiarity with Markdown and YAML syntax

## Creating Your First Custom Agent

### Step 1: Create the Agent Directory Structure

Custom agents live in your repository's `.github` directory. Create the following structure:

```bash
mkdir -p .github/agents
```

Your repository structure should now include:
```
your-repo/
├── .github/
│   └── agents/
├── src/
└── ...
```

### Step 2: Create Your Agent File

Agent files use the `.agent.md` extension and contain both configuration and instructions. Let's create a security-focused agent as an example:

```bash
touch .github/agents/SecurityReviewer.agent.md
```

### Step 3: Define Your Agent Configuration

Open the agent file and start with the YAML front matter. This defines your agent's metadata and behavior:

```markdown
---
name: security-reviewer
description: Security-focused code reviewer that checks for common vulnerabilities
version: 1.0.0
applyTo: 
  - '**/*.js'
  - '**/*.ts'
  - '**/*.py'
tools:
  - read_file
  - search_files
  - list_directory
---
```

**Configuration Breakdown:**
- `name`: Unique identifier for your agent (lowercase with hyphens)
- `description`: What your agent does (shown in the agent picker)
- `version`: Semantic versioning for tracking changes
- `applyTo`: File patterns where this agent is most relevant (glob patterns)
- `tools`: Which capabilities the agent can use

### Step 4: Write Your Agent Instructions

After the front matter, add the agent's personality and instructions in Markdown:

```markdown
# Security Code Reviewer

You are an expert security engineer reviewing code for vulnerabilities. Your goal is to identify security issues and provide actionable remediation guidance.

## Core Responsibilities

- Identify common vulnerabilities (OWASP Top 10)
- Check for input validation and sanitization
- Review authentication and authorization logic
- Detect potential injection vulnerabilities (SQL, XSS, command injection)
- Flag insecure cryptographic practices
- Identify exposure of sensitive data

## Review Approach

When reviewing code:

1. **Start with high-risk areas**: Authentication, data access, user input handling
2. **Be specific**: Point to exact lines and explain the vulnerability
3. **Provide fixes**: Don't just identify problems—suggest secure alternatives
4. **Consider context**: Not every finding is critical; prioritize based on risk
5. **Reference standards**: Cite OWASP, CWE, or other security standards when relevant

## Communication Style

- Be direct but constructive
- Use severity levels: CRITICAL, HIGH, MEDIUM, LOW, INFO
- Provide code examples for fixes
- Link to relevant documentation when helpful

## Example Output Format

```
🔴 CRITICAL: SQL Injection Vulnerability
Line 42: User input directly concatenated into SQL query
Risk: Attackers can execute arbitrary SQL commands
Fix: Use parameterized queries or an ORM
```

## Limitations

You are not a replacement for:
- Comprehensive security testing (SAST/DAST)
- Penetration testing
- Formal security audits
- Compliance certifications

Focus on common, preventable vulnerabilities during development.
```

### Step 5: Complete Agent File Example

Here's the complete `SecurityReviewer.agent.md`:

```markdown
---
name: security-reviewer
description: Security-focused code reviewer that checks for common vulnerabilities
version: 1.0.0
applyTo: 
  - '**/*.js'
  - '**/*.ts'
  - '**/*.py'
  - '**/*.java'
  - '**/*.cs'
tools:
  - read_file
  - search_files
  - list_directory
---

# Security Code Reviewer

You are an expert security engineer reviewing code for vulnerabilities. Your goal is to identify security issues and provide actionable remediation guidance.

## Core Responsibilities

- Identify common vulnerabilities (OWASP Top 10)
- Check for input validation and sanitization
- Review authentication and authorization logic
- Detect potential injection vulnerabilities (SQL, XSS, command injection)
- Flag insecure cryptographic practices
- Identify exposure of sensitive data

## Review Approach

When reviewing code:

1. **Start with high-risk areas**: Authentication, data access, user input handling
2. **Be specific**: Point to exact lines and explain the vulnerability
3. **Provide fixes**: Don't just identify problems—suggest secure alternatives
4. **Consider context**: Not every finding is critical; prioritize based on risk
5. **Reference standards**: Cite OWASP, CWE, or other security standards when relevant

## Communication Style

- Be direct but constructive
- Use severity levels: CRITICAL, HIGH, MEDIUM, LOW, INFO
- Provide code examples for fixes
- Link to relevant documentation when helpful

## Example Output Format

When identifying issues, use this format:
```
🔴 CRITICAL: SQL Injection Vulnerability
Line 42: User input directly concatenated into SQL query
Risk: Attackers can execute arbitrary SQL commands
Fix: Use parameterized queries or an ORM

// Bad
query = "SELECT * FROM users WHERE id = " + userId;

// Good
query = "SELECT * FROM users WHERE id = ?";
stmt = connection.prepareStatement(query);
stmt.setString(1, userId);
```

## Limitations

You are not a replacement for:
- Comprehensive security testing (SAST/DAST)
- Penetration testing
- Formal security audits
- Compliance certifications

Focus on common, preventable vulnerabilities during development.
```

## Using Your Custom Agent

### Activating the Agent

Once you've created your agent file:

1. **Commit and push** the `.github/agents/` directory to your repository
2. **Restart VS Code** (or reload the window with `Cmd+Shift+P` → "Reload Window")
3. **Open Copilot Chat** and look for your agent in the agent picker (the icon next to the chat input)
4. **Select your agent** to activate it for the conversation

### Interacting with Your Agent

With your security reviewer agent active, you can ask questions like:

- "Review this authentication function for security issues"
- "Check this API endpoint for vulnerabilities"
- "Is this password hashing implementation secure?"
- "Scan this file for OWASP Top 10 vulnerabilities"

The agent will respond according to its instructions, focusing on security concerns.

## Agent Configuration Options

### Available Tools

You can grant agents access to various tools:

| Tool | Purpose | Use Case |
|------|---------|----------|
| `read_file` | Read file contents | Code review, analysis |
| `write_file` | Modify files | Automated fixes, refactoring |
| `search_files` | Search across codebase | Finding patterns, similar code |
| `list_directory` | Browse directory structure | Understanding project layout |
| `run_terminal` | Execute commands | Running tests, builds |

**Security Note:** Be thoughtful about which tools you enable. An agent with `write_file` and `run_terminal` has significant power.

### File Pattern Matching

The `applyTo` field uses glob patterns:

```yaml
applyTo:
  - '**/*.js'           # All JavaScript files
  - 'src/**/*.ts'       # TypeScript files in src
  - '**/test/**'        # All files in test directories
  - '!**/node_modules/**'  # Exclude node_modules
```

### Scoping Options

You can also scope agents to specific contexts:

```yaml
applyTo:
  - '**'               # All files
  fileTypes:
    - javascript
    - typescript
  directories:
    - src/api
    - src/auth
```

## Advanced Agent Patterns

### Multi-Role Agent

Create an agent that can switch between roles:

```markdown
---
name: full-stack-reviewer
description: Reviews both frontend and backend code with appropriate expertise
version: 1.0.0
---

# Full-Stack Code Reviewer

You are a senior full-stack engineer reviewing code across the entire application stack.

## Role Switching

Automatically detect the type of code being reviewed:

- **Frontend** (React, Vue, HTML/CSS): Focus on UX, accessibility, performance
- **Backend** (APIs, databases): Focus on scalability, security, data integrity
- **Infrastructure** (Docker, K8s, CI/CD): Focus on reliability, deployment practices

Adapt your review style and priorities based on the context.
```

### Documentation Agent

An agent specialized in writing and maintaining docs:

```markdown
---
name: documentation-writer
description: Creates and updates technical documentation
version: 1.0.0
applyTo:
  - '**/*.md'
  - '**/README.md'
tools:
  - read_file
  - write_file
  - search_files
---

# Technical Documentation Specialist

You are a technical writer who creates clear, comprehensive documentation.

## Documentation Standards

- Use clear, concise language
- Include code examples for all concepts
- Structure with proper headings and sections
- Add links to related documentation
- Include troubleshooting sections
- Keep a friendly but professional tone

## Types of Documentation

- **README files**: Project overview, setup, usage
- **API docs**: Endpoints, parameters, responses, examples
- **How-to guides**: Step-by-step instructions
- **Architecture docs**: System design, diagrams, decisions
```

## Best Practices

### 1. Be Specific in Instructions

**Bad:**
```markdown
You are a helpful coding assistant.
```

**Good:**
```markdown
You are a Python backend engineer specializing in Django REST Framework. 
Focus on API design, serializers, viewsets, and Django best practices. 
Always suggest using class-based views and proper pagination.
```

### 2. Define Clear Boundaries

Tell your agent what it should NOT do:

```markdown
## Out of Scope

- Do not suggest rewriting entire modules without specific issues
- Do not make breaking changes without explicit confirmation
- Do not modify configuration files without review
```

### 3. Provide Examples

Show your agent what good output looks like:

```markdown
## Example Review

When finding an issue, format like this:

**Issue**: Missing error handling
**Location**: `api/users.py`, line 42
**Impact**: Application will crash on database connection failure
**Fix**: 
```python
try:
    user = User.objects.get(id=user_id)
except User.DoesNotExist:
    return Response({"error": "User not found"}, status=404)
except DatabaseError as e:
    logger.error(f"Database error: {e}")
    return Response({"error": "Service unavailable"}, status=503)
```
```

### 4. Version Your Agents

As you refine your agents, increment the version number and document changes:

```yaml
version: 1.2.0
# Changelog:
# 1.2.0 - Added TypeScript support, improved error messages
# 1.1.0 - Added automated fix suggestions
# 1.0.0 - Initial release
```

### 5. Test Your Agents

Before deploying agents to your team:

1. Test with various file types in your codebase
2. Try edge cases and unusual requests
3. Verify the agent stays within its defined scope
4. Check that tool permissions are appropriate
5. Ensure output format is consistent and helpful

## Common Use Cases

### API Documentation Generator

```yaml
---
name: api-doc-generator
description: Generates OpenAPI/Swagger documentation from code
applyTo: ['**/routes/**', '**/controllers/**']
tools: [read_file, write_file, search_files]
---
```

### Test Generator

```yaml
---
name: test-writer
description: Creates unit and integration tests following project conventions
applyTo: ['**/test/**', '**/*.test.*', '**/*.spec.*']
tools: [read_file, write_file, search_files]
---
```

### Refactoring Assistant

```yaml
---
name: refactor-helper
description: Identifies code smells and suggests refactoring opportunities
applyTo: ['src/**']
tools: [read_file, search_files, list_directory]
---
```

### Compliance Checker

```yaml
---
name: compliance-checker
description: Ensures code meets regulatory requirements (GDPR, HIPAA, etc.)
applyTo: ['**']
tools: [read_file, search_files]
---
```

## Troubleshooting

### Agent Not Appearing

- **Check file location**: Must be in `.github/agents/`
- **Check file extension**: Must be `.agent.md`
- **Restart VS Code**: Agent definitions are loaded at startup
- **Check YAML syntax**: Invalid front matter will cause loading to fail

### Agent Not Behaving as Expected

- **Review instructions**: Be more specific about desired behavior
- **Check tool permissions**: Agent might need additional tools
- **Test file patterns**: Ensure `applyTo` matches your files
- **Simplify instructions**: Start with core functionality, add complexity gradually

### Agent Responses Too Generic

- **Add more context**: Include examples, patterns, and specific guidelines
- **Define communication style**: Specify tone, format, and level of detail
- **Provide reference material**: Link to docs, standards, or examples
- **Narrow the scope**: Focused agents perform better than generalists

## Security Considerations

### Tool Permissions

Be cautious with these tool combinations:
- `write_file` + `run_terminal`: Can modify and execute code
- `search_files` + broad `applyTo`: Can access sensitive data
- `run_terminal`: Can execute arbitrary commands

### Sensitive Information

Agents have access to:
- Code in your repository
- Files matching `applyTo` patterns
- Previous conversation context
- Any tools you grant them

**Never include** in agent instructions:
- API keys or credentials
- Private business logic details that shouldn't be logged
- Personally identifiable information (PII)

### Access Control

Consider creating different agents for:
- **Junior developers**: Restricted tools, more guidance
- **Senior developers**: Full tool access, advanced features
- **External contributors**: Limited file access, focused scope

## Summary and Key Takeaways

You now have everything you need to create custom GitHub Copilot agents. Here's your action plan:

### Quick Start Checklist

- [ ] Create `.github/agents/` directory in your repository
- [ ] Write your first agent file with YAML front matter and instructions
- [ ] Define agent role, responsibilities, and communication style
- [ ] Set appropriate tool permissions and file patterns
- [ ] Commit, push, and restart VS Code
- [ ] Test your agent with real scenarios
- [ ] Iterate and refine based on results

### Key Takeaways

1. **Agents are specialists**: Create focused agents for specific tasks rather than generalists
2. **Instructions matter**: Clear, detailed instructions produce better results
3. **Start simple**: Begin with basic functionality and expand as needed
4. **Tool permissions are powerful**: Grant only what's necessary
5. **Test thoroughly**: Validate behavior before rolling out to your team
6. **Version and iterate**: Agents improve with feedback and refinement

### Next Steps

- Create an agent tailored to your team's specific needs
- Share agents across your organization via shared repositories
- Combine agents with GitHub Copilot instructions for maximum impact
- Monitor agent usage and gather team feedback
- Explore the [GitHub Copilot documentation](https://docs.github.com/en/copilot) for advanced features

Now go build something awesome. Your custom AI coding assistant awaits! 🚀

---

*Have questions or want to share your custom agents? Find me on [GitHub](https://github.com/jmassardo) or check out more DevOps and automation content on [my blog](https://www.dxrf.com/blog).*
