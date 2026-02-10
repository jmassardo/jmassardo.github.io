---
layout: post
title: "Detecting Bad Actors: Key GitHub Audit Log Events Security Teams Should Monitor"
date: 2026-02-10 10:00:00 -0500
category: Blog
tags: [github, security, audit-log, siem, threat-detection, enterprise, emu]
excerpt: "Your GitHub audit log stream is a goldmine for detecting malicious activity. Learn which events are the strongest indicators of compromise and how to build effective detection rules around them."
---

Your GitHub Enterprise audit log isn't just a compliance checkbox. It's one of the most valuable data sources for detecting insider threats, compromised accounts, and data exfiltration attempts. The challenge? GitHub generates *a lot* of events, and not all of them are equally useful for security monitoring.

After years of helping organizations secure their GitHub environments, I've identified the events that consistently surface malicious behavior. This post focuses on **what to look for** rather than the specifics of how to configure your particular SIEM. The goal is to help you build detection logic that actually catches bad actors, not just generate alert noise.

## The Philosophy: Baseline, Then Detect Anomalies

Before diving into specific events, let's establish the core principle: **context is everything**. An event that's completely normal for one user might be a massive red flag for another.

The most effective detection strategies combine:

1. **Volume-based anomalies**: User does X way more than average
2. **Time-based anomalies**: Activity outside normal working hours
3. **Pattern-based anomalies**: Unusual sequences of events
4. **First-time behaviors**: User does something they've never done before

For each event category below, I'll highlight which anomaly types are most relevant.

## Data Exfiltration Indicators

These events are your first line of defense against someone trying to walk out the door with your source code.

### `git.clone` - Repository Cloning

This is the big one. If someone's planning to steal your code, they need to clone it first.

**What to monitor:**

- **Volume anomalies**: Calculate the average number of unique repositories cloned per user per day/week. If a user typically clones 2-3 repos per week and suddenly clones 50, that's a problem. A compromised service accounts can clone every repo in an organization within hours.
- **First-time access**: User clones a repository they've never accessed before, especially if it's a sensitive repo.
- **Bulk cloning patterns**: Multiple clone events in rapid succession from the same actor.

**Detection rule example:**
> Alert when a user's clone count in 24 hours exceeds 3 standard deviations above their 30-day average, OR when any user clones more than 20 unique repositories in 24 hours.

### `repo.download_zip` - Source Code Archives

People forget about this one. You don't need `git clone` to steal code. The "Download ZIP" button works just fine.

**What to monitor:**

- Same volume-based logic as `git.clone`
- Users downloading archives from repos they don't normally work in
- Downloads from private/internal repos by users with minimal commit history

### API-Based Content Access

You don't need git at all to exfiltrate code. The REST API's `/repos/{owner}/{repo}/contents/` endpoint returns file contents directly, and GraphQL can query repository data in bulk. These API calls are emitted to the audit log stream.

**What to monitor:**

- High volumes of API requests from a single user or token
- API access to repositories the user doesn't normally interact with via git
- Programmatic access patterns (rapid sequential requests, unusual user agents)
- Content API calls from tokens that were recently created

**Detection approach:** Correlate API events with the `programmatic_access_type` field to identify which authentication method was used. A spike in API activity from a newly-created PAT accessing repos the user has never cloned is worth investigating.

## Authentication and Access Events

Compromised credentials are the most common entry point for attackers. These events help you spot account takeovers.

### `org.add_member` and `team.add_member`

New access grants deserve scrutiny.

**What to monitor:**

- Members added outside of normal onboarding workflows
- Users added directly to sensitive teams without going through standard provisioning
- Unusual actors performing the additions (especially if that admin doesn't normally handle access)

### `org.remove_member` with Rapid Re-add

A subtle attack pattern: remove a user, add a new account with similar access. This can fly under the radar if you're only alerting on additions.

### `org.invite_member` Patterns

Invitation events can indicate social engineering or unauthorized access attempts.

**What's in the log:** The audit log includes the actor (who sent the invite) and the invitee's GitHub username, but **not their email address**. This limits some detection approaches.

**What to monitor:**

- A single user sending many invitations in a short period
- Invitations sent by users who don't typically handle onboarding
- Invitations sent outside of normal business hours or HR workflows
- Invitee usernames that don't match your organization's naming conventions (if you have them)

### `public_key.create` - SSH Key Events

SSH key additions are high-value targets.

**What to monitor:**

- Keys added from unexpected public IP addresses (if you have IP disclosure enabled)
- Multiple keys added in a short timeframe
- Keys added for users who typically use HTTPS authentication

### `deploy_key.create` - Repository Deploy Keys

Deploy keys are often overlooked because they're scoped to individual repositories rather than user accounts. That's exactly what makes them attractive for persistence.

**Key events:**
- `deploy_key.create` - New deploy key added
- `deploy_key.delete` - Deploy key removed

**What to monitor:**

- Deploy keys created with write access (read-only is safer)
- Keys added to repositories the actor doesn't normally maintain
- Keys created just before a user's departure date
- Deploy keys that persist after associated automation is decommissioned

**Why this matters:** Deploy keys survive user deprovisioning. If an attacker (or departing employee) adds a deploy key to a sensitive repo, that access persists even after their account is removed. Unlike SSH keys, deploy keys are easy to miss during offboarding because they're attached to repos, not users.

### `personal_access_token` Events

PAT creation and usage patterns can reveal compromise.

**Key events:**
- `personal_access_token.access_granted` - New token authorized
- `personal_access_token.access_revoked` - Could indicate cleanup after an attack

**What to monitor:**

- Tokens created with broad scopes (especially `repo`, `admin:org`)
- Token creation followed immediately by API activity (might indicate scripted attacks)
- Tokens authorized by users who don't typically use programmatic access

### Fine-Grained Personal Access Tokens

Fine-grained PATs have their own event types and require slightly different detection logic.

**Key events:**
- `fine_grained_personal_access_token.access_granted` - New fine-grained token authorized
- `fine_grained_personal_access_token.access_revoked` - Token revoked

**What to monitor:**

- Tokens granted access to repositories outside the user's normal scope
- Tokens with `contents: write` or `administration` permissions
- Fine-grained tokens that bypass your classic PAT detection rules due to narrower scopes

**Detection consideration:** Fine-grained PATs can have very specific scopes that might fly under the radar if you're only alerting on broad classic PAT permissions. An attacker might create multiple narrow-scoped tokens instead of one broad one.

## Security Control Tampering

When attackers gain elevated access, they often try to weaken security controls. These events should trigger immediate investigation.

### Branch Protection Changes

- `protected_branch.destroy` - Protection removed entirely
- `protected_branch.policy_override` - Admin bypassed protection
- `protected_branch.update_*` - Any protection setting weakened

**What to monitor:**

- Protection changes on default branches (main, master, production)
- Changes made outside of change management windows
- Removal of required reviews or status checks

### Repository Ruleset Events

Rulesets are the newer, more powerful successor to branch protection. They deserve their own monitoring.

- `repository_ruleset.create` - New ruleset created
- `repository_ruleset.update` - Ruleset modified
- `repository_ruleset.destroy` - Ruleset deleted
- `repo.bypass_rules_actor_update` - Bypass actors modified

**What to monitor:**

- Rulesets deleted on repositories with compliance requirements
- Bypass actors added, especially service accounts or specific users
- Required status checks removed from rulesets
- Ruleset changes outside of change management windows

### Security Feature Disabling

These events are almost always bad news:

- `org.disable_two_factor_requirement` - 2FA requirement removed
- `dependabot_alerts.disable` - Vulnerability alerting turned off
- `secret_scanning_push_protection.disable` - Secret detection disabled
- `repository_secret_scanning.disable` - Secret scanning turned off at repo level
- `org.advanced_security_disabled_on_all_repos` - GHAS features disabled

**Detection rule:**
> Any of these events should generate an immediate alert with context about who made the change and from where.

### Secret Scanning Alert Events

Secret scanning alerts aren't just about finding secrets—the response patterns are equally revealing.

**Key events:**
- `secret_scanning_alert.create` - A secret was detected in a commit
- `secret_scanning_alert.resolve` - Alert marked as resolved
- `secret_scanning_alert_location.create` - Additional location of existing secret found
- `secret_scanning.disable` - Secret scanning turned off

**What to monitor:**

- High volume of `secret_scanning_alert.create` from a single user (they're committing secrets repeatedly)
- Alerts resolved as "false_positive" or "won't_fix" without corresponding secret rotation
- Alerts resolved immediately after creation (possible attempt to hide evidence)
- Users dismissing alerts on repositories they don't normally work on

**Detection approach:** Create a dashboard tracking alert resolution reasons. A high ratio of "false_positive" dismissals might indicate someone bypassing rather than fixing.

### IP Allow List Modifications

- `ip_allow_list_entry.create` - New IP added
- `ip_allow_list_entry.destroy` - IP removed
- `ip_allow_list.enable` / `ip_allow_list.disable` - Allow list toggled

Attackers who've compromised an admin account will often add their own IPs to the allow list or disable it entirely.

## Privileged Action Monitoring

Track what your admins are doing. Most organizations have too many org admins, and any one of them can cause significant damage.

### Role and Permission Escalation

- `org.add_billing_manager` - Billing access added
- `org.update_member` - Member role changed (especially to admin)
- `team.add_member` with admin/maintainer permissions
- `role.create` / `role.update` - Custom role modifications
- `organization_role.update` - Organization role changes

**What to monitor:**

- Permission grants outside of HR/onboarding workflows
- Self-elevation (user grants themselves higher permissions)
- Permissions granted and then used immediately

### Repository Visibility Changes

- `repo.access` with `visibility` field changing to `public`
- `private_repository_forking.enable` - Allows forking private repos

Making internal repos public (accidentally or intentionally) is a common data exposure vector.

### Repository Transfers

- `repo.transfer` - Repository moved to different owner
- `repo.transfer_start` - Transfer initiated

This is the nuclear option for data exfiltration—move the entire repository somewhere else.

**What to monitor:**

- Any `repo.transfer` event to a destination outside your enterprise
- Transfers by users approaching their termination date
- Transfers of repositories containing sensitive custom properties (if you've classified them)
- Bulk transfers from a single actor

**Detection rule:**
> Any `repo.transfer` where the destination is outside your enterprise should trigger an immediate alert and possibly an automated block (if you have the capability).

## Integration and Webhook Events

Third-party integrations can be backdoors into your organization.

### `integration_installation.create`

New GitHub App installations.

**What to monitor:**

- Apps installed that aren't on your approved list
- Apps with broad permissions (`contents: write`, `administration`)
- Installations by users who don't typically manage integrations

### `hook.create` and `hook.config_changed`

Webhooks can exfiltrate data or trigger external systems.

**What to monitor:**

- Webhooks pointing to unusual domains
- Webhooks created on sensitive repositories
- Webhook destinations outside your corporate network

### OAuth Application Events

- `oauth_application.create` - New OAuth app registered
- `org.oauth_app_access_approved` - OAuth app granted org access

## Actions and Workflow Manipulation

GitHub Actions has become a prime target for supply chain attacks. The attack surface here is broad—from disabling security checks to injecting malicious code via workflow modifications.

### Workflow File Changes

Watch for suspicious modifications to workflow files via `git.push` events targeting `.github/workflows/`.

**What to monitor:**

- Commits to workflow files by users who don't normally touch CI/CD
- Workflow changes that remove security scanning steps
- Addition of `workflow_run` triggers (can be used for [pwn requests](https://securitylab.github.com/research/github-actions-preventing-pwn-requests/))
- Workflows that use `pull_request_target` with explicit checkout of PR code (dangerous pattern)
- Changes to `CODEOWNERS` that remove protection for `.github/workflows/`

### `workflows.disable_workflow`

Watch for legitimate security workflows being disabled (SAST scans, security checks, etc.).

### Environment and Secret Events

- `environment.create_actions_secret` - Secrets added to environments
- `org.create_actions_secret` - Organization-level secrets
- `repo.create_actions_secret` - Repository secrets

**What to monitor:**

- Secrets created on repos the user doesn't normally work on
- Secrets with names suggesting credentials (passwords, tokens, keys)

### Runner Registration

- `org.register_self_hosted_runner` - New runner registered
- `repo.register_self_hosted_runner` - Repo-level runner

Self-hosted runners can be used to pivot into your network. Monitor for unexpected registrations.

### Actions Cache Events

- `actions_cache.deleted` - Cache entry removed

**What to monitor:**

- Cache deletions followed by workflow runs (possible cache poisoning setup)
- Unusual patterns of cache manipulation by users who don't normally interact with CI

## Codespaces Events

Codespaces create persistent cloud development environments that have access to repository contents and developer secrets.

### Key Events

- `codespaces.create` - New codespace created
- `codespaces.delete` - Codespace removed
- `codespaces.publish` - Codespace published to a repository
- `codespaces.access_settings_updated` - Access settings changed

**What to monitor:**

- Codespaces created on sensitive repositories by users who don't normally work on them
- Long-running codespaces that haven't been used (potential persistent access)
- Codespace port forwarding to external addresses (data exfiltration path)
- Bulk codespace creation (resource abuse or exfiltration preparation)

**Detection consideration:** Codespaces have access to repository secrets configured in the repository settings. A compromised codespace is essentially a compromised developer workstation with repository access.

## Enterprise Managed Users: What's Different?

If you're running an [Enterprise Managed Users (EMU)](https://docs.github.com/en/enterprise-cloud@latest/admin/identity-and-access-management/understanding-iam-for-enterprises/about-enterprise-managed-users) environment, your threat model and relevant events shift in some important ways. Traditional GitHub Enterprise Cloud orgs and EMU enterprises have fundamentally different identity architectures, which changes what you should monitor.

### The Good News: Reduced Attack Surface

EMU enterprises have some built-in protections that reduce certain risks:

- **No in-platform forking to personal accounts**: EMU users can't fork enterprise repos to personal GitHub accounts because they don't have personal accounts. However, this doesn't prevent data exfiltration. Users can still clone repos locally and push to any external destination (GitLab, Bitbucket, a separate personal GitHub account, etc.).
- **No external collaboration**: EMU users can only interact with resources inside the enterprise. They can't be added as collaborators to external repos or contribute to public projects.
- **Centralized identity**: All user accounts are provisioned via your IdP through SCIM. No one can create accounts or invite users outside of your identity management process.

### The Bad News: IdP Compromise = Total Compromise

Because EMU relies entirely on your IdP, a compromised identity provider is catastrophic. Your detection strategy needs to account for this.

### EMU-Specific Events to Monitor

#### SCIM Provisioning Events

These events track user lifecycle managed by your IdP:

- `external_identity.provision` - New user provisioned via SCIM
- `external_identity.update` - User attributes changed via SCIM
- `external_identity.deprovision` - User removed via SCIM

**What to monitor:**

- Provisioning events that don't correlate with your HR systems (user created in GitHub but no matching hire event)
- Bulk provisioning outside of normal onboarding cycles
- Attribute changes that grant elevated access

#### External Identity Events

- `org.revoke_external_identity` - A user's linked identity was manually revoked
- `org.revoke_sso_session` - A user's SSO session was terminated

**What to monitor:**

- Manual identity revocations (these should be rare since SCIM handles deprovisioning)
- Session revocations followed by immediate re-authentication from different locations

#### SSO Response Events

- `org.sso_response` - Generated when a user authenticates via SAML

**What to monitor:**

- SSO authentications from unexpected public IP ranges (remember: this is the egress IP, not device IP)
- Authentication patterns that don't match normal working hours
- Successful SSO for users who should be deprovisioned

#### Recovery Code Events

EMU enterprises have organization-level recovery codes for emergency access:

- `org.recovery_codes_regenerated` - Recovery codes were regenerated
- `org.recovery_code_used` - Someone used a recovery code to sign in
- `org.recovery_code_failed` - Failed recovery code attempt

**Detection rule:**
> Any `org.recovery_code_used` event should trigger an immediate alert. These should essentially never be used in normal operations.

### Comparing Threat Models

| Threat | Traditional Enterprise | EMU Enterprise |
|--------|----------------------|----------------|
| Account takeover | Individual credentials compromised | IdP compromise affects all users |
| In-platform forking to personal repos | Possible (if allowed) | Not possible (no personal accounts) |
| Clone-and-push exfiltration | Possible | Possible (same risk) |
| External collaboration abuse | Possible | Not possible |
| Rogue user creation | Via invitation abuse | Only via SCIM/IdP |
| SSH key persistence | User-managed | User-managed (same risk) |
| PAT creation | User-managed | User-managed (same risk) |

### EMU Detection Priorities

For EMU enterprises, adjust your monitoring priorities:

1. **Elevate IdP/SCIM monitoring**: Your IdP logs become as important as GitHub logs. Correlate SCIM provisioning with HR data.
2. **Recovery code usage is critical**: Unlike traditional enterprises, recovery code usage in EMU is almost always an incident.
3. **Focus on SSO anomalies**: Geographic and temporal anomalies in SSO events matter more since it's the only authentication path.
4. **De-prioritize invitation events**: `org.invite_member` doesn't apply to EMU since users are provisioned via SCIM, not invited.

## Suspicious Patterns to Correlate

Individual events are useful, but correlating multiple events reveals more sophisticated attacks.

### The "Smash and Grab"

Look for this sequence in a short timeframe:
1. `org.add_member` or sudden access grant
2. Multiple `git.clone` events
3. `org.remove_member` or access revocation

### The "Quiet Backdoor"

Over a longer period:
1. `public_key.create` or `personal_access_token.access_granted`
2. Low activity for days/weeks
3. Sudden spike in API or git activity

### The "Insider Cleanup"

Before someone leaves (check against HR termination dates):
1. Elevated `git.clone` activity
2. `repo.download_zip` for multiple repos
3. Possible `repo.transfer` attempts

## Important Caveats and Limitations

Before you build out your detection rules, understand what the audit log *doesn't* give you.

### IP Addresses Are Public Egress IPs

If you [enable IP disclosure](https://docs.github.com/en/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/displaying-ip-addresses-in-the-audit-log-for-your-organization), the IP recorded is the public IP as seen by GitHub, not the user's workstation IP.

- Working from home? You'll see their ISP's IP.
- In the corporate office? You'll see the corporate egress IP.
- On a VPN? You'll see the VPN exit node.

**What this means:** You cannot trace activity back to a specific physical device using GitHub audit logs alone. You can do rough geographic analysis (country/region) and detect anomalies like "this user usually comes from a US IP but suddenly appeared from Eastern Europe," but for device-level attribution you'll need to correlate with your own network logs.

### You Only See Activity Within Your Enterprise

The `git.push` event only logs pushes *into* your repositories. It does **not** track what users do with code after they clone it locally.

If an attacker clones your repo to their workstation and then pushes it to a personal GitHub account, GitLab, Bitbucket, or any other destination, you won't see that in your GitHub audit logs. That push shows up in the *destination* platform's logs, not yours. Your visibility ends at the clone.

**Compensating controls to consider:**

- **Endpoint DLP**: Tools that monitor git operations on managed devices
- **Network monitoring**: Detect git protocol traffic to unauthorized destinations
- **DNS monitoring**: Watch for connections to known SCM platforms from corporate networks
- **Clone-focused detection**: Since you *can* see clones, focus your exfiltration detection there

The clone is the prerequisite for this attack. You may not see where the code goes, but you can absolutely see it leaving your enterprise.

### Some Fields Aren't What You'd Expect

A few gotchas we've already covered but are worth repeating:

- `org.invite_member` includes the invitee's GitHub username but **not** their email address
- `git.clone` and `git.push` events are only available via the REST API, audit log streaming, or exports. They don't appear in the web UI.
- Timestamps are in UTC regardless of your organization's timezone settings

### EMU vs Traditional Enterprise Differences

If you're running Enterprise Managed Users, some events behave differently or don't apply at all. See the [EMU section above](#enterprise-managed-users-whats-different) for specifics.

## TL;DR: Priority Events for Security Monitoring

If you can only monitor a handful of events, focus on these:

| Priority | Event | Why It Matters |
|----------|-------|----------------|
| Critical | `git.clone` (volume anomalies) | Primary data exfiltration method |
| Critical | `protected_branch.destroy` | Security control removal |
| Critical | `org.disable_two_factor_requirement` | Authentication weakening |
| Critical | `repo.transfer` | Entire repository exfiltration |
| High | `public_key.create` | Persistent access establishment |
| High | `deploy_key.create` | Persistent repo-level access |
| High | `personal_access_token.access_granted` | Programmatic access creation |
| High | `integration_installation.create` | Third-party access |
| High | `repo.access` (visibility changes) | Accidental/intentional exposure |
| High | `repository_ruleset.destroy` | Security control removal |
| Medium | `org.add_member` / `team.add_member` | Access grants |
| Medium | `hook.create` | Data exfiltration paths |
| Medium | `workflows.disable_workflow` | CI/CD security bypass |
| Medium | `secret_scanning_alert.create` | Credential exposure indicator |
| Medium | `codespaces.create` (anomalies) | Persistent cloud access |

## Wrapping Up

The GitHub audit log is one of the most underutilized security data sources I encounter. Most organizations either ignore it entirely or dump everything into a SIEM without building meaningful detection rules.

Start small. Pick 3-5 high-value events from this post, build baselines, and create alerts. Once those are tuned and useful, expand your coverage. The goal isn't to alert on everything; it's to surface the events that actually indicate compromise.

Your code is one of your most valuable assets. Treat its access controls like you would any other critical system, and monitor accordingly.

---

*Have questions about GitHub security monitoring? Want to share your own detection rules? Hit me up on [LinkedIn](https://www.linkedin.com/in/jenna-massardo/), [Bluesky](https://bsky.app/profile/jmassardo.bsky.social), or [GitHub](https://github.com/jmassardo).*
