---
layout: post
title: "Sandboxing Agentic AI CLI Tools with Docker: Run YOLO Mode Without Burning It All Down"
date: 2026-06-26 10:00:00 -0500
category: Blog
tags: [ai, copilot, cli, docker, podman, containers, devops, automation, security, developer-tools]
excerpt: "A practical guide to running agentic AI CLI tools like Copilot CLI inside containers so you can go full autopilot without risking your host system, production databases, or sanity."
---

You know the feeling. You have been using [Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/cli-getting-started) in autopilot mode and it is *incredible*. You type a prompt, lean back, and watch it refactor an entire module. Then it asks to run a shell command and your brain goes: "Wait, what if it decides to `rm -rf /` or drops my production database?"

That anxiety is the only thing standing between you and full `--yolo` mode. And honestly? It is a reasonable concern. These tools are powerful, but they are still AI. They hallucinate. They misunderstand context. Sometimes they get creative in ways you did not ask for.

Here's the fix: **put the AI in a box**. A container, specifically. Give it access to your code and nothing else. Let it go wild in an environment where the worst thing it can do is trash a disposable container.

This guide walks through setting up that sandbox for [Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/cli-getting-started), but the pattern works for any agentic AI CLI tool (Claude Code, Aider, Goose, or whatever ships next month). The principles are the same: mount your repo, pass your tokens, constrain the blast radius.

<!-- more -->

## Why Containerize Your AI Agent?

Let's be real: when you run an agentic AI tool in autopilot mode on your bare metal, it has access to *everything you do*. Your SSH keys. Your cloud credentials. Your browser sessions. Your email client. That `~/.kube/config` pointing at production. All of it. There is so much evidence on the internet of AI's going rogue and doing all kinds of weird stuff they shouldn't.

Containers give you a clean boundary:

- **Filesystem isolation** - The agent can only see and modify what you explicitly mount. Your home directory, SSH keys, and cloud configs stay untouched.
- **Process isolation** - A runaway process stays inside the container. It cannot kill your IDE, your browser, or that `docker compose` stack running your local environment.
- **Network boundaries** - You can restrict outbound access if you want, though most AI tools need HTTPS to reach their APIs.
- **Disposability** - Container goes sideways? Kill it. Your host is fine. Start fresh in seconds.

The goal here is not paranoid-level security. It is sensible defaults. Think of it like a workshop: you wear safety glasses not because you expect something to explode, but because the one time something does, you will be glad you had them on.

## What You Need

Before we get into the setup, here is what you will need:

- **Docker** (or **Podman** - we cover both)
- **A GitHub token** with appropriate scopes for Copilot CLI (or whatever credentials your AI tool needs)
- **Git** installed on your host
- **A repo** you want the agent to work on

## The Dockerfile

This is the base image. It installs the tools the agent needs and nothing more.

```dockerfile
FROM ubuntu:24.04

# Avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install essentials
RUN apt-get update && apt-get install -y \
    curl \
    git \
    sudo \
    build-essential \
    ca-certificates \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (needed by many AI CLI tools)
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
    | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update && apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

# Install Copilot CLI
RUN npm install -g @githubnext/copilot-cli

# Create a non-root user
RUN useradd -m -s /bin/bash agent \
    && echo "agent ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

USER agent
WORKDIR /home/agent/workspace

# Git config defaults - override at runtime with env vars
RUN git config --global init.defaultBranch main

# Set git identity from environment variables at container start
ENTRYPOINT ["/bin/bash", "-c", \
    "git config --global user.name \"${GIT_USER_NAME:-$(git config user.name || echo 'AI Agent')}\" && \
     git config --global user.email \"${GIT_USER_EMAIL:-$(git config user.email || echo 'agent@sandbox.local')}\" && \
     exec /bin/bash \"$@\"", "--"]
```

A few things to note:

- **Non-root user** - The agent runs as `agent`, not `root`. Sensible default.
- **Your identity, not the AI's** - Git `user.name` and `user.email` are set from `GIT_USER_NAME` and `GIT_USER_EMAIL` environment variables. The commits are *yours* - you are the one who prompted the work.
- **Minimal packages** - Only what the AI tool actually needs. No Python, no Ruby, no kitchen sink. Add what your project requires.
- **No credentials baked in** - Tokens are passed at runtime via environment variables. Never in the image.

Build it:

```bash
docker build -t ai-sandbox .
```

## Option 1: Docker Run

The simplest approach. One command, one container, one task.

```bash
docker run -it --rm \
    -e GITHUB_TOKEN="${GITHUB_TOKEN}" \
    -e GIT_USER_NAME="${GIT_USER_NAME}" \
    -e GIT_USER_EMAIL="${GIT_USER_EMAIL}" \
    -v "$(pwd):/home/agent/workspace" \
    --network=bridge \
    --memory=4g \
    --cpus=2 \
    ai-sandbox
```

Here is what each flag does:

| Flag | Purpose |
|------|---------|
| `-it` | Interactive terminal so you can see what the agent is doing |
| `--rm` | Auto-delete the container when it exits. Clean up after yourself. |
| `-e GITHUB_TOKEN` | Pass your token in without baking it into the image |
| `-e GIT_USER_NAME` / `GIT_USER_EMAIL` | Your git identity so commits are attributed to you |
| `-v "$(pwd):/home/agent/workspace"` | Mount your current directory as the workspace |
| `--network=bridge` | Default networking. The agent can reach the internet (needed for API calls). |
| `--memory=4g` | Cap memory usage so a runaway process does not eat your host |
| `--cpus=2` | Limit CPU so the agent does not peg all your cores |

Once inside the container, authenticate and run:

```bash
# Authenticate GitHub CLI (uses the token from the environment)
echo "${GITHUB_TOKEN}" | gh auth login --with-token

# Fire up Copilot CLI in autopilot mode
copilot --autopilot --yolo -p "Refactor the authentication module to use middleware pattern"
```

### Running a One-Shot Task

If you want to fire and forget (great for scripting):

```bash
docker run --rm \
    -e GITHUB_TOKEN="${GITHUB_TOKEN}" \
    -e GIT_USER_NAME="${GIT_USER_NAME}" \
    -e GIT_USER_EMAIL="${GIT_USER_EMAIL}" \
    -v "$(pwd):/home/agent/workspace" \
    --memory=4g \
    --cpus=2 \
    ai-sandbox -c '
        echo "${GITHUB_TOKEN}" | gh auth login --with-token 2>/dev/null
        copilot --autopilot --yolo --max-autopilot-continues 10 \
            -p "Run the test suite, fix any failures, and commit the fixes"
    '
```

## Option 2: Docker Compose

For a more repeatable setup, especially when you want multiple containers working on different tasks.

```yaml
# docker-compose.yml
services:
  agent:
    build:
      context: .
      dockerfile: Dockerfile
    stdin_open: true
    tty: true
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - GIT_USER_NAME=${GIT_USER_NAME}
      - GIT_USER_EMAIL=${GIT_USER_EMAIL}
    volumes:
      - ./:/home/agent/workspace
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: "2"
    networks:
      - ai-net

networks:
  ai-net:
    driver: bridge
```

Launch it:

```bash
# Interactive session
docker compose run --rm agent

# Or run a specific task
docker compose run --rm agent -c '
    echo "${GITHUB_TOKEN}" | gh auth login --with-token 2>/dev/null
    copilot --autopilot --yolo -p "Add input validation to all API endpoints"
'
```

The Compose approach shines when you want to spin up **multiple agents in parallel**, each working on a different task (we will get to that in the worktrees section).

## Option 3: Podman

If you are on a system without Docker (or you just prefer [Podman](https://podman.io/)), the commands are nearly identical. Podman is daemonless and rootless by default, which actually gives you an extra layer of isolation for free.

Build the image:

```bash
podman build -t ai-sandbox .
```

Run it:

```bash
podman run -it --rm \
    -e GITHUB_TOKEN="${GITHUB_TOKEN}" \
    -e GIT_USER_NAME="${GIT_USER_NAME}" \
    -e GIT_USER_EMAIL="${GIT_USER_EMAIL}" \
    -v "$(pwd):/home/agent/workspace:Z" \
    --memory=4g \
    --cpus=2 \
    ai-sandbox
```

The `:Z` suffix on the volume mount tells Podman to relabel the content for SELinux. If you are on a Mac or a system without SELinux, you can drop it, but it does not hurt to leave it.

One-shot mode works the same way:

```bash
podman run --rm \
    -e GITHUB_TOKEN="${GITHUB_TOKEN}" \
    -e GIT_USER_NAME="${GIT_USER_NAME}" \
    -e GIT_USER_EMAIL="${GIT_USER_EMAIL}" \
    -v "$(pwd):/home/agent/workspace:Z" \
    --memory=4g \
    --cpus=2 \
    ai-sandbox -c '
        echo "${GITHUB_TOKEN}" | gh auth login --with-token 2>/dev/null
        copilot --autopilot --yolo -p "Write unit tests for the user service module"
    '
```

### Quick Podman vs Docker Reference

| Feature | Docker | Podman |
|---------|--------|--------|
| Daemon required | Yes | No |
| Rootless by default | No (needs config) | Yes |
| Docker Compose | Native | Via `podman-compose` or `podman compose` |
| SELinux volume labels | Manual | `:Z` flag |
| Command compatibility | - | Drop-in replacement for most commands |

## VS Code Dev Containers (Bonus)

If you live in VS Code, [dev containers](https://containers.dev/) wrap all of this into a seamless experience. Add a `.devcontainer/devcontainer.json` to your repo:

```json
{
    "name": "AI Agent Sandbox",
    "build": {
        "dockerfile": "../Dockerfile"
    },
    "remoteUser": "agent",
    "containerEnv": {
        "GITHUB_TOKEN": "${localEnv:GITHUB_TOKEN}",
        "GIT_USER_NAME": "${localEnv:GIT_USER_NAME}",
        "GIT_USER_EMAIL": "${localEnv:GIT_USER_EMAIL}"
    },
    "mounts": [],
    "runArgs": [
        "--memory=4g",
        "--cpus=2"
    ],
    "postStartCommand": "echo ${GITHUB_TOKEN} | gh auth login --with-token 2>/dev/null || true",
    "customizations": {
        "vscode": {
            "extensions": [
                "github.copilot",
                "github.copilot-chat"
            ]
        }
    }
}
```

Open the repo in VS Code, hit **Reopen in Container**, and you are sandboxed. The terminal inside VS Code is now running inside the container. Your host system is protected.

This is great for teams. Commit the `.devcontainer` config to your repo and everyone gets the same sandboxed environment.

**But not everyone uses VS Code.** The `docker run`, Compose, and Podman examples above work with any editor, any terminal, any workflow. That is the whole point.

## Passing Secrets Safely

Here is the thing: agentic AI tools need credentials. Copilot CLI needs a GitHub token. Claude Code needs an API key. There is no way around it. But there are right ways and wrong ways to handle this.

**Do this:**

```bash
# Export your credentials in your shell session (or use a .env file with Compose)
export GITHUB_TOKEN="ghp_your_token_here"
export GIT_USER_NAME="Your Name"
export GIT_USER_EMAIL="you@example.com"

# Pass them as environment variables at runtime
docker run -e GITHUB_TOKEN="${GITHUB_TOKEN}" \
    -e GIT_USER_NAME="${GIT_USER_NAME}" \
    -e GIT_USER_EMAIL="${GIT_USER_EMAIL}" ...
```

**Never do this:**

```dockerfile
# DO NOT put tokens in your Dockerfile
ENV GITHUB_TOKEN=ghp_your_actual_token
```

```bash
# DO NOT pass tokens as build args
docker build --build-arg GITHUB_TOKEN=ghp_your_actual_token .
```

### Using a `.env` File with Compose

For Docker Compose, keep your secrets in a `.env` file:

```bash
# .env (add this to .gitignore!)
GITHUB_TOKEN=ghp_your_token_here
GIT_USER_NAME=Your Name
GIT_USER_EMAIL=you@example.com
```

Compose automatically picks up `.env` in the same directory. Clean and simple.

### Token Scope

Give the token the **minimum permissions** the tool needs. For Copilot CLI, that typically means:

- `repo` - read/write access to repositories
- `read:org` - read org membership (if using org features)
- `copilot` - Copilot access

Do not hand the agent a token with `admin:org` or `delete_repo` permissions. That is asking for trouble.

## Network Isolation: How Much Is Enough?

Most agentic AI tools need outbound HTTPS to function. Copilot CLI talks to GitHub's API. Claude Code talks to Anthropic's API. Cutting off the network entirely means the tool cannot work.

That said, you can restrict things if you want:

### Default (Recommended): Bridge Networking

```bash
docker run --network=bridge ...
```

The container can reach the internet but cannot access your host's localhost services (databases, other containers, etc.) without explicit port mapping. This is the sensible default.

### Restricted: Block Host Network Access

If you want to prevent the agent from hitting services on your host machine:

```bash
docker run --network=bridge --add-host=host.docker.internal:127.0.0.1 ...
```

This redirects any attempts to reach `host.docker.internal` back to the container itself, effectively blocking access to host services.

### Paranoid: Custom Network with DNS Filtering

If you really want to lock things down:

```bash
# Create an isolated network
docker network create --internal ai-isolated

# Run with only specific outbound access
docker run --network=ai-isolated ...
```

The `--internal` flag blocks all outbound traffic. The agent cannot reach *anything* outside. This breaks most AI tools, so you would need to set up a proxy or allowlist specific domains. This is overkill for most use cases, but it exists if you need it.

**The bottom line:** Bridge networking is fine for 99% of use cases. The container already cannot see your filesystem, your processes, or your other containers. That is the isolation that matters most.

## Scaling with Git Worktrees

Here is where things get fun. You want to run multiple agents in parallel, each working on a different task, all against the same repo. If you just mount the same directory into multiple containers, you are going to have a bad time (merge conflicts, file locks, general chaos).

Enter [git worktrees](https://git-scm.com/docs/git-worktree).

### The TLDR on Worktrees

A git worktree lets you check out multiple branches of the same repository into separate directories **without cloning the repo multiple times**. They all share the same `.git` history, but each has its own working directory and branch.

```bash
# From your main repo directory
git worktree add ../my-repo-feature-auth feature/auth
git worktree add ../my-repo-fix-tests fix/tests
git worktree add ../my-repo-refactor-api refactor/api
```

This creates three directories, each on a different branch, all sharing the same git objects. Fast, lightweight, and no duplicate downloads.

### Why Worktrees for AI Agents?

Each container gets its own worktree. Each worktree is on its own branch. The agents can work simultaneously without stepping on each other.

```
my-repo/                          # Main working tree (your branch)
├── .git/                         # Shared git data
my-repo-feature-auth/             # Worktree 1 → container 1
my-repo-fix-tests/                # Worktree 2 → container 2
my-repo-refactor-api/             # Worktree 3 → container 3
```

### Spinning Up Parallel Agents

Create the worktrees, then launch a container per task:

```bash
# Create worktrees for each task
git worktree add ../project-task-1 -b agent/add-validation
git worktree add ../project-task-2 -b agent/write-tests
git worktree add ../project-task-3 -b agent/update-docs

# Launch an agent per worktree
docker run -d --rm \
    -e GITHUB_TOKEN="${GITHUB_TOKEN}" \
    -e GIT_USER_NAME="${GIT_USER_NAME}" \
    -e GIT_USER_EMAIL="${GIT_USER_EMAIL}" \
    -v "$(realpath ../project-task-1):/home/agent/workspace" \
    --memory=4g --cpus=2 \
    ai-sandbox -c '
        echo "${GITHUB_TOKEN}" | gh auth login --with-token 2>/dev/null
        copilot --autopilot --yolo -p "Add input validation to all POST endpoints"
    '

docker run -d --rm \
    -e GITHUB_TOKEN="${GITHUB_TOKEN}" \
    -e GIT_USER_NAME="${GIT_USER_NAME}" \
    -e GIT_USER_EMAIL="${GIT_USER_EMAIL}" \
    -v "$(realpath ../project-task-2):/home/agent/workspace" \
    --memory=4g --cpus=2 \
    ai-sandbox -c '
        echo "${GITHUB_TOKEN}" | gh auth login --with-token 2>/dev/null
        copilot --autopilot --yolo -p "Write unit tests for the user and auth modules"
    '

docker run -d --rm \
    -e GITHUB_TOKEN="${GITHUB_TOKEN}" \
    -e GIT_USER_NAME="${GIT_USER_NAME}" \
    -e GIT_USER_EMAIL="${GIT_USER_EMAIL}" \
    -v "$(realpath ../project-task-3):/home/agent/workspace" \
    --memory=4g --cpus=2 \
    ai-sandbox -c '
        echo "${GITHUB_TOKEN}" | gh auth login --with-token 2>/dev/null
        copilot --autopilot --yolo -p "Update the README and add JSDoc comments to all exported functions"
    '
```

Three agents, three branches, zero conflicts. Each one works in total isolation.

### Merging the Work Back Together

Once the agents finish:

```bash
# Review what each agent did
cd ../project-task-1 && git log --oneline -5
cd ../project-task-2 && git log --oneline -5
cd ../project-task-3 && git log --oneline -5

# Back to your main working tree
cd ../my-repo

# Merge each branch (or open PRs - your call)
git merge agent/add-validation
git merge agent/write-tests
git merge agent/update-docs

# Clean up the worktrees
git worktree remove ../project-task-1
git worktree remove ../project-task-2
git worktree remove ../project-task-3
```

You can also push each branch and open PRs if you want code review before merging. That is probably the safer play for anything non-trivial.

### Docker Compose for Parallel Agents

Here is a Compose file that spins up three agents at once:

```yaml
# docker-compose.parallel.yml
services:
  agent-validation:
    build: .
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - GIT_USER_NAME=${GIT_USER_NAME}
      - GIT_USER_EMAIL=${GIT_USER_EMAIL}
    volumes:
      - ../project-task-1:/home/agent/workspace
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: "2"
    command: >
      -c 'echo "${GITHUB_TOKEN}" | gh auth login --with-token 2>/dev/null &&
      copilot --autopilot --yolo -p "Add input validation to all POST endpoints"'

  agent-tests:
    build: .
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - GIT_USER_NAME=${GIT_USER_NAME}
      - GIT_USER_EMAIL=${GIT_USER_EMAIL}
    volumes:
      - ../project-task-2:/home/agent/workspace
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: "2"
    command: >
      -c 'echo "${GITHUB_TOKEN}" | gh auth login --with-token 2>/dev/null &&
      copilot --autopilot --yolo -p "Write unit tests for the user and auth modules"'

  agent-docs:
    build: .
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - GIT_USER_NAME=${GIT_USER_NAME}
      - GIT_USER_EMAIL=${GIT_USER_EMAIL}
    volumes:
      - ../project-task-3:/home/agent/workspace
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: "2"
    command: >
      -c 'echo "${GITHUB_TOKEN}" | gh auth login --with-token 2>/dev/null &&
      copilot --autopilot --yolo -p "Update the README and add JSDoc comments to all exported functions"'
```

Launch all three:

```bash
docker compose -f docker-compose.parallel.yml up
```

Watch the logs, grab a coffee, and come back to three branches of completed work.

## Quick Reference: The Complete Pattern

Here is your cheat sheet for the full workflow:

```bash
# 1. Build the sandbox image (one-time)
docker build -t ai-sandbox .

# 2. Export your credentials
export GITHUB_TOKEN="ghp_your_token_here"
export GIT_USER_NAME="Your Name"
export GIT_USER_EMAIL="you@example.com"

# 3. Navigate to your repo
cd ~/code/my-project

# 4. Create worktrees for parallel tasks
git worktree add ../my-project-task-1 -b agent/task-1
git worktree add ../my-project-task-2 -b agent/task-2

# 5. Launch sandboxed agents
docker run -d --rm \
    -e GITHUB_TOKEN="${GITHUB_TOKEN}" \
    -e GIT_USER_NAME="${GIT_USER_NAME}" \
    -e GIT_USER_EMAIL="${GIT_USER_EMAIL}" \
    -v "$(realpath ../my-project-task-1):/home/agent/workspace" \
    --memory=4g --cpus=2 \
    ai-sandbox -c '
        echo "${GITHUB_TOKEN}" | gh auth login --with-token 2>/dev/null
        copilot --autopilot --yolo -p "Your task description here"
    '

# 6. When done, review and merge
cd ~/code/my-project
git merge agent/task-1
git merge agent/task-2

# 7. Clean up
git worktree remove ../my-project-task-1
git worktree remove ../my-project-task-2
```

## Summary and Key Takeaways

Running agentic AI tools in autopilot mode is a productivity multiplier, but doing it on bare metal is a gamble you do not need to take. Containers give you the isolation to go full `--yolo` with confidence.

**Here is your action plan:**

- **Build a base sandbox image** with the AI tool and minimal dependencies. Keep it lean.
- **Never bake credentials into images.** Pass tokens via environment variables at runtime.
- **Use bridge networking** as your default. It is enough isolation for most workflows.
- **Mount only the repo directory.** The agent does not need access to your home folder, SSH keys, or cloud configs.
- **Set resource limits** (memory and CPU) so a runaway process cannot tank your machine.
- **Use git worktrees** to run multiple agents in parallel without conflicts.
- **Clean up after yourself.** Use `--rm` on containers and remove worktrees when you are done.

The pattern is simple: **mount, constrain, execute, merge**. Whether you are using Copilot CLI, Claude Code, Aider, or whatever ships next, the sandbox approach keeps your host safe while letting the AI do its thing.

Now go run `--yolo` mode. You have earned it.
