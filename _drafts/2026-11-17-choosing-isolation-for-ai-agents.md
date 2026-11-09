---
layout: post
title: "Built-In Sandboxes vs. Containers: Choosing Isolation for AI Agents"
date: 2026-11-17 10:00:00 -0600
category: Blog
tags: [ai, security, copilot, cli, containers, devops, developer-tools]
excerpt: "Native sandboxes are real isolation, not just approval prompts. Learn when they are enough, when a container adds value, and how to verify the boundary."
---

Your coding agent has a built-in sandbox. Do you still need to put it in Docker?

Sometimes. But "always use a container" is no more useful than "the tool says sandbox, so we're good."

Modern agents can use operating-system controls to restrict filesystem and network access without a container. That is a meaningful security boundary, not a confirmation dialog wearing a hard hat.

Containers still have a place: disposable development environments, consistent dependencies, resource limits, and enclosing the local agent process and its helpers. The question is whether those benefits address your actual risk.

**Start with the boundary you need, then choose the mechanism.** Don't collect isolation layers like conference stickers.

**Documentation checked November 4, 2026.** Defaults and platform support change. The examples below are configuration guidance, not evidence that these exact environments have been built and tested.

<!-- more -->

## Permission Prompts and Sandboxes Do Different Jobs

A permission policy decides whether an action may proceed and whether it needs approval.

A sandbox restricts what the action can access once it runs.

You can have either without the other. Approving a command doesn't make it contained. Running a command without a prompt doesn't necessarily mean it is unsandboxed.

Keep three questions separate:

1. **Approval:** Who authorizes the action?
2. **Isolation:** Which files, processes, and networks can it reach?
3. **Credentials:** What can it do to a remote system it can reach?

A local sandbox can prevent a write outside your workspace while an authorized API call deletes a remote resource. The filesystem boundary didn't fail. It wasn't the control for that operation.

## Built-In Sandboxing Is a Good Starting Point

For routine work in a trusted project, native sandboxing is often the lowest-friction place to start. Configure it deliberately, verify what it covers, and retain appropriate approvals.

Don't assume the presence of a feature means it is enabled. Don't assume every tool with the same feature name enforces the same policy.

### GitHub Copilot CLI

[Copilot's local sandbox](https://docs.github.com/en/copilot/concepts/security-governance-and-network-settings/about-cloud-and-local-sandboxes) uses OS-level isolation through Microsoft eXecution Container. Enable it from a CLI session:

```text
/sandbox enable
```

Use `/sandbox` to inspect filesystem, network, credential, and bypass settings. Local sandboxing is off by default unless managed settings require it.

The coverage distinction matters. Shell commands and file search run inside the sandbox, as do local MCP and language servers by default. Remote MCP servers are not placed inside that local boundary.

Copilot's built-in file tools run in the CLI process, which is not itself OS-sandboxed. Those tools check the configured sandbox policy on a best-effort basis rather than having every file operation enforced by the subprocess sandbox.

Credential controls can mask secrets from subprocesses and proxy authentication to approved destinations. That can be more protective than simply putting a real token in a container environment variable.

Review the [configuration documentation](https://docs.github.com/en/copilot/how-tos/cloud-and-local-sandboxes/configuring-local-sandbox-settings), especially bypass permissions and platform-specific network enforcement. If isolation is mandatory, verify the documented fail-closed settings rather than relying on a saved preference.

### Claude Code

[Claude Code's built-in sandbox](https://code.claude.com/docs/en/sandboxing) applies OS-level restrictions to shell commands and their children. Configure it with:

```text
/sandbox
```

Its file tools, hooks, and MCP servers run outside that shell sandbox and follow their respective permission and execution rules.

Also inspect read access, not just writes. The documented shell-sandbox defaults allow reads across much of the host, including credential locations, unless you configure additional restrictions. Environment variables are another credential path.

Anthropic also documents a [whole-process sandbox runtime](https://code.claude.com/docs/en/sandbox-environments) that can enclose Claude Code and its local helpers **without Docker**. That is an important option when you need broader coverage but not a containerized development environment.

### Codex CLI

[Codex documents separate sandbox modes and approval policies](https://learn.chatgpt.com/codex/agent-approvals-security). Its local defaults restrict writes to the workspace and disable network access.

For example:

```bash
codex --sandbox workspace-write --ask-for-approval on-request
```

That is a Codex-specific configuration, not a portable flag combination for every agent. Workspace-write also isn't a promise that all reads outside the workspace are denied.

Across tools, check the installed version, host support, effective configuration, and behavior when a restriction cannot be enforced.

## When Does a Container Add Value?

A container is useful when you want to run the local agent and its supporting tools inside a deliberately constructed environment.

That might mean:

- The same compiler, package manager, and dependencies for every task.
- A disposable checkout without mounting your everyday home directory.
- CPU, memory, and process limits.
- A common outer boundary across several agent products.
- Local hooks and helpers inside that boundary, provided they actually run there.

These are operational benefits as well as security benefits. "It works in the agent's environment" becomes less mysterious when you can rebuild that environment.

The costs are real too: image maintenance, mount ownership, authentication, network setup, and potentially awkward nested sandboxing.

This is not a universal ladder where Docker is automatically stronger than every native sandbox. A restrictive native network policy can block access that an ordinary Docker bridge permits. A credential proxy can expose less than a token passed into a container.

Choose the combination that enforces the policy you need.

| Need | Reasonable starting point |
|---|---|
| Routine work in a trusted local project | Native sandbox with explicit permissions and credential policy |
| Broader local tool coverage without packaging a full environment | Supported whole-process sandbox runtime |
| Repeatable tooling, disposable checkouts, and resource limits | Hardened container, with separate egress and credential controls |
| Deliberately hostile code or a stronger OS boundary | Dedicated VM or appropriately isolated managed environment |

A dev container can standardize tooling, but its label doesn't establish its security posture. Inspect workspace mounts, credential forwarding, extensions, and Docker socket access.

## One Focused Docker Pattern

Here is a minimal **Copilot CLI** example for a trusted project's disposable task checkout. It is not a hostile-code execution service or a universal image for every agent.

The image installs Git and Copilot, runs as a non-root user, and does not contain credentials. Add project dependencies deliberately.

```dockerfile
FROM node:22-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ARG COPILOT_VERSION
RUN test -n "$COPILOT_VERSION" \
    && npm install --global "@github/copilot@${COPILOT_VERSION}" \
    && npm cache clean --force

USER node
RUN mkdir -p /home/node/workspace
WORKDIR /home/node/workspace

ENTRYPOINT ["copilot"]
```

Set `COPILOT_VERSION` to a version you have reviewed before building. For a maintained team image, also pin the reviewed base-image digest and establish an update process. Pinning forever is not patch management.

Run these commands from the trusted repository's root, with the Dockerfile above:

```bash
: "${COPILOT_VERSION:?Set the reviewed Copilot CLI version first}"

docker build \
    --build-arg COPILOT_VERSION="$COPILOT_VERSION" \
    -t agent-task - < Dockerfile

git clone --no-local . ../my-project-agent-task
git -C ../my-project-agent-task switch -c agent/bounded-task
git -C ../my-project-agent-task remote remove origin
```

This build uses an [empty filesystem context](https://docs.docker.com/build/concepts/context/#empty-context), so the repository is not sent to the builder. The independent clone starts from committed source; it does not copy uncommitted changes. Inspect it for tracked secrets and sensitive configuration before exposing it.

Why not simply mount a worktree? Worktrees separate working files but share Git metadata. Mounting only a worktree can break its external Git paths; mounting the common repository broadens access. Independent clones keep this example's Git boundary easier to explain.

For authentication, export `COPILOT_GITHUB_TOKEN` through your preferred secret-handling mechanism. Use a supported, narrowly scoped credential. The [Copilot authentication reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference#copilot-login-options) documents fine-grained PATs with Copilot Requests permission; inference authentication does not justify repository administration rights.

Then launch:

```bash
: "${COPILOT_GITHUB_TOKEN:?Export a supported, scoped credential first}"

docker run --rm -it \
    --cap-drop=ALL \
    --security-opt=no-new-privileges:true \
    --pids-limit=256 \
    --memory=4g --memory-swap=4g \
    --cpus=2 \
    --network=bridge \
    --env COPILOT_GITHUB_TOKEN \
    --mount "type=bind,src=$(cd ../my-project-agent-task && pwd),dst=/home/node/workspace" \
    agent-task
```

This preserves the CLI's normal permission workflow. It does **not** enable an inner native sandbox or turn on blanket approval.

The bind mount is writable. Changes survive container removal. On Linux, match checkout ownership to the container user without granting broad permissions as a shortcut.

The resource limits are illustrative, not suitable for every build. The container shares the Docker host's kernel; on Docker Desktop, that host is a Linux VM.

### What This Example Does Not Restrict

**Networking:** bridge mode permits outbound connectivity, potentially including your LAN, host gateway, and cloud APIs. It is not an egress allowlist. If those destinations must be denied, enforce the policy outside the agent with an appropriate firewall or non-bypassable proxy.

**Credentials:** the process can read the token supplied in its environment. A secret file would also be readable by the process using it. Runtime delivery avoids baking secrets into images; it does not hide them from the agent.

**Remote effects:** removing the Git remote is housekeeping, not authorization enforcement. Network access and credentials still determine which remote operations are possible.

**Every outside tool:** an MCP service already running on the host or a remote server does not move inside the container just because its client does.

Do not add the host Docker socket, broad home-directory mounts, host networking, or privileged execution. Those choices can undermine the boundary. See [Docker's security documentation](https://docs.docker.com/engine/security/).

## Layer Controls Only When They Add Something

You can combine an outer environment with native sandboxing. For example, an outer container may provide reproducible dependencies while an inner sandbox further restricts command access.

But nested isolation has prerequisites. Linux sandbox backends may require namespace operations or tools that the outer environment blocks.

If that fails, don't immediately add `--privileged`, disable security profiles, or grant broad capabilities. Investigate the documented requirements and decide whether the resulting configuration still meets your threat model.

An unverified stack of controls is not automatically safer than one boundary you understand.

## Verify the Boundary, Not the Badge

Before handing an agent a substantial task, create harmless probes in a disposable environment. Define the expected policy first.

| Check | What to verify |
|---|---|
| Allowed project write | A scratch file inside the permitted checkout can be changed |
| Explicitly denied path | A canary outside the allowed scope stays inaccessible through the tools you rely on |
| Network denial | A controlled test destination is unreachable when policy says it should be |
| Credentials | Only intended credentials are available, with the intended permissions |
| Bypass behavior | A blocked action does not silently retry with broader access |
| Cleanup | Workspace changes, volumes, and remote effects are accounted for separately |

Test shell execution and built-in file tools separately where their enforcement differs. For a shell sandbox, ask the agent to execute the probe through its shell tool; a command you type directly may use a different execution path.

Use test endpoints and fake canary data, not production credentials or real customer records. A successful write probe doesn't prove a network restriction, and a blocked command doesn't prove every other tool is contained.

After the task, inspect diffs, untracked files, and actual test results before integrating changes. A worktree or branch helps organize that review; neither is an isolation boundary by itself.

## Summary and Key Takeaways

Built-in sandboxes make native isolation a sensible starting point for many trusted-project workflows. They deserve evaluation on their actual coverage, not dismissal as permission prompts.

Containers add value when you need a reproducible, disposable environment around the local agent and its tools. Whole-process sandbox runtimes and VMs provide other options with different trade-offs.

Whatever you choose, inspect filesystem scope, network access, credential handling, bypasses, and failure behavior. Keep the permissions appropriate to the task.

**The goal is not to put every agent in Docker. It is to choose a boundary you can explain, test, and maintain.**
