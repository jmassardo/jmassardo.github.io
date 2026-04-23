---
marp: true
theme: default
class: invert
paginate: true
style: |
  :root {
    --color-bg: #0d1117;
    --color-text: #c9d1d9;
    --color-accent: #58a6ff;
    --color-green: #3fb950;
    --color-purple: #bc8cff;
    --color-orange: #e3b341;
    --color-red: #f85149;
    --color-border: #30363d;
    --color-surface: #161b22;
    --color-surface2: #21262d;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
  }

  section {
    background-color: var(--color-bg);
    color: var(--color-text);
    padding: 40px 60px;
  }

  section::after {
    color: #484f58;
    font-size: 0.75em;
  }

  h1 {
    color: var(--color-accent);
    font-size: 2em;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 0.3em;
    margin-bottom: 0.5em;
  }

  h2 {
    color: var(--color-accent);
    font-size: 1.5em;
    margin-bottom: 0.4em;
  }

  h3 {
    color: var(--color-purple);
    font-size: 1.1em;
    margin-bottom: 0.3em;
  }

  p {
    font-size: 0.88em;
    line-height: 1.5;
    margin: 0.3em 0;
  }

  ul {
    margin: 0.3em 0;
    padding-left: 1.4em;
  }

  li {
    font-size: 0.85em;
    line-height: 1.6;
    margin: 0.15em 0;
  }

  code {
    background-color: var(--color-surface);
    color: #79c0ff;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 1px 6px;
    font-size: 0.82em;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  }

  pre {
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 12px 16px;
    margin: 0.4em 0;
    overflow: hidden;
  }

  pre code {
    background: none;
    border: none;
    padding: 0;
    font-size: 0.72em;
    line-height: 1.5;
    color: #e6edf3;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.75em;
    margin: 0.4em 0;
  }

  th {
    background-color: var(--color-surface2);
    color: var(--color-accent);
    border: 1px solid var(--color-border);
    padding: 6px 10px;
    text-align: left;
    font-weight: 600;
  }

  td {
    border: 1px solid var(--color-border);
    padding: 5px 10px;
    background-color: var(--color-surface);
  }

  tr:nth-child(even) td {
    background-color: #0d1117;
  }

  strong {
    color: #e6edf3;
  }

  blockquote {
    border-left: 3px solid var(--color-orange);
    background-color: var(--color-surface);
    margin: 0.4em 0;
    padding: 8px 14px;
    border-radius: 0 6px 6px 0;
    font-size: 0.82em;
  }

  blockquote p {
    color: var(--color-orange);
    margin: 0;
  }

  .columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .badge-green {
    color: var(--color-green);
    font-weight: bold;
  }

  .badge-red {
    color: var(--color-red);
    font-weight: bold;
  }

  .badge-orange {
    color: var(--color-orange);
    font-weight: bold;
  }

  .pill {
    display: inline-block;
    background-color: var(--color-surface2);
    border: 1px solid var(--color-border);
    border-radius: 20px;
    padding: 2px 10px;
    font-size: 0.75em;
    margin: 2px;
  }

  section.title {
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: center;
    padding: 60px;
  }

  section.title h1 {
    font-size: 2.4em;
    border-bottom: none;
    color: #e6edf3;
    margin-bottom: 0.1em;
  }

  section.title h2 {
    color: var(--color-accent);
    font-size: 1.2em;
    font-weight: 400;
    margin-top: 0;
    margin-bottom: 0.2em;
  }

  section.title .subtitle {
    color: #484f58;
    font-size: 0.85em;
    margin-top: 40px;
  }

  section.section-header {
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
    border-left: 4px solid var(--color-accent);
  }

  section.section-header h1 {
    font-size: 2.2em;
    border-bottom: none;
  }

  section.section-header p {
    color: #8b949e;
    font-size: 1em;
    font-style: italic;
  }
---

<!-- _class: title -->

# Migrating to GitHub Enterprise Managed Users

## Jenna Massardo @massardo <br> Staff Customer Success Architect <br> GitHub

<div class="subtitle">

Lightning Talk - 10-15 min  
`#github` `#enterprise` `#devops` `#identity`

</div>

---

# What is EMU?

**Enterprise Managed Users** - GitHub's centralized identity model

<div class="columns">

<div>

### Standard GHEC

- Users create personal accounts
- Link corp identity via SAML
- Users own their account
- Can contribute anywhere

</div>

<div>

### GHEC with EMU

- **IdP provisions accounts** via SCIM
- Users authenticate through IdP only
- **Enterprise owns the account**
- Scoped to your enterprise

</div>

</div>

> Think **"BYOD"** vs **"company-issued laptops"** - both work, but for different requirements.

- Usernames follow format: `handle_shortcode` (e.g., `jsmith_acme`)
- Lifecycle is fully automated: create, update, suspend, delete

---

# Why Would You Want EMU?

<div class="columns">

<div>

**Security & DLP**
- No public repos
- No public gists
- Immediate access revocation on termination
- Centralized audit logging

**Compliance**
- SOC 2, HIPAA, FedRAMP ready
- Single source of truth for access
- Automated deprovisioning (no orphaned accounts)

</div>

<div>

**Operational Efficiency**
- Zero-touch onboarding via SCIM
- Group-based permissions from IdP
- Access reviews are actually manageable
- Contractor/vendor lifecycle handled



</div>

</div>

---

# When NOT to Use EMU

<span class="badge-red">Stop</span> and think before committing - EMU restrictions are real.

| Situation | Why it's a problem |
|-----------|-------------------|
| Heavy OSS contribution | Managed users can't push to external repos |
| Developer advocacy | Contributions don't show on public profiles |
| Small team (< 50 devs) | Overhead outweighs the benefits |
| Consulting / client work | Managed users can't access client orgs |
| Academic / research | Conflicts with open collaboration model |

> Your developers will need **separate personal accounts** for any external GitHub work. That's two accounts, two contexts, two sets of bookmarks. Plan for the friction.

---

<!-- _class: section-header -->

# The 6-Phase Journey

*A marathon, not a sprint - 12 to 26 weeks*

---

# Migration Phases at a Glance

| | Phase | Focus | Time |
|---|---|---|---|
| 1️⃣ | **Discovery & Decision** | Define goals, evaluate fit, get buy-in | 2-4 wks |
| 2️⃣ | **Pre-Migration Prep** | Inventory, cleanup, IdP readiness, comms | 4-8 wks |
| 3️⃣ | **Identity & Access** | Configure SCIM, provision users, teams | 1-2 wks |
| 4️⃣ | **Security & Compliance** | Audit logging, hardening, CI/CD, integrations | 2-4 wks |
| 🔁 | **Migration Execution** | Run GEI, migrate repos, reclaim mannequins | *per group* |
| ✅ | **Validation & Adoption** | Testing, training, OSS strategy, go-live | *per group* |

Phases 1-4 are **sequential and done once**. Phases 5-6 are an **iterative loop** - one team at a time.

> ⚠️ **DO NOT try to migrate everything at once.**

---

# Phase 1: Discovery & Decision

**Is EMU even right for you?** Define your goals first.

**Document your "why":**

- Security: Time to revoke access on termination < 1 hour
- Compliance: Zero audit findings on access management
- Efficiency: 90% reduction in manual account tasks

**The decision questions:**

- Do we have strict compliance requirements? **- EMU**
- Do developers contribute to external OSS? **- Standard GHEC**
- Is our IdP the source of truth for all access? **- EMU**
- Do developers work in client repositories? **- Standard GHEC**
- Is preventing data exfiltration a top priority? **- EMU**

> **You need a new enterprise** - existing GHEC cannot be converted to EMU. This is a migration, not an upgrade.

---

# Phase 2: Pre-Migration Prep

**Clean house before you move.**

**IdP Readiness** - Supported combinations:

| IdP | SAML | OIDC | SCIM |
|-----|------|------|------|
| Microsoft Entra ID | ✅ | ✅ | ✅ |
| Okta | ✅ | - | ✅ |
| PingFederate | ✅ | - | ✅ |

> Okta + Entra ID mixed is **explicitly not supported.**

**Inventory and cleanup checklist:**
- Archive repos with no activity in 12+ months
- Close PRs inactive for 90+ days
- Delete merged/stale branches
- Audit and remove unused OAuth apps, GitHub Apps, webhooks
- **Scan for committed secrets and rotate everything**
- Map teams to IdP groups

---

# Phase 3: Identity & Access Setup

**Users first, then repos.**

**SCIM Lifecycle:**

```
IdP assigns user → SCIM creates account → User authenticates
     → IdP attribute change → SCIM syncs → User updated
          → Unassigned from app → Account suspended
```

**Team Sync - how it works:**
- Connect each GitHub team to an IdP group
- GitHub team membership flows from the IdP group - automatically
- Manual changes in GitHub get **overwritten on next sync**

**Common pitfalls:**
- Don't manually add users to synced teams (they'll be removed)
- One GitHub team = one IdP group (but one IdP group can feed multiple teams)
- Plan naming conventions that work in both systems (e.g., `gh-backend-team`)
- Avoid `rand()` or generated IDs in username expressions - they will change

---

# Phase 4: Security & Compliance

**Lock it down before you move in.**

<div class="columns">

<div>

**Audit Logging**
- Enable enterprise audit log streaming
- Stream to SIEM (Splunk, Sentinel, etc.)
- Every action is captured - all users are managed

**Security Hardening**
- Enforce MFA at the IdP level
- Enable secret scanning + push protection
- Configure Dependabot alerts
- Set up code scanning (GHAS)
- IP allowlists for sensitive orgs

</div>

<div>

**CI/CD & Integrations**
- Recreate Actions secrets in new enterprise
- Migrate GitHub Apps (each app needs reinstall)
- Update PAT references - managed user PATs are scoped to the enterprise
- Validate OIDC token claims for cloud auth
- Test every pipeline before cutover

**Token Strategy**
- PATs: re-issue for `_shortcode` accounts
- Prefer GitHub Apps over PATs everywhere possible

</div>

</div>

---

# Phase 5: Migration Execution

**The iterative loop - one group at a time.**

**Tool: GitHub Enterprise Importer (GEI)**

```bash
# Install
gh extension install github/gh-gei

# Dry run first - always
gh gei migrate-repo \
  --github-source-org SOURCE_ORG \
  --source-repo REPO_NAME \
  --github-target-org TARGET_ORG \
  --target-repo REPO_NAME \
  --dry-run

# Then for real
gh gei migrate-org --github-source-org SOURCE_ORG \
  --github-target-org TARGET_ORG \
  --github-target-enterprise TARGET_ENTERPRISE
```

**After migration:** Reclaim **mannequins** - placeholder identities that hold migrated user activity. Map them to real managed user accounts so history is attributed correctly.

**Keep source active in parallel** until the group is validated and productive.

---

# Phase 6: Validation & Adoption

**You're not done when repos are moved.**

**Go-live checklist:**
- All users can authenticate via IdP
- Team permissions are correct (spot-check cross-team access)
- CI/CD pipelines pass in the new environment
- Secrets and tokens are recreated and working
- Integrations and webhooks are responding
- Audit log streaming is active
- Users know their new username format

**OSS strategy for your developers:**
- Document the two-account workflow clearly
- Consider GitHub Copilot for personal account use
- Set up guidelines for what work goes where
- Some orgs use guest collaborator role for specific external contributions

**Decommission checefully:** Disable source repos only after a successful grace period.

---

# Common Gotchas

Things that will bite you if you're not careful:

- **New enterprise required** - You cannot convert. Budget for parallel environments.
- **User communication is underrated** - New usernames break muscle memory, CI configs, git configs, Slack integrations...
- **Secrets don't migrate** - Every secret, token, and credential must be recreated manually.
- **GitHub Apps need reinstallation** - They don't follow repos during migration.
- **Okta + Entra ID mixed = broken** - Pick one for SSO, one for SCIM. Actually, pick one for both.
- **Don't use `rand()` in SCIM expressions** - Usernames will randomly regenerate.
- **Big bang migrations fail** - Iterate. Pilot team first. Always.
- **Mannequins need manual reclaiming** - Don't skip this or contribution history is lost.

---

# Key Takeaways

1. **EMU is a different beast** - Understand the restrictions before committing
2. **You need a new enterprise** - Plan for a migration, not an upgrade
3. **IdP is the source of truth** - Get it right before touching GitHub
4. **Clean up before you move** - Don't pay to migrate your mess
5. **Test everything** - Dry runs, pilots, validation gates
6. **Communicate early and often** - User experience changes significantly
7. **Plan for the long tail** - Migration is just the beginning

**Timeline reality check:** 12-26 weeks. Some do it in 6-8, some take 18 months. Depends on org size and how much prep work you skip.

> Get help if needed - GitHub Expert Services exists for a reason.

---

<!-- _class: title -->

# Questions?

## Full post at dxrf.com/blog

![w:340](ghec_qr.png)

`#github` `#emu` `#enterprise` `#devops`
