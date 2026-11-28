---
layout: post
title: "GitHub Well-Architected for Financial Services, Part 7: Copilot and AI Agents"
date: 2026-11-05 10:07:00 -0600
category: Blog
tags: [github, well-architected, financial-services, compliance, security, governance, copilot, ai, agents, model-risk]
excerpt: "How to govern GitHub Copilot and its agents at a financial institution: lock policy at the enterprise, allow models by exception, treat every agent as an untrusted contributor, and keep the evidence your examiners will ask for."
permalink: /blog/github-waf-financial-services/copilot-and-agents/
---

*This post is part of the [GitHub Well-Architected for Financial Services](/blog/github-waf-financial-services/) series.*

- [Overview and Compliance Crosswalk](/blog/github-waf-financial-services/)
- [Part 1: Platform Foundation and Data Boundaries](/blog/github-waf-financial-services/platform-foundation/)
- [Part 2: Identity and Access Management](/blog/github-waf-financial-services/identity-and-access/)
- [Part 3: Source Code Management and Change Control](/blog/github-waf-financial-services/change-control/)
- [Part 4: Secrets Protection](/blog/github-waf-financial-services/secrets-protection/)
- [Part 5: Code Scanning and Software Supply Chain](/blog/github-waf-financial-services/code-scanning-supply-chain/)
- [Part 6: CI/CD and GitHub Actions Hardening](/blog/github-waf-financial-services/actions-hardening/)
- **Part 7: Copilot and AI Agents** (you are here)
- [The Leadership Brief](/blog/github-waf-financial-services/leadership-brief/)

> **A friendly note:** This information is meant to be guidance to help navigate a complex topic. Please validate these patterns with your compliance and/or regulatory reporting team(s).

## Leadership brief

- **The risk:** AI agents now write, push, and review code at machine speed. Without guardrails, a single bad policy or poisoned instruction file can touch hundreds of repositories before anyone notices, and the AI vendor becomes an unmanaged third party.
- **Our position:** Copilot sits on top of Parts 1 through 6, never in place of them. Policy is locked at the enterprise, new models and preview features are allowed by exception, and every agent is treated as an untrusted contributor whose work passes the same gates as a human's.
- **The regulatory frame:** We govern Copilot primarily through third-party/ICT risk and SDLC controls. US model risk guidance (SR 26-2) explicitly scopes out generative AI, but OSFI E-23 and the EU AI Act do not let you ignore it.
- **The evidence:** Seat assignments tied to IdP groups, audit log events for every policy change and agent action, agent session streams to the SIEM, budget reports, and training completion records.

---

It's Monday morning. Your SIEM dashboard shows 37 pull requests opened over the weekend by an actor called `Copilot`. One of them edits a workflow file. Another adds a new MCP server to a repository config. The CISO's question is short: "Who approved that?"

If you've done the work in Parts 1 through 6, that question has a boring answer. Rulesets required human review, CODEOWNERS routed the workflow change to the platform team, and no workflow ran until someone approved it. Scanning ran on every push, and the audit log ties each PR to the human who started the session.

If you haven't done that work, stop here and go back. **Platform guardrails come first.** No Copilot policy compensates for public repos full of customer data or a default branch anyone can push to. This part assumes those foundations exist and focuses on governing the AI layer itself.

**A freshness warning.** Copilot changes faster than anything else on GitHub. On October 28, 2026, the separate cloud agent and Copilot Chat policies were replaced by a single **Copilot in the cloud** policy, and sessions can now run on GitHub Actions or in a GitHub-hosted **cloud sandbox** ([Copilot on GitHub.com](https://docs.github.com/en/copilot/concepts/copilot-surfaces/copilot-on-github)). Everything below was checked against the docs on November 5, 2026. Re-verify before implementing, and flag anything marked preview to your risk team.

## The requirements

| ID | Regulation and citation | What it asks for |
|---|---|---|
| US-FRB-SR26-2 | [Federal Reserve SR 26-2](https://www.federalreserve.gov/supervisionreg/srletters/sr2602.htm) | Risk-based model risk management; supersedes SR 11-7. Places generative and agentic AI **out of scope** as "novel and rapidly evolving." |
| US-OCC-2026-13 | [OCC Bulletin 2026-13](https://www.occ.gov/news-issuances/bulletins/2026/bulletin-2026-13.html) | Same guidance for OCC banks; rescinds OCC 2011-12. Same AI scope exclusion. |
| US-NYDFS-AI-2024 | [NYDFS Industry Letter on AI risks (Oct 2024)](https://www.dfs.ny.gov/industry-guidance/industry-letters/il20241016-cyber-risks-ai-and-strategies-combat-related-risks) | Applies Part 500 duties to AI, including third-party AI vendors. |
| US-NYDFS-500.11 | [23 NYCRR 500.11](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | Third-party service provider due diligence and contract protections. |
| US-NYDFS-500.14 | [23 NYCRR 500.14](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500) | Monitoring and annual cybersecurity training. |
| US-3PRM-2023 | [Interagency TPRM Guidance (SR 23-4 / OCC 2023-17)](https://www.federalreserve.gov/supervisionreg/srletters/SR2304.htm) | Third-party lifecycle risk management scaled to criticality. |
| CA-OSFI-E23 | [OSFI Guideline E-23 (2027)](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/guideline-e-23-model-risk-management-2027) | Model risk management that explicitly includes AI/ML. Effective May 1, 2027. |
| CA-OSFI-B10 | [OSFI Guideline B-10](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/third-party-risk-management-guideline) | Third-party risk proportionate to criticality; full accountability stays with the FRFI. |
| CA-AMF-TPRM | [AMF Third-Party Risk Management Guideline](https://lautorite.qc.ca/en/professionals/deposit-institutions-and-trust-companies/guidelines/operational-risk/third-party-risk-management-guideline) | Quebec's third-party risk expectations. Takes effect Apr 1, 2027. |
| BR-CMN-4893 | [CMN Resolution 4,893/2021 (Brazil)](https://www.bcb.gov.br/content/about/legislation_norms_docs/CMN_Resolution_No_4,893_2021.pdf) | Requirements for contracting cloud and data processing services, including overseas providers. |
| EU-AIACT-4 | [EU AI Act Art. 4](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689) | Take measures to support AI literacy of staff using AI systems. Applies since 2 Feb 2025; reworded by the [2026 Digital Omnibus](https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng) so it no longer requires guaranteeing a specific literacy level. |
| EU-AIACT-26 | [EU AI Act Art. 26](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689) | High-risk deployer duties (human oversight, monitoring, logs). Deferred to 2 Dec 2027 / 2 Aug 2028 by [Reg. (EU) 2026/1744](https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng). |
| EU-DORA-28-30 | [DORA Arts. 28-30](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_28) | ICT third-party risk: accountability, concentration risk, contract terms. |
| EU-DORA-RTS-LOGGING | [Reg. (EU) 2024/1774 Art. 12](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774) | Logging within the ICT risk framework. |
| EU-GDPR-44 | [GDPR Art. 44](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679) | Conditions for transferring personal data outside the EU. |
| INT-PCI-6.2 | [PCI DSS v4.0.1 Req. 6.2](https://www.pcisecuritystandards.org/document_library/) | Secure coding, developer training, and code review before release. |
| INT-PCI-12.8 | [PCI DSS v4.0.1 Req. 12.8](https://www.pcisecuritystandards.org/document_library/) | Manage and monitor third-party service providers. |

### Where Copilot fits in your risk framework

No regulation says "govern your AI coding assistant like this," so decide your framing and write it down.

- **US:** SR 26-2 and OCC 2026-13 put generative and agentic AI **out of scope**. That doesn't make Copilot ungoverned; it means you shouldn't force it through validation built for credit models. Have your second line document that call.
- **Canada:** OSFI E-23 explicitly includes AI/ML from May 1, 2027. Expect to inventory and risk-rate Copilot.
- **EU:** A coding assistant is unlikely to be Annex III high-risk, but Art. 4 AI literacy applies to you now. (The 2026 Digital Omnibus softened it to "take measures to support" literacy; it's still an obligation, so keep the training records.)
- **Everywhere:** GitHub and its model providers are **third parties processing your source code**. That's where examiners start.

Our position: **govern Copilot as a third-party service plus an SDLC input.** The vendor goes through TPRM. The output goes through the same gates as human code. Model governance (which models, which providers, which data terms) bridges the two.

## Deployment model differences

| Topic | GHEC (personal accounts) | GHEC with EMU | GHEC with data residency (GHE.com) | GHES |
|---|---|---|---|---|
| **Licensing** | Business/Enterprise seats. Users may also hold personal plans, which are cancelled once they receive a Business or Enterprise seat ([policies](https://docs.github.com/en/copilot/concepts/enterprise/policies)). | Managed users [cannot sign up for Copilot Pro or Free](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/understanding-iam-for-enterprises/abilities-and-restrictions-of-managed-user-accounts); seats only via your enterprise. | Same as EMU. | [Not hosted on GHES](https://docs.github.com/en/enterprise-server@3.22/copilot/copilot-on-ghes/about-copilot-on-ghes). Licenses and policies live on your GitHub.com or GHE.com enterprise. |
| **IdP-driven seats** | Enterprise teams (manual membership). | Enterprise teams [synced to IdP groups](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-users-in-your-enterprise/create-enterprise-teams) via SCIM. | Same as EMU. | Via the cloud enterprise account. |
| **Model data boundary** | Global model endpoints. | Global model endpoints. | Optional **Restrict Copilot to data residency compliant models** policy (US and EU regions; +10% AI credits) ([docs](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/github-copilot-with-data-residency)). | Air-gapped Copilot CLI with your own model provider (**technical preview**). |
| **Agent event streaming** | Not available. | Agent session event streaming (**public preview**). | Same as EMU. | Not applicable. |
| **Cloud agents** | Available. | Available, except in managed users' personal repos. | Available. | Not available against GHES repositories. |

The training-data line matters most for personal-account enterprises: per [model hosting](https://docs.github.com/en/copilot/reference/ai-models/model-hosting), GitHub doesn't train on Business or Enterprise data but **may** use interaction data from individual plans. Make sure everyone touching your code uses an enterprise seat.

## Licensing and seat assignment

**What we do:** Every Copilot user gets a seat through an **IdP-managed group**. Nobody gets a seat by asking an org owner nicely. We pick the plan deliberately and document why.

**Why:** Least privilege and joiner/mover/leaver discipline apply to AI tools too (US-NYDFS-AI-2024, US-3PRM-2023). A seat also determines which policies govern the user. The [WAF adoption guidance](https://learn.github.com/well-architected/library/productivity/recommendations/adopting-copilot-at-scale/) favors team-based assignment for better metrics granularity, too.

**How:** Know your options first ([Plans for GitHub Copilot](https://docs.github.com/en/copilot/get-started/plans#organization-and-enterprise-plans)):

| Plan | Seat price | Included AI credits | Notable difference |
|---|---|---|---|
| Copilot Business | $19/user/month | 1,900 per user, pooled | Baseline organizational plan |
| Copilot Enterprise | $39/user/month | 3,900 per user, pooled | More credits plus priority access to new models and features |
| Copilot access | $0 for GHEC-licensed users ($10 standalone) | None; metered from first use | Same features as Enterprise; cannot coexist with Business/Enterprise in one enterprise |

The governance features we care about (policies, audit logs, content exclusion, org custom instructions, code review) appear in both Business and Enterprise today. The choice is about **credits and early access**, not controls.

Then wire assignment to your IdP:

1. Create an enterprise team per access tier (for example `copilot-standard`, `copilot-agents-pilot`).
2. On EMU or GHE.com, [sync each team to an IdP group](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/provisioning-user-accounts-with-scim/managing-team-memberships-with-identity-provider-groups). Sync stops above 5,000 members.
3. [Assign seats to the enterprise team](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/manage-access/grant-access) (Business or Copilot access). For Copilot Enterprise, enable it per org and have org owners assign seats to IdP-synced org teams.
4. Make **training completion a prerequisite** for group membership: LMS feeds IdP, IdP feeds GitHub.

**Verify:** Monthly, export `gh api /enterprises/{enterprise}/copilot/billing/seats --paginate` ([REST docs](https://docs.github.com/en/rest/copilot/copilot-user-management)) and reconcile against the IdP group. Any untraceable seat is a finding. The `copilot.cfb_seat_assignment_created` and `copilot.cfb_seat_assignment_unassigned` events show who changed what ([audit log events](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/audit-log-events-for-your-enterprise)).

## Policy hierarchy: lock it at the enterprise

**What we do:** Every policy with compliance impact is set at the enterprise as **Enabled** or **Disabled**, never "Let organizations decide." Day-to-day AI administration goes to an **AI managers** team, not more enterprise owners.

**Why:** Delegation has a sharp edge. When a user gets Copilot from multiple orgs with conflicting settings, the **least restrictive** policy usually wins ([Copilot policies](https://docs.github.com/en/copilot/concepts/enterprise/policies)). One permissive org quietly loosens controls for everyone with a seat there. The [WAF governing agents guidance](https://learn.github.com/well-architected/library/governance/recommendations/governing-agents/) recommends this hybrid: enterprise-enforced non-negotiables, org autonomy inside them.

**How:**

- Configure policies under **Enterprise > AI controls**, which has separate Agents, Copilot, and MCP pages ([Managing policies for your enterprise](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/manage-enterprise-policies)).
- Set **Policies for enterprise-assigned users** explicitly, since "Let organizations decide" doesn't cover users who get seats directly from the enterprise.
- Create an [AI managers custom role](https://docs.github.com/en/copilot/tutorials/roll-out-at-scale/govern-at-scale/establish-ai-managers) with **Manage enterprise AI controls**, **Read enterprise audit logs**, and **View Enterprise Copilot Metrics**. Enterprise custom roles are **public preview**. AI managers can't touch Copilot access management or billing, which is the separation of duties you want.

**Verify:** Stream and alert on `copilot.cfb_enterprise_settings_changed` and `copilot.cfb_org_settings_changed`. Quarterly, review who holds enterprise owner or the AI managers role. GitHub's own docs call out **policy drift** as a risk for strict-compliance enterprises.

## Feature and model policies: allow by exception

**What we do:** New features and new models are **off until reviewed**. We maintain an explicit model allowlist and a documented review for each addition.

**Why:** "Default on" is great for productivity and terrible for third-party risk. Each model may come from a different provider with different data terms (US-3PRM-2023, CA-OSFI-B10, EU-DORA-28-30), and under CA-OSFI-E23 a model change is one you should be able to explain. The [governing agents](https://learn.github.com/well-architected/library/governance/recommendations/governing-agents/) checklist also says to enable new models only after review.

**How:** Two enterprise policies control what happens to things you haven't configured ([About default availability](https://docs.github.com/en/copilot/concepts/enterprise/default-availability)):

| Policy | Our setting | Effect |
|---|---|---|
| Default policy for new features and clients | **Disabled everywhere** | Unconfigured GA features stay off; orgs can't enable them |
| Default availability for released models | **Disabled** | New GA models stay off until you configure them |

Some models stay disabled **regardless** of those settings: pre-GA models, open weight models, and models outside GitHub's data retention agreement. Keep it that way unless risk signs off. For example, the [model hosting](https://docs.github.com/en/copilot/reference/ai-models/model-hosting) page notes one Anthropic model family retains prompts and outputs by default for safety classifiers. That's exactly what TPRM review exists to catch.

Leave the org-level **Opt in to preview features** setting off except in a designated sandbox org ([organization policies](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-organization/manage-policies)). Previews "may be changed or discontinued at any time," which is hard to square with a production control.

Then build the allowlist in **Configure models** ([managing model availability](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/manage-availability-of-default-models)): approved models **Enabled**, everything else **Disabled**, and targeted model rules for orgs that need more. Model access by enterprise team is an opt-in **preview**.

The "Suggestions matching public code" policy still exists. Set it per legal guidance, but don't present it to auditors as a security control.

**Verify:** Keep a model register (model, provider, data commitment, approver, date). Diff it monthly against the Configure models page. Settings changes appear as `copilot.cfb_enterprise_settings_changed`.

## Data handling, retention, and the vendor file

**What we do:** Treat GitHub and its model providers as **critical ICT third parties** with a complete due diligence file before broad rollout.

**Why:** This is the core of US-NYDFS-500.11, US-3PRM-2023, CA-OSFI-B10, CA-AMF-TPRM, EU-DORA-28-30, BR-CMN-4893, and INT-PCI-12.8. The NYDFS AI letter (US-NYDFS-AI-2024) specifically calls out third-party AI vendors.

**How:** Build the file from primary sources:

- **Training:** "GitHub does not use Copilot Business or Copilot Enterprise customer data to train AI models" ([model hosting](https://docs.github.com/en/copilot/reference/ai-models/model-hosting)). The same page lists each provider's retention terms.
- **Session data:** Actions-based cloud sessions are **shared by default** with repo readers; sandbox sessions aren't. Syncing local CLI and app sessions depends on the **Store local sessions in the Cloud** policy ([session data](https://docs.github.com/en/copilot/concepts/security-governance-and-network-settings/session-data)). Set it deliberately.
- **Region:** On GHE.com, enable **Restrict Copilot to data residency compliant models** if your transfer analysis (EU-GDPR-44) requires in-region inference.
- **Assurance:** Request SOC reports, ISO/IEC 42001, and the PCI DSS attestation and shared responsibility matrix (listed for GitHub Enterprise Cloud and Copilot at the time of research) from the [GitHub Copilot Trust Center](https://copilot.github.trust.page/).
- **Model documentation:** Attach the [Copilot agents application card](https://docs.github.com/en/copilot/responsible-use/agents) (intended uses, limitations, evaluations) to your AI inventory entry.

**Verify:** Annual TPRM review with refreshed reports. Track provider data terms as part of each model approval.

## Content exclusion: a guardrail, not DLP

**What we do:** Use [content exclusion](https://docs.github.com/en/copilot/concepts/security-governance-and-network-settings/content-exclusion) to keep obviously sensitive paths (key material, fixtures with production-like data, regulated config) out of Copilot's context. We never describe it as data loss prevention.

**Why:** It's defense in depth that reduces accidental exposure (EU-GDPR-44, US-NYDFS-AI-2024). GitHub's own docs are blunt about the limits:

- "Content exclusion is not a filesystem security boundary." It's "not guaranteed to be respected by third-party MCP servers or clients."
- Copilot may still use semantic information from excluded files that the IDE supplies indirectly (types, hover definitions, build config).
- In IDE, CLI, and app agents, it checks identifiable file paths but "might not detect indirect file access."
- It doesn't apply to symlinks or repositories on remote filesystems. Some clients lack chat support (Xcode and Eclipse at the time of writing).

**How:** Set enterprise-level rules for paths that are sensitive everywhere, and org or repo rules for the rest ([excluding content](https://docs.github.com/en/copilot/how-tos/configure-content-exclusion/exclude-content-from-copilot)). The real controls remain [Part 1](/blog/github-waf-financial-services/platform-foundation/) and [Part 4](/blog/github-waf-financial-services/secrets-protection/): keep customer data and secrets out of repositories.

**Verify:** Alert on `copilot.content_exclusion_changed` ([reviewing changes](https://docs.github.com/en/copilot/how-tos/configure-content-exclusion/review-changes)). Spot-test exclusions in each supported IDE after changes.

## Governing Copilot in the cloud and its agents

This is where the risk profile genuinely changes. An agent with write access, network access, and a prompt built from issue text is a new kind of contributor.

### Who can use it

**What we do:** Enable **Copilot in the cloud** for selected organizations only, pilot first, and keep **third-party agents** (Claude, Codex) disabled until reviewed.

**Why:** Change management and third-party risk (US-3PRM-2023, EU-DORA-28-30). [Third-party coding agents](https://docs.github.com/en/copilot/concepts/agent-capabilities/about-agents/about-third-party-coding-agents) are **public preview** and add AI providers to your supply chain.

**How:** In **AI controls > Copilot > Configure features & clients**, choose **Enabled for selected organizations** ([managing Copilot in the cloud](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/manage-agents/manage-copilot-in-the-cloud)). This also enables cloud sandboxes, which can't be disabled separately. Only users with write access can trigger the agent.

### Where it runs: sandbox vs. Actions

Sessions run in a **cloud sandbox** (the default where users can choose) or on **GitHub Actions** ([about cloud sandboxes](https://docs.github.com/en/copilot/concepts/security-governance-and-network-settings/about-cloud-sandboxes)). Assigning an issue to Copilot or mentioning `@Copilot` on a PR still runs on Actions. The governance difference is real:

| Control | Cloud sandbox | GitHub Actions |
|---|---|---|
| Firewall allowlists | Honored | Honored |
| `copilot-setup-steps.yml`, OIDC, self-hosted runners | No | Yes |
| Managed settings `permissions` and MCP allow/deny | Supported | **Not supported** |
| Multi-repo sessions | Yes | No |
| Session visibility | Unshared by default | Shared with repo readers |

Users can also bring personal instructions, skills, and custom agents into sandboxes through a **dotfiles** repo. Address that in your AUP.

### Network: firewall on, enforced at the org

**What we do:** Enforce the [agent firewall](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-the-firewall) at the org level and disable repository custom rules. Internal registries go on the org allowlist.

**Why:** Exfiltration prevention (EU-DORA-28-30, US-NYDFS-AI-2024). It's a layer, not a perimeter: the firewall covers only processes the agent starts via its Bash tool, not MCP server processes or setup steps, and the docs warn "sophisticated attacks may bypass the firewall."

**How:** **Org settings > Copilot > Internet access**: Enable firewall = **Enabled**; Allow repository custom rules = **Disabled**. Code review has its own section on the same page. If you proxy agent traffic, consider disabling the recommended allowlist and allowing only your artifact mirror.

### Branches, rulesets, and human review

**What we do:** Rely on the built-in limits, then add our own. Agents never approve, never merge, and never get ruleset exemptions.

**Why:** Segregation of duties (INT-PCI-6.2, US-NYDFS-AI-2024) and the human-oversight principle behind EU-AIACT-26. The WAF calls exempting agent changes from existing checks an explicit anti-pattern.

**How:** The [risks and mitigations](https://docs.github.com/en/copilot/concepts/security-governance-and-network-settings/risks-and-mitigations) page documents the baseline:

- The agent pushes only to its own `copilot/` branch (or the PR branch it was invoked on) and obeys rulesets and branch protection.
- It can't mark PRs ready for review, approve, or merge, and the person who requested the PR **can't approve it**.
- PRs not attributed to a person need **one extra approval**, on by default in [rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets). Leave it on.
- Commits are signed, co-authored by the requester, and link to session logs.

Layer your [Part 3](/blog/github-waf-financial-services/change-control/) rulesets on top. Then protect agent configuration with CODEOWNERS plus **Require review from Code Owners**, as GitHub's [guardrails tutorial](https://docs.github.com/en/copilot/tutorials/cloud-agent/build-guardrails) recommends. Paths come from the [customization cheat sheet](https://docs.github.com/en/copilot/reference/customization-cheat-sheet) and WAF:

```text
# CODEOWNERS: agent configuration is code. Treat it that way.
/.github/copilot-instructions.md   @your-org/ai-platform
/.github/instructions/             @your-org/ai-platform
/.github/agents/                   @your-org/ai-platform
/.github/skills/                   @your-org/ai-platform
/.github/hooks/                    @your-org/ai-platform
/.github/prompts/                  @your-org/ai-platform
/.github/copilot/                  @your-org/ai-platform
/.github/workflows/                @your-org/platform-security
AGENTS.md                          @your-org/ai-platform
.mcp.json                          @your-org/ai-platform
```

### CI on agent pull requests

**What we do:** Keep **Require approval for workflow runs** on. A human inspects the diff (especially `.github/workflows/`) before any workflow runs on an agent branch.

**Why:** GitHub warns that turning this off "may allow unreviewed code written by Copilot to gain write access to your repository or access your GitHub Actions secrets" ([agent settings](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/configuring-agent-settings)). That's a [Part 6](/blog/github-waf-financial-services/actions-hardening/) risk in an AI costume.

**How:** Repo admins can disable this setting, so tell them it's off-limits and monitor it. Once approved, agent PRs face the same required checks, code scanning, and secret scanning as everyone else.

### The agent is an untrusted contributor

The agent's prompt includes issue bodies, PR comments, and fetched content: classic **prompt injection** territory. GitHub filters hidden characters (such as HTML comments) and ignores comments from users without write access. Design as if injection will eventually succeed anyway:

- **Secrets:** Grant only the **Agents secrets** a task needs. Everything else stays in Actions secrets, which Copilot can't read.
- **Runners:** GitHub-hosted or ephemeral self-hosted, pinned org-wide via a [runner label](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-organization/configure-runner-for-coding-agent).
- **Setup token:** Minimal `permissions` in `copilot-setup-steps.yml`. This doesn't change the agent's own token.
- **Automations:** For event-triggered automations, limit tools and write scope to "Only this issue," and keep untrusted-user events ignored (the default).

**Verify:** Quarterly, sample repos for firewall state, workflow approval, and CODEOWNERS coverage. Continuously, alert when `actor_is_agent` pushes touch workflow or agent config files, per the WAF's SIEM signal table.

## MCP servers: allowlist via managed settings

**What we do:** Allow MCP servers by exception using `allowedMcpServers` in the enterprise's `managed-settings.json`. We don't rely on the MCP registry restriction.

**Why:** Every MCP server is a new data path and often a new third party (EU-DORA-28-30, US-NYDFS-500.11). GitHub now labels the registry-based restriction **public preview** and "not the recommended method." The managed settings allowlist is the GA path ([Configuring an MCP server allowlist](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-mcp-usage/configure-enterprise-allowlist)).

**How:** Store the file at `copilot/managed-settings.json` in your enterprise's `.github-private` repo, internal visibility, edits restricted ([getting started with managed settings](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/use-managed-settings/get-started)). A starting point using documented keys:

```json
{
  "permissions": {
    "disableBypassPermissionsMode": "disable",
    "deny": ["Read(~/.ssh/**)", "Shell(rm -rf *)"],
    "ask": ["Shell(git push *)"]
  },
  "allowedMcpServers": [
    { "serverUrl": "https://api.githubcopilot.com/*" },
    { "serverUrl": "https://mcp.internal.example-bank.com/*" }
  ],
  "deniedMcpServers": [
    { "serverCommand": ["npx", "-y", "@modelcontextprotocol/server-filesystem", "/"] }
  ],
  "telemetry": {
    "enabled": true,
    "endpoint": "https://otel-collector.example-bank.com",
    "protocol": "http/protobuf",
    "capture": { "identity": true }
  }
}
```

Defining `allowedMcpServers` also blocks Copilot connectors that don't match, which is what you want. Know the gaps, per the [managed settings reference](https://docs.github.com/en/copilot/reference/enterprise-administrators/enterprise-managed-settings):

- MCP allow/deny lists **don't apply** to Actions-based cloud sessions or to `mcp-servers` defined in custom agent profiles.
- For those, the controls are CODEOWNERS on agent and MCP config, plus the firewall (block the domains an unapproved server needs).
- Repository MCP settings on GitHub apply to **both** the cloud agent and code review.

**Verify:** The managed settings file is version-controlled, so the Git history is your change evidence. Review it quarterly against your approved MCP register. Alert on `mcp_registry.*` audit events if you still use the registry for discovery.

## Custom agents, instructions, and skills

**What we do:** Treat instruction files, custom agents, and skills as **production code** with owners, review, and testing. Enterprise custom agents live in `.github-private`, protected by the AI controls ruleset.

**Why:** One instruction change alters agent behavior across many sessions and repos. The WAF's [shared knowledge](https://learn.github.com/well-architected/library/governance/recommendations/agentic-shared-knowledge/) and [agentic engineering system](https://learn.github.com/well-architected/library/governance/recommendations/agentic-engineering-system-on-github/) pages explain how stale or overbroad context degrades output. It's also SDLC hygiene (INT-PCI-6.2).

**How:**

- [Prepare for custom agents](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/manage-agents/prepare-for-custom-agents) and click **Create ruleset** under "Protect agent files using rulesets." It also blocks org owners from editing org-level agents unless you narrow its target.
- Keep **organization custom instructions** short and limited to non-negotiables; push detail down to repo and path-specific files.
- Test new agents in a sandbox repo before enterprise release.
- If you extend agent context via the GitHub MCP server (the WAF's [custom agents context](https://learn.github.com/well-architected/library/architecture/recommendations/expanding-enterprise-custom-agents-context/) pattern), scope that credential narrowly and govern it under [Part 4](/blog/github-waf-financial-services/secrets-protection/).

**Verify:** Ruleset bypass events and PR history on `.github-private`; periodic owner review of enterprise agents.

## Copilot code review: advisory, never the approver

**What we do:** Run automatic Copilot code review on high-risk repositories. Keep **Allow Copilot to approve pull requests** set to **Disabled everywhere**. Copilot's review is a second opinion, never one of the required approvals.

**Why:** Segregation of duties (INT-PCI-6.2). Two documented behaviors make this non-negotiable ([Copilot code review](https://docs.github.com/en/copilot/concepts/agent-capabilities/agent-powered-workflows-and-operations/code-review)): when enabled, Copilot approvals satisfy required-approval rules "the same way a teammate's approval would," and Copilot reads instructions and skills **from the PR's head branch**, so a PR can change the instructions used to review itself.

**How:** Create an enterprise branch ruleset targeting high-risk repos (custom properties help) with **Automatically request Copilot code review** ([configuring code review](https://docs.github.com/en/copilot/how-tos/copilot-on-github/set-up-copilot/configure-code-review)). Set a default and maximum effort level, and enable **Block reviews requested with an external Copilot license**. Excluded files aren't reviewed.

**Verify:** Quarterly, confirm the approval policy still reads Disabled everywhere.

## AI credits and budgets

**What we do:** Configure budgets **before** broad rollout, with alerts routed to accountable owners. Protect security tooling from being starved by chat usage.

**Why:** Cost is an operational risk, and a hard stop at the wrong scope can halt critical work. The WAF's [managing AI credits](https://learn.github.com/well-architected/library/governance/recommendations/managing-ai-credits/) guidance favors alerts over hard stops at the enterprise level.

**How:**

- Business and Enterprise credits are **pooled**, and additional usage is **enabled by default** ([billing](https://docs.github.com/en/copilot/concepts/billing-and-usage/organizations-and-enterprises/billing)). Decide explicitly whether to allow it.
- Use cost centers per business unit and user-level budgets for fair access.
- A **Bundled AI credits budget** with "Stop usage" can block AI Scan and agentic autofix when other products exhaust it ([budgets](https://docs.github.com/en/billing/how-tos/set-up-budgets)). Give Code Security its own SKU-level budget so a chat-heavy month doesn't switch off a security control.
- Inline suggestions don't consume credits, so a budget stop degrades features rather than removing Copilot entirely.

**Verify:** Monthly usage report review against budgets; document threshold responses.

## Usage metrics and audit log evidence

**What we do:** Stream everything we can to the SIEM, retain it per your log policy, and correlate agent activity to humans.

**Why:** Audit trails and monitoring (EU-DORA-RTS-LOGGING, US-NYDFS-500.14, EU-AIACT-26's log retention theme). The [agentic governance taxonomy](https://learn.github.com/well-architected/library/governance/recommendations/agentic-governance-taxonomy/) frames audit and provenance as what makes governance "verifiable rather than aspirational."

**How:**

| Evidence source | What it gives you | Notes |
|---|---|---|
| [Agent audit log fields](https://docs.github.com/en/copilot/reference/enterprise-administrators/agentic-audit-log-events) | `actor_is_agent`, `agent_session_id`, `user` (the human) | `actor:Copilot` filter covers 180 days in the UI |
| [Audit log streaming](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/streaming-the-audit-log-for-your-enterprise) | Policy, seat, and repo events to your SIEM | Agent session event streaming is **public preview**, EMU and GHE.com only |
| Copilot usage records streaming/API | Request and response bodies | **Public preview**. Treat the destination as holding source code. |
| [Usage metrics API](https://docs.github.com/en/rest/copilot/copilot-usage-metrics) | Adoption, per-user and per-repo activity | Up to 1 year of history |
| OpenTelemetry via managed settings | Client-side session telemetry | Start with `identity` only; other capture classes can include code and prompts ([monitoring agentic activity](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/manage-agents/monitor-agentic-activity)) |

Pull a quick sample for your evidence binder:

```bash
gh api "/enterprises/YOUR-ENTERPRISE/audit-log?phrase=actor:Copilot&per_page=100" \
  --jq '.[] | {action, user, agent_session_id, created_at: .["@timestamp"]}'
```

The WAF notes that session transcripts are UI-only and can't be exported, so schedule **spot checks** in high-risk repos. For leadership reporting, pair the [usage metrics dashboard](https://docs.github.com/en/copilot/concepts/billing-and-usage/copilot-usage-metrics/copilot-metrics) with the WAF's [measuring GenAI impact](https://learn.github.com/well-architected/library/scenarios/measuring-genai-impact/) phases.

**Verify:** Monthly, confirm stream health and trace one known agent session end to end in the SIEM. Quarterly, run and record transcript spot checks.

## Acceptable use policy and training

**What we do:** No seat without completed training and an acknowledged AI acceptable use policy (AUP).

**Why:** EU-AIACT-4 (AI literacy) already applies. US-NYDFS-500.14 and INT-PCI-6.2 expect training. The NYDFS AI letter (US-NYDFS-AI-2024) points to AI-specific social engineering. The WAF's [adoption guidance](https://learn.github.com/well-architected/library/productivity/recommendations/adopting-copilot-at-scale/) adds the human side: enablement, champions, and feedback loops.

**How:** Your AUP should cover, at minimum:

- Only enterprise-issued seats on company code; no personal plans.
- No customer data, credentials, or production extracts in prompts.
- The requester is accountable for agent output and is the first reviewer.
- Which MCP servers, agents, and models are approved, and how to request more.
- Dotfiles, personal instructions, and personal skills: what's allowed.
- Reporting suspected prompt injection or unexpected agent behavior.

**Verify:** LMS completion records reconciled with the IdP group that grants seats. Annual AUP re-attestation.

## Control matrix

| Control | Requirement IDs | GitHub feature | Evidence | Cadence |
|---|---|---|---|---|
| IdP-driven seat assignment | US-NYDFS-AI-2024, US-3PRM-2023 | Enterprise teams synced to IdP groups | Seat export vs. IdP group; `copilot.cfb_seat_*` events | Monthly |
| Enterprise-locked policies | US-NYDFS-AI-2024, CA-OSFI-E23 | AI controls; AI managers role (preview) | `copilot.cfb_*_settings_changed` alerts; role review | Continuous / quarterly |
| Allow-by-exception features and models | US-3PRM-2023, CA-OSFI-B10, CA-OSFI-E23, EU-DORA-28-30 | Default availability policies; Configure models | Model register; settings diff | Monthly |
| Vendor due diligence and data boundary | US-NYDFS-500.11, US-3PRM-2023, CA-OSFI-B10, CA-AMF-TPRM, BR-CMN-4893, EU-DORA-28-30, EU-GDPR-44, INT-PCI-12.8 | Trust Center; model hosting docs; data residency model policy (GHE.com) | TPRM file; SOC/ISO reports; policy state | Annual / quarterly |
| Content exclusion | US-NYDFS-AI-2024, EU-GDPR-44 | Enterprise/org/repo exclusions | `copilot.content_exclusion_changed` events | Continuous |
| Agent enablement and firewall | US-3PRM-2023, EU-DORA-28-30, US-NYDFS-AI-2024 | Copilot in the cloud for selected orgs; third-party agents off; org-enforced firewall | Policy state; org settings sample | Quarterly |
| Human review of agent work | INT-PCI-6.2, EU-AIACT-26 | Rulesets, CODEOWNERS, extra approval for unattributed PRs, workflow approval, Copilot approvals disabled | Ruleset export; PR approval history; settings sample | Quarterly |
| MCP and agent config governance | US-NYDFS-500.11, EU-DORA-28-30, INT-PCI-6.2 | `managed-settings.json` allow/deny; `.github-private` ruleset | Git history; bypass events | Quarterly |
| Budgets and alerts | US-3PRM-2023 | Budgets, cost centers, SKU budgets | Usage reports; alert log | Monthly |
| Agent audit trail | EU-DORA-RTS-LOGGING, US-NYDFS-500.14, EU-AIACT-26 | Audit log streaming; agent fields | SIEM queries; transcript spot checks | Continuous / quarterly |
| Training and AUP | EU-AIACT-4, US-NYDFS-500.14, INT-PCI-6.2 | IdP group gated on LMS | Completion records; attestations | Annual |

## Summary and key takeaways

Net-net: Copilot governance is mostly **platform governance with new nouns**. Agents are contributors, instruction files are code, models are vendors, and MCP servers are integrations. If Parts 1 through 6 are solid, this part extends what already works.

Your checklist:

- [ ] Confirm Parts 1-6 controls apply to agent PRs with no exemptions
- [ ] Assign seats only through IdP-synced teams, gated on training
- [ ] Lock compliance-relevant policies at the enterprise; disable both default availability policies
- [ ] Maintain a model register tied to provider data terms, and a complete TPRM file
- [ ] Use content exclusion as defense in depth, and say so in writing
- [ ] Enable Copilot in the cloud for selected orgs; keep third-party agents off until reviewed
- [ ] Enforce the agent firewall, workflow approval, and CODEOWNERS on agent and MCP config
- [ ] Deploy `managed-settings.json` with an MCP allowlist; document the Actions-session gap
- [ ] Keep Copilot approvals Disabled everywhere
- [ ] Configure budgets, including a separate Code Security budget
- [ ] Stream audit logs and schedule transcript spot checks

Previous: [Part 6: CI/CD and GitHub Actions Hardening](/blog/github-waf-financial-services/actions-hardening/). Next: [The Leadership Brief](/blog/github-waf-financial-services/leadership-brief/), which rolls the whole series up for CIOs, CISOs, and senior leaders.

## References

### GitHub Well-Architected

- [Governing agents in GitHub Enterprise](https://learn.github.com/well-architected/library/governance/recommendations/governing-agents/)
- [Governing agentic workflows with gh-aw and APM](https://learn.github.com/well-architected/library/governance/recommendations/governing-agentic-workflows/)
- [Agentic governance taxonomy](https://learn.github.com/well-architected/library/governance/recommendations/agentic-governance-taxonomy/)
- [Building an agentic engineering system on GitHub](https://learn.github.com/well-architected/library/governance/recommendations/agentic-engineering-system-on-github/)
- [Shared knowledge for agentic engineering](https://learn.github.com/well-architected/library/governance/recommendations/agentic-shared-knowledge/)
- [Managing AI credits](https://learn.github.com/well-architected/library/governance/recommendations/managing-ai-credits/)
- [Adopting GitHub Copilot at scale](https://learn.github.com/well-architected/library/productivity/recommendations/adopting-copilot-at-scale/)
- [Measuring impact for GenAI adoption](https://learn.github.com/well-architected/library/scenarios/measuring-genai-impact/)
- [Expanding the context of enterprise custom agents](https://learn.github.com/well-architected/library/architecture/recommendations/expanding-enterprise-custom-agents-context/)

For teams running AI inside Actions workflows rather than through Copilot in the cloud, the [gh-aw and APM guidance](https://learn.github.com/well-architected/library/governance/recommendations/governing-agentic-workflows/) describes a capability-separation pattern: the LLM holds no write permissions, and a deterministic step acts only on validated output.

### GitHub Docs

- [Plans for GitHub Copilot](https://docs.github.com/en/copilot/get-started/plans)
- [GitHub Copilot policies for enterprises and organizations](https://docs.github.com/en/copilot/concepts/enterprise/policies)
- [About default availability of Copilot features and models](https://docs.github.com/en/copilot/concepts/enterprise/default-availability)
- [Managing policies and features for Copilot in your enterprise](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/manage-enterprise-policies)
- [Managing policies and features for Copilot in your organization](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-organization/manage-policies)
- [Managing availability of models in your enterprise](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/manage-availability-of-default-models)
- [Giving users GitHub Copilot in your enterprise](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/manage-access/grant-access)
- [Creating enterprise teams](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-users-in-your-enterprise/create-enterprise-teams)
- [Managing team memberships with identity provider groups](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/provisioning-user-accounts-with-scim/managing-team-memberships-with-identity-provider-groups)
- [Abilities and restrictions of managed user accounts](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/understanding-iam-for-enterprises/abilities-and-restrictions-of-managed-user-accounts)
- [Establishing AI managers in your enterprise](https://docs.github.com/en/copilot/tutorials/roll-out-at-scale/govern-at-scale/establish-ai-managers)
- [Hosting of models for GitHub Copilot](https://docs.github.com/en/copilot/reference/ai-models/model-hosting)
- [About GitHub Copilot session data](https://docs.github.com/en/copilot/concepts/security-governance-and-network-settings/session-data)
- [GitHub Copilot with data residency](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/github-copilot-with-data-residency)
- [About GitHub Copilot on GitHub Enterprise Server](https://docs.github.com/en/enterprise-server@3.22/copilot/copilot-on-ghes/about-copilot-on-ghes)
- [Content exclusion for GitHub Copilot](https://docs.github.com/en/copilot/concepts/security-governance-and-network-settings/content-exclusion)
- [Excluding content from GitHub Copilot](https://docs.github.com/en/copilot/how-tos/configure-content-exclusion/exclude-content-from-copilot)
- [Reviewing changes to content exclusions](https://docs.github.com/en/copilot/how-tos/configure-content-exclusion/review-changes)
- [GitHub Copilot on GitHub.com and GitHub Mobile](https://docs.github.com/en/copilot/concepts/copilot-surfaces/copilot-on-github)
- [Managing GitHub Copilot in the cloud for your enterprise or organization](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/manage-agents/manage-copilot-in-the-cloud)
- [About cloud sandboxes for GitHub Copilot](https://docs.github.com/en/copilot/concepts/security-governance-and-network-settings/about-cloud-sandboxes)
- [Risks and mitigations for GitHub Copilot cloud agent](https://docs.github.com/en/copilot/concepts/security-governance-and-network-settings/risks-and-mitigations)
- [Building a secure cloud environment for agents in your enterprise](https://docs.github.com/en/copilot/tutorials/cloud-agent/build-guardrails)
- [Customizing or disabling the firewall for GitHub Copilot](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-the-firewall)
- [Configuring settings for GitHub Copilot in the cloud](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/configuring-agent-settings)
- [Configuring runners for Copilot cloud agent](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-organization/configure-runner-for-coding-agent)
- [Available rules for rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
- [Third-party coding agents](https://docs.github.com/en/copilot/concepts/agent-capabilities/about-agents/about-third-party-coding-agents)
- [Copilot customization cheat sheet](https://docs.github.com/en/copilot/reference/customization-cheat-sheet)
- [Preparing to use custom agents in your enterprise](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/manage-agents/prepare-for-custom-agents)
- [Configuring an MCP server allowlist for your enterprise](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-mcp-usage/configure-enterprise-allowlist)
- [Restrict MCP server access to a custom registry](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-mcp-usage/restrict-based-on-registry)
- [Getting started with enterprise-managed settings](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/use-managed-settings/get-started)
- [Enterprise managed settings reference](https://docs.github.com/en/copilot/reference/enterprise-administrators/enterprise-managed-settings)
- [Supported surfaces for GitHub Copilot policies](https://docs.github.com/en/copilot/reference/supported-surfaces-for-policies)
- [GitHub Copilot code review](https://docs.github.com/en/copilot/concepts/agent-capabilities/agent-powered-workflows-and-operations/code-review)
- [Configuring code review by GitHub Copilot](https://docs.github.com/en/copilot/how-tos/copilot-on-github/set-up-copilot/configure-code-review)
- [Usage-based billing for organizations and enterprises](https://docs.github.com/en/copilot/concepts/billing-and-usage/organizations-and-enterprises/billing)
- [Setting up budgets](https://docs.github.com/en/billing/how-tos/set-up-budgets)
- [GitHub Copilot usage metrics](https://docs.github.com/en/copilot/concepts/billing-and-usage/copilot-usage-metrics/copilot-metrics)
- [REST API endpoints for Copilot usage metrics](https://docs.github.com/en/rest/copilot/copilot-usage-metrics)
- [REST API endpoints for Copilot user management](https://docs.github.com/en/rest/copilot/copilot-user-management)
- [Audit log events for agents](https://docs.github.com/en/copilot/reference/enterprise-administrators/agentic-audit-log-events)
- [Monitoring agentic activity in your enterprise](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/manage-agents/monitor-agentic-activity)
- [Streaming the audit log for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/streaming-the-audit-log-for-your-enterprise)
- [Audit log events for your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/audit-log-events-for-your-enterprise)
- [Application card: GitHub Copilot Agents](https://docs.github.com/en/copilot/responsible-use/agents)
- [GitHub Copilot Trust Center](https://copilot.github.trust.page/)

### Regulatory sources

- [Federal Reserve SR 26-2](https://www.federalreserve.gov/supervisionreg/srletters/sr2602.htm) and [OCC Bulletin 2026-13](https://www.occ.gov/news-issuances/bulletins/2026/bulletin-2026-13.html) (supersede SR 11-7 and OCC 2011-12)
- [Interagency Guidance on Third-Party Relationships: Fed SR 23-4](https://www.federalreserve.gov/supervisionreg/srletters/SR2304.htm), [OCC Bulletin 2023-17](https://www.occ.gov/news-issuances/bulletins/2023/bulletin-2023-17.html), [Federal Register](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management)
- [NYDFS 23 NYCRR Part 500](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500)
- [NYDFS Industry Letter on AI cybersecurity risks](https://www.dfs.ny.gov/industry-guidance/industry-letters/il20241016-cyber-risks-ai-and-strategies-combat-related-risks)
- [OSFI Guideline E-23](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/guideline-e-23-model-risk-management-2027)
- [OSFI Guideline B-10](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/third-party-risk-management-guideline)
- [AMF Third-Party Risk Management Guideline](https://lautorite.qc.ca/en/professionals/deposit-institutions-and-trust-companies/guidelines/operational-risk/third-party-risk-management-guideline)
- [CMN Resolution 4,893/2021 (Brazil)](https://www.bcb.gov.br/content/about/legislation_norms_docs/CMN_Resolution_No_4,893_2021.pdf)
- [EU AI Act, Regulation (EU) 2024/1689](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689) and [Regulation (EU) 2026/1744 (Digital Omnibus on AI)](https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng)
- [DORA, Regulation (EU) 2022/2554](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_28)
- [Commission Delegated Regulation (EU) 2024/1774](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774)
- [GDPR, Regulation (EU) 2016/679](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679)
- [PCI DSS v4.0.1 document library](https://www.pcisecuritystandards.org/document_library/)
