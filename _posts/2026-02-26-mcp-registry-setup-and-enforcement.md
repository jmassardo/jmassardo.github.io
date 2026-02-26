---
layout: post
title: "Locking Down MCP: Setting Up a Registry and Enforcing Server Access"
date: 2026-02-26 10:00:00 -0500
category: Blog
tags: [github, copilot, mcp, security, devops, ai, enterprise]
excerpt: "A practical guide to setting up an MCP registry, enforcing server access policies across IDEs, and understanding the current limitations you need to plan around."
---

## Introduction

Model Context Protocol (MCP) servers are one of the most powerful ways to extend AI-assisted development. They let your coding assistants reach out to databases, APIs, file systems, and all sorts of external tooling. That power is incredible for productivity, but if you're responsible for security or governance in your organization, it probably also made your eye twitch a little.

The good news: you can set up a curated MCP registry and enforce policies that restrict which servers your developers can actually use. The less good news: enforcement is still maturing, and there are caveats you need to understand before you rely on it as a hard security boundary.

This post walks through the end-to-end process of setting up an MCP registry, configuring allowlist policies at the organization and enterprise level, enforcing those policies across different IDEs, and understanding the gaps that still exist.

## What Is an MCP Registry?

The [MCP Registry](https://modelcontextprotocol.io/registry) is a centralized metadata repository for publicly accessible MCP servers. Think of it as a catalog that tells IDEs where to find servers, how to install them, and what they do. The official public registry is backed by major contributors like Anthropic, GitHub, PulseMCP, and Microsoft.

Key things to understand about the registry ecosystem:

- **The registry hosts metadata, not code.** The actual server packages live on npm, PyPI, Docker Hub, etc. The registry just points to them.
- **The official public registry uses namespace authentication** to verify that servers come from their claimed sources. Server names follow a reverse DNS format (e.g., `io.github.username/server-name`) tied to verified GitHub accounts or domains. This prevents impersonation on the public registry, but does not apply when you host your own.
- **The public registry is not designed for private servers.** If your MCP servers are internal-only, you need to host your own registry.

For enterprise and organizational use, the real value is in creating your own private registry that contains only the servers you have vetted and approved. This becomes the foundation for enforcement.

## Step 1: Create Your MCP Registry

You have two main options for hosting a registry.

### Option A: Self-Host a Registry

At its core, an MCP registry is a set of HTTPS endpoints that serve metadata about included MCP servers. You can stand one up by:

- **Forking the official open-source registry** from the [`modelcontextprotocol/registry`](https://github.com/modelcontextprotocol/registry) repository and hosting it yourself.
- **Running the registry locally with Docker** for testing.
- **Building a custom implementation** that conforms to the v0.1 specification.

Your self-hosted registry must support these endpoints:

| Endpoint | Purpose |
|---|---|
| `GET /v0.1/servers` | Returns a list of all included MCP servers |
| `GET /v0.1/servers/{serverName}/versions/latest` | Returns the latest version of a specific server |
| `GET /v0.1/servers/{serverName}/versions/{version}` | Returns the details for a specific version of a server |

You also need CORS headers on all `/v0.1/servers` endpoints so Copilot can make cross-origin requests from the IDE:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
```

> **Important:** Use the v0.1 specification. The original v0 is now considered unstable and should not be implemented.

### Option B: Use Azure API Center

If you are already in the Azure ecosystem, [Azure API Center](https://learn.microsoft.com/azure/api-center/register-discover-mcp-server) provides a fully managed MCP registry with automatic CORS configuration and built-in governance features. It offers a free tier for basic cataloging and discovery.

To use it:

1. Complete the initial setup in Azure following the [Azure API Center MCP docs](https://learn.microsoft.com/azure/api-center/register-discover-mcp-server).
2. Include any local MCP servers in your registry with their correct server IDs.
3. Enable anonymous access in the visibility settings so Copilot can fetch the registry.
4. Copy your API Center endpoint URL for policy configuration.

> **Note:** When configuring the registry URL later, use only the base URL for your API Center. Including route suffixes like `/v0.1/servers` will cause errors.

## Step 2: Configure Access Policies

Once your registry is up, you need to set GitHub Enterprise policies that point developers to it and (optionally) restrict them to only the servers it contains.

> **Note:** If you are using other AI tools, you'll have to review the docs for them to see if they have enforcement options. Also note that some IDEs currently only support manual configuration of the registry. See the IDE section below.

### Enterprise-Level Configuration

Enterprise-level policies override organization-level settings and apply uniformly across all orgs in the enterprise.

1. Navigate to your profile picture > **Enterprise** > **AI controls**.
2. In the sidebar, click **MCP**.
3. Set **MCP servers in Copilot** to **Enabled everywhere**.
4. Enter your registry URL in the **MCP Registry URL** field and click **Save**.
5. Under **Restrict MCP access to registry servers**, choose:
   - **Allow all** - No restrictions. All MCP servers can be used.
   - **Registry only** - Only servers from your registry may run.

### Organization-Level Configuration

If your enterprise does not set a blanket policy, or if you are managing a standalone organization:

1. Navigate to **Organization Settings** > **Copilot** > **Policies**.
2. Set **MCP servers in Copilot** to **Enabled**.
3. Enter your registry URL in the **MCP Registry URL (optional)** field and click **Save**.
4. Under **Restrict MCP access to registry servers**, choose **Allow all** or **Registry only**.

The policy takes effect immediately for developers in the scope.

### Policy Resolution for Multiple Seats

If a developer has Copilot seats from multiple organizations or enterprises, GitHub resolves conflicts automatically:

1. **Scope wins** - Enterprise policies override organization policies.
2. **Strictness wins** - "Registry only" [takes precedence](https://docs.github.com/en/enterprise-cloud@latest/copilot/reference/mcp-allowlist-enforcement#policy-resolution-for-users-with-multiple-seats) over "Allow all."
3. **Recency breaks ties** - If scope and strictness match, the most recently uploaded registry is applied.

## Step 3: IDE-Specific Enforcement

MCP registry and policy support varies by IDE. Here is the current state of support and the minimum versions required.

### Minimum Version Requirements

| IDE | Minimum Version | Registry Support | Notes |
|---|---|---|---|
| VS Code | 1.99+ | Full (gallery + manual config) | Supports `ChatMCP` enterprise policy for source restrictions |
| Visual Studio | 17.14+ | Manual config + OAuth servers | Registry configuration via MCP settings |
| JetBrains IDEs | Latest with Copilot plugin | Registry + manual config | IntelliJ, PyCharm, WebStorm, GoLand, Rider, and more |
| Eclipse | 2024-09+ | Registry + manual config | Registry browsing via Copilot Chat MCP icon |
| Xcode | Copilot for Xcode extension | Registry + manual config | Registry URL configurable in settings > Tools tab |

### VS Code: Enterprise Policy Enforcement

VS Code has the most mature enforcement story. IT administrators can deploy the `ChatMCP` enterprise policy via device management (MDM, GPO, etc.) to control which sources MCP servers can be installed from:

| Policy Value | Behavior |
|---|---|
| `allowed` | Developers can run MCP servers from any source |
| `registryOnly` | Developers can only run MCP servers from the configured registry |
| `off` | MCP server support is disabled entirely |

You can also override the default gallery URL using the `McpGalleryServiceUrl` policy to point at your private registry. When configured, developers see your curated server list when they search `@mcp` in the Extensions view.

Additional VS Code policies worth configuring alongside MCP:

- **`ChatToolsAutoApprove`** (set to `false`): Prevents "YOLO mode" where all tools run without approval prompts. Highly recommended.
- **`ChatToolsEligibleForAutoApproval`**: Granularly control which tools can or cannot be auto-approved.
- **`ChatAgentExtensionTools`** (set to `false`): Blocks extension-contributed tools while still allowing built-in and MCP tools.

### JetBrains IDEs

In JetBrains IDEs, developers access the MCP Registry via the MCP icon in the Copilot Chat window. From there they can browse and install servers from whichever registry is configured. Manual configuration goes into an `mcp.json` file accessible from the chat tools settings.

The GitHub org/enterprise-level "MCP servers in Copilot" policy gates whether MCP is available at all in JetBrains, but the `ChatMCP` device-level policy is VS Code-specific.

**Config file location:** The `mcp.json` lives under the IDE's configuration directory, which varies by OS and product:

| OS | Default Path |
|---|---|
| macOS | `~/Library/Application Support/JetBrains/<product><version>/` |
| Windows | `%APPDATA%\JetBrains\<product><version>\` |
| Linux | `~/.config/JetBrains/<product><version>/` |

Replace `<product><version>` with the specific IDE and version (e.g., `IntelliJIdea2025.3`, `PyCharm2025.3`).

**Desktop management:** JetBrains offers [IDE Provisioner](https://www.jetbrains.com/toolbox-enterprise/) (part of JetBrains IDE Services, paid product) which can propagate global IDE settings, restrict plugins, and push configurations to developer machines via the Toolbox App. There is no MDM/GPO-style policy framework equivalent to VS Code's `ChatMCP`, but you could pre-deploy the `mcp.json` file to the correct path using your desktop management tool. Just be aware that this path changes with each major IDE version, so your deployment automation would need to account for that.

### Eclipse

Eclipse supports MCP registry browsing via the Copilot Chat MCP icon. Manual configuration is available through **Edit Preferences** > **GitHub Copilot** > **MCP**. Like JetBrains, it respects the GitHub-level MCP policy but does not have VS Code-style device policies.

**Config file location:** Eclipse stores its preferences (including MCP server configurations) as `.prefs` files under the workspace metadata directory:

```
<workspace>/.metadata/.plugins/org.eclipse.core.runtime/.settings/
```

**Desktop management:** Eclipse does not have a formal enterprise policy framework for MCP or AI settings. You could pre-seed the `.prefs` files via desktop management tooling, but this path is workspace-specific and not centralized per user. It is less practical than the VS Code or JetBrains approaches.

### Visual Studio

Visual Studio 17.14+ supports MCP servers configured via the chat panel's tools icon. It supports both remote (HTTP/SSE with OAuth) and local (stdio) servers. The `mcp.json` configuration is accessible through the Visual Studio UI.

**Config file location:** Visual Studio stores MCP configuration in an `mcp.json` file. When configured at the project level, this lives in the `.vs/` directory of the solution. User-level configuration is stored under the Visual Studio configuration directory (typically `%LOCALAPPDATA%\Microsoft\VisualStudio\<version>\`).

**Desktop management:** Visual Studio supports Group Policy and the Visual Studio Administrative Templates for enterprise configuration. However, MCP-specific policies (like VS Code's `ChatMCP`) are not available in Visual Studio at this time. You can pre-deploy an `mcp.json` file to the appropriate path via your desktop management tool.

### Xcode

Xcode requires the GitHub Copilot for Xcode extension. MCP registry browsing is accessed via **Settings** > **Tools** tab > **Browse MCP Servers** next to the MCP Registry URL field. Manual configuration is in the **MCP** tab under **Edit Config**.

## The Caveats (Read This Section Carefully)

Here is where we get real. Before you go all-in on MCP governance, you need to understand that some of the gaps you will encounter are not bugs in any particular tool. MCP is an emerging protocol. It was designed to make connecting AI models to external tools as simple and flexible as possible, and it accomplished that goal. What it did not ship with is built-in governance, access control, or enforcement. Those are being layered on by the ecosystem now, and they are still maturing.

The limitations below are a mix of "the protocol does not define this yet" and "the current tooling has not closed this gap." Knowing which is which will help you set realistic expectations.

### Limitations Inherent to MCP

These apply regardless of which AI coding tool you are using. If it speaks MCP, these limitations come along for the ride.

1. **MCP has no built-in governance layer.** The protocol itself defines how models talk to tools. Period. It does not define registries, allowlists, access control, or enforcement. Everything in this post about registries and policies? That is ecosystem tooling built on top of MCP by GitHub, Microsoft, and others. It is not baked into the protocol.

2. **Local config files are user-editable.** Every MCP host application (Copilot, Claude Desktop, Cursor, Windsurf, Codex, etc.) uses local JSON config files to define which servers to connect to. If a developer has access to their machine, they can edit those files. This is not a bug. It is just how computers work. No IDE policy can fully prevent a local user from modifying files they own.

3. **Enforcement is name-based, not cryptographic.** The allowlist mechanisms that do exist match on server name or ID. There is no cryptographic signing or attestation in the MCP spec that ties a server name to a specific verified binary or endpoint. A determined user could point a recognized server name at different code.

4. **Strict prevention of non-registry servers does not exist yet.** There is no mechanism in any MCP host today that makes it truly impossible to add an unapproved server. The "Registry only" style policies tell the IDE to restrict what it offers, but they cannot make the underlying config file read-only.

### Limitations Specific to GitHub Copilot Policies

These are boundaries of the current Copilot policy system, not MCP itself.

5. **The org/enterprise MCP policy only governs Copilot Business and Enterprise seats.** Users on Copilot Free, Copilot Pro, or Copilot Pro+ are not subject to organizational MCP policies. If your team includes mixed subscription types, some users will not be covered.

6. **The policy does not reach third-party host applications.** The "MCP servers in Copilot" policy controls Copilot's behavior. It has no effect on other MCP-capable tools like Cursor, Windsurf, Claude Desktop, or OpenAI Codex. If your developers use those tools alongside Copilot, you need separate governance for each.

### Limitations Specific to VS Code

7. **Device policies are VS Code-only.** The `ChatMCP` and `McpGalleryServiceUrl` enterprise policies are deployed through VS Code's policy framework (MDM/GPO). They do not apply to JetBrains, Visual Studio, Eclipse, or Xcode. Those IDEs rely on the GitHub org-level policy, which is less granular.

8. **`chat.mcp.discovery.enabled` can discover external configs.** If a developer has MCP servers configured in Claude Desktop, enabling this VS Code setting will auto-discover and import those server configurations, potentially bypassing your registry restrictions.

### What You Can Do Today

The governance story is clearly "version 1.0" territory, but that does not mean you are helpless. Most of these mitigations are solid for practical purposes. Remember, you are not trying to stop nation-state actors from bypassing your MCP registry. You are trying to keep well-intentioned developers from accidentally connecting to unvetted tools.

- **Use "Registry only" as a strong signal**, not a hard security boundary. It will prevent casual or accidental use of unapproved servers by the vast majority of developers, and that is the actual risk for most organizations.
- **Disable MCP entirely** if your security posture requires strict enforcement until better controls are available. This is the safest option for high-compliance environments.
- **Disable global auto-approval** (`ChatToolsAutoApprove = false`) so even approved tools require explicit confirmation before executing.
- **Combine with device management.** Use MDM/GPO to deploy VS Code enterprise policies. This is more resistant to casual circumvention than GitHub-level policies alone.
- **Account for your full tool landscape.** If your developers use Cursor, Windsurf, Claude, Codex, or any other MCP-capable tool, each one needs its own governance approach. A Copilot-only policy leaves gaps.
- **Monitor and audit.** Keep an eye on what MCP servers are being used. Even without strict enforcement, visibility is valuable.
- **Educate your developers.** Make it clear which servers are approved, why the policy exists, and what the risks are. Most people are not trying to bypass security controls; they just need to know what the rules are.

## TL;DR

| Step | Action |
|---|---|
| **Create a registry** | Self-host from the open-source repo, or use Azure API Center |
| **Configure policies** | Set your registry URL and "Registry only" at the enterprise or org level in GitHub |
| **Enforce in VS Code** | Deploy `ChatMCP` and `McpGalleryServiceUrl` enterprise policies via MDM |
| **Enforce in other IDEs** | Enable the "MCP servers in Copilot" org/enterprise policy; IDE-specific device policies are limited to VS Code |
| **Understand the gaps** | Enforcement is name-based, local configs are editable, and some subscription types and third-party tools are not covered |
| **Mitigate** | Disable auto-approval, combine GitHub policies with device management, monitor usage, and consider disabling MCP if strict enforcement is required |

MCP governance is clearly an area under active development. The bones are there, and for most organizations the current tooling is sufficient to establish meaningful guardrails. Just don't mistake "Registry only" for "impossible to bypass" yet. Keep an eye on the [GitHub docs](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-mcp-usage/configure-mcp-server-access) and the [MCP allowlist enforcement reference](https://docs.github.com/en/copilot/reference/mcp-allowlist-enforcement) for updates as strict enforcement matures.

---

*Questions about MCP governance or registry setup? Find me on [LinkedIn](https://www.linkedin.com/in/jenna-massardo/), [Bluesky](https://bsky.app/profile/jmassardo.bsky.social), or [GitHub](https://github.com/jmassardo).*
