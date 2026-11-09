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

- **The risk:** Agents write, push, and review at machine speed. A poisoned instruction or permissive policy can affect hundreds of repositories; AI vendors can become unmanaged third parties.
- **Our position:** Copilot extends Parts 1-6, never replaces them. Enterprise policy governs model/preview exceptions; agents are untrusted contributors subject to human-code gates.
- **The regulatory frame:** Use third-party/ICT risk and SDLC controls. US SR 26-2 excludes generative AI; OSFI E-23 and the EU AI Act still require applicable governance.
- **The evidence:** IdP-linked seats, available policy/agent audit events, approved session evidence, budget reports, and training records. Record export gaps; session streaming is a preview, not a complete archive.

---

Monday's SIEM dashboard shows 37 weekend PRs from `Copilot`. One edits a workflow; another adds an MCP server. The CISO asks: "Who approved that?"

With Parts 1-6 in place, the answer is boring: independent human review, CODEOWNERS routing, approved workflow execution, scanning, and audit attribution to the session requester.

**Platform guardrails come first.** Copilot policy cannot fix public customer data or unrestricted default-branch pushes. Establish those foundations before governing the AI layer.

**Check current behavior before rollout.** The **Copilot in the cloud** policy covers both Actions and GitHub-hosted sandbox sessions ([Copilot on GitHub.com](https://docs.github.com/en/copilot/concepts/copilot-surfaces/copilot-on-github)). Their enforcement differs. Source dates appear in the references; re-verify features and previews before implementing.

## The requirements

**Applicability:** Default to [GHEC with data residency, including EMU](/blog/github-waf-financial-services/platform-foundation/#choosing-your-deployment-model); GHES comparisons use **3.22**. Apply [centrally governed classification](/blog/github-waf-financial-services/platform-foundation/#data-classification-with-custom-properties): owners cannot downgrade classification to obtain agent access. Matrix mappings mean **contributes to**, not satisfies; second line validates applicability, design, operating evidence, and residual risk.

Previews supplement, never replace, the GA baseline. Follow [feature and preview controls](/blog/github-waf-financial-services/platform-foundation/#feature-availability-and-preview-controls), with a GA alternative or named, expiring risk acceptance. Neither can waive legal duties or contractual production restrictions; [pre-release terms](https://docs.github.com/en/site-policy/github-terms/github-pre-release-license-terms) may limit use to non-production evaluation.

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
| EU-AIACT-26 | [EU AI Act Art. 26](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689) | **Applicable high-risk systems only:** deployer duties include oversight, monitoring, and automatically generated logs under the deployer's control. [Reg. (EU) 2026/1744](https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng) sets 2 Dec 2027 for Art. 6(2)/Annex III systems and 2 Aug 2028 for Art. 6(1)/Annex I systems. Not a blanket coding-assistant or internal-reasoning retention mandate. |
| EU-DORA-28-30 | [DORA Arts. 28-30](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554#art_28) | ICT third-party risk: accountability, concentration risk, contract terms. |
| EU-DORA-RTS-LOGGING | [Reg. (EU) 2024/1774 Art. 12](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774) | Logging within the ICT risk framework. |
| EU-GDPR-44 | [GDPR Art. 44](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679) | Conditions for transferring personal data outside the EU. |
| INT-PCI-6.2 | [PCI DSS v4.0.1 Req. 6.2](https://www.pcisecuritystandards.org/document_library/) | Secure coding, developer training, and code review before release. |
| INT-PCI-12.8 | [PCI DSS v4.0.1 Req. 12.8](https://www.pcisecuritystandards.org/document_library/) | Manage and monitor third-party service providers. |

### Where Copilot fits in your risk framework

Document your second-line-approved risk framing:

- **US:** SR 26-2/OCC 2026-13 exclude generative/agentic AI, not all Copilot governance. Use applicable third-party, security, and SDLC controls rather than credit-model validation.
- **Canada:** OSFI E-23 includes AI/ML from May 1, 2027; inventory and risk-rate Copilot.
- **EU:** A coding assistant is unlikely to be Annex III high-risk; assess its use. Art. 4 already requires measures supporting literacy. Keep training records under the revised Omnibus wording.
- **Everywhere:** GitHub and its model providers are **third parties processing your source code**. That's where examiners start.

**Model governance bridges TPRM and SDLC:** approve providers/data terms, then gate their output like human code.

## Deployment model differences

| Topic | GHEC (personal accounts) | GHEC with EMU | GHEC with data residency (GHE.com) | GHES |
|---|---|---|---|---|
| **Licensing** | Business/Enterprise seats. Users may also hold personal plans, which are cancelled once they receive a Business or Enterprise seat ([policies](https://docs.github.com/en/copilot/concepts/enterprise/policies)). | Managed users [cannot sign up for Copilot Pro or Free](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/understanding-iam-for-enterprises/abilities-and-restrictions-of-managed-user-accounts); seats only via your enterprise. | Same as EMU. | [Not hosted on GHES](https://docs.github.com/en/enterprise-server@3.22/copilot/copilot-on-ghes/about-copilot-on-ghes). Licenses and policies live on your GitHub.com or GHE.com enterprise. |
| **IdP-driven seats** | Enterprise teams (manual membership). | Enterprise teams [synced to IdP groups](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-users-in-your-enterprise/create-enterprise-teams) via SCIM. | Same as EMU. | Via the cloud enterprise account. |
| **Model data boundary** | Global model endpoints. | Global model endpoints. | Optional **Restrict Copilot to data residency compliant models** policy (US and EU regions; +10% AI credits) ([docs](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/github-copilot-with-data-residency)). | Air-gapped Copilot CLI with your own model provider (**technical preview**). |
| **Agent event streaming** | Not available. | Agent session event streaming (**public preview**). | Same as EMU. | Not applicable. |
| **Cloud agents** | Available. | Available, except in managed users' personal repos. | Available. | Not available against GHES repositories. |

Individual-plan interaction data **may** be used for training ([model hosting](https://docs.github.com/en/copilot/reference/ai-models/model-hosting)). Everyone touching company code needs an enterprise-issued seat.

## Rollout prerequisites

Complete these prerequisites **before seats**; pass route-specific runtime tests **before agents**.

### Acceptable use policy and training

**What we do:** No seat without completed training and an acknowledged AI acceptable use policy (AUP).

**Why:** EU-AIACT-4 literacy applies; US-NYDFS-500.14/INT-PCI-6.2 expect training. Include AI social engineering per NYDFS, and champions/feedback per [WAF adoption guidance](https://learn.github.com/well-architected/library/productivity/recommendations/adopting-copilot-at-scale/).

**How:** Cover these minimum requirements:

- Use enterprise-issued seats on company code, never personal plans.
- Keep customer data, credentials, and production extracts out of prompts.
- Hold the requester accountable for output and initial inspection; required approval must be independent.
- Identify approved MCP servers, agents, and models, plus the request process.
- Define permitted dotfiles, personal instructions, and skills.
- Report suspected prompt injection or unexpected agent behavior.

**Verify:** Reconcile LMS completion records with seat-granting IdP groups; retain training records and annual AUP re-attestations.

### Provider approval and model data terms

**What we do:** Approve GitHub and model providers as **ICT third parties**, risk-rated by supported function. Institution criticality differs from regulatory critical-provider designation.

**Why:** US-NYDFS-500.11, US-3PRM-2023, CA-OSFI-B10, CA-AMF-TPRM, EU-DORA-28-30, BR-CMN-4893, and INT-PCI-12.8 govern third-party risk. Apply Part 1's [provider register, assurance, and exit framework](/blog/github-waf-financial-services/platform-foundation/#provider-exit-and-concentration-risk), adding:

- **Training and retention terms:** GitHub does not train on Business/Enterprise customer data; [model hosting](https://docs.github.com/en/copilot/reference/ai-models/model-hosting) lists provider-specific retention. Record each approved model's provider, data commitment, approver, and date.
- **Region:** On GHE.com, enable **Restrict Copilot to data residency compliant models** when the transfer analysis (EU-GDPR-44) requires in-region inference.
- **Assurance:** Request SOC reports, ISO/IEC 42001, and the Copilot-scoped PCI DSS attestation/shared responsibility matrix from the [Copilot Trust Center](https://copilot.github.trust.page/). Verify current service and report-period coverage.
- **Model documentation:** Attach the [agents application card](https://docs.github.com/en/copilot/responsible-use/agents) (intended uses, limitations, evaluations) to the AI inventory.
- **AI exit:** Test model substitution, policy export, evidence portability, and continued SDLC gates without Copilot.

**Verify:** Refresh assurance annually and review data terms with every model approval. Monthly, diff the model register against Configure models.

### Licensing and budgets

Choose and document the plan ([Copilot plans](https://docs.github.com/en/copilot/get-started/plans#organization-and-enterprise-plans)). Seats determine user policy, not just billing:

| Plan | Seat price | Included AI credits | Notable difference |
|---|---|---|---|
| Copilot Business | $19/user/month | 1,900 per user, pooled | Baseline organizational plan |
| Copilot Enterprise | $39/user/month | 3,900 per user, pooled | More credits plus priority access to new models and features |
| Copilot access | $0 for GHEC-licensed users ($10 standalone) | None; metered from first use | Same features as Enterprise; cannot coexist with Business/Enterprise in one enterprise |

Both Business and Enterprise provide policies, audit logs, exclusions, org instructions, and code review today. Choose for **credits and early access**, not those controls.

Set budgets before granting access:

- Business/Enterprise credits are **pooled**; additional usage is **enabled by default** ([billing](https://docs.github.com/en/copilot/concepts/billing-and-usage/organizations-and-enterprises/billing)). Approve that spending explicitly.
- Assign cost centers per business unit and user-level budgets. Route alerts to accountable owners and document threshold responses.
- A **Bundled AI credits budget** with "Stop usage" can block AI Scan and agentic autofix ([budgets](https://docs.github.com/en/billing/how-tos/set-up-budgets)). Give Code Security its own SKU-level budget so chat usage cannot starve a security control.
- Inline suggestions consume no credits; a budget stop degrades features rather than removing Copilot entirely. The WAF's [AI credits guidance](https://learn.github.com/well-architected/library/governance/recommendations/managing-ai-credits/) favors enterprise alerts over hard stops that halt critical work.

**Verify:** Review usage against budgets monthly.

### Seat assignment

Grant seats only through **IdP-managed groups** for least privilege and joiner/mover/leaver discipline (US-NYDFS-AI-2024, US-3PRM-2023). Team assignment also improves metrics granularity:

1. Create an enterprise team per access tier (for example `copilot-standard`, `copilot-agents-pilot`).
2. On EMU or GHE.com, [sync each team to an IdP group](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/provisioning-user-accounts-with-scim/managing-team-memberships-with-identity-provider-groups). Sync stops above 5,000 members.
3. [Assign seats to the enterprise team](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/manage-access/grant-access) (Business or Copilot access). For Copilot Enterprise, enable it per org and have org owners assign seats to IdP-synced org teams.
4. Make **training completion a prerequisite** for group membership: LMS feeds IdP, IdP feeds GitHub.

**Verify:** Monthly, reconcile `gh api /enterprises/{enterprise}/copilot/billing/seats --paginate` ([REST docs](https://docs.github.com/en/rest/copilot/copilot-user-management)) with IdP groups; untraceable seats are findings. Attribution comes from `copilot.cfb_seat_assignment_created` and `copilot.cfb_seat_assignment_unassigned` ([audit events](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/audit-log-events-for-your-enterprise)).

## Policy hierarchy: lock it at the enterprise

**What we do:** Set compliance policies to enterprise **Enabled** or **Disabled**, never "Let organizations decide." Separate AI administration from broad enterprise-owner access.

**Why:** Conflicting multi-org policies usually resolve to the **least restrictive** ([Copilot policies](https://docs.github.com/en/copilot/concepts/enterprise/policies)). One permissive org can loosen user controls. [WAF](https://learn.github.com/well-architected/library/governance/recommendations/governing-agents/) recommends enterprise non-negotiables with org autonomy inside them.

**How:**

- Configure policies under **Enterprise > AI controls**, which has separate Agents, Copilot, and MCP pages ([Managing policies for your enterprise](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/manage-enterprise-policies)).
- Set **Policies for enterprise-assigned users** explicitly, since "Let organizations decide" doesn't cover users who get seats directly from the enterprise.
- The [AI managers custom role](https://docs.github.com/en/copilot/tutorials/roll-out-at-scale/govern-at-scale/establish-ai-managers) is **preview**, not the enforcing baseline. Until GA and approved, limited enterprise owners apply independently approved changes; reviewers receive minimum necessary evidence. Preview evaluation needs terms, risk owner, expiry, and a retained GA control.

**Verify:** Alert on `copilot.cfb_enterprise_settings_changed` and `copilot.cfb_org_settings_changed`; quarterly, review enterprise-owner/AI-manager membership and policy drift.

## Feature and model policies: allow by exception

**What we do:** New features/models stay **off until reviewed**, with an explicit allowlist and approval record.

**Why:** Providers and data terms differ (US-3PRM-2023, CA-OSFI-B10, EU-DORA-28-30); CA-OSFI-E23 requires explainable model changes. The [governing agents checklist](https://learn.github.com/well-architected/library/governance/recommendations/governing-agents/) also requires review before enablement.

**How:** Two enterprise policies control what happens to things you haven't configured ([About default availability](https://docs.github.com/en/copilot/concepts/enterprise/default-availability)):

| Policy | Our setting | Effect |
|---|---|---|
| Default policy for new features and clients | **Disabled everywhere** | Unconfigured GA features stay off; orgs can't enable them |
| Default availability for released models | **Disabled** | New GA models stay off until you configure them |

Pre-GA models, open-weight models, and those outside GitHub's retention agreement stay disabled **regardless**. Keep them off without risk approval. [Model hosting](https://docs.github.com/en/copilot/reference/ai-models/model-hosting) lists an Anthropic family retaining prompts and outputs for safety classifiers: a concrete TPRM concern.

Leave **Opt in to preview features** off outside a designated sandbox org ([organization policies](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-organization/manage-policies)). Previews may change or disappear; they are not dependable production controls.

In **Configure models**, enable approved models, disable others, and target additional org needs ([model availability](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/manage-availability-of-default-models)). Enterprise-team model targeting is opt-in **preview**.

The "Suggestions matching public code" policy still exists. Set it per legal guidance, but don't present it to auditors as a security control.

**Verify:** Reconcile settings with the [approved model register](#provider-approval-and-model-data-terms) monthly. Changes appear as `copilot.cfb_enterprise_settings_changed`.

## AI data, session access, and privacy

**What we do:** Classify **prompts, responses, logs, attachments, and generated PRs at the highest classification of their source context**. Copying a private source into an internal repository does not make it safe.

**Why:** Session access and telemetry create additional disclosure paths (US-NYDFS-500.11, US-NYDFS-AI-2024, EU-GDPR-44). Repository privacy alone does not govern every AI surface.

**How:**

- **Admission:** Exclude Confidential, Restricted, and unclassified repositories until governance verifies visibility, approved repo/context scope, isolation, and retention. Never mix restricted context with lower-control repositories or broadly readable outputs. Disable unproven paths; exclusions cannot replace access control.
- **Readers:** [Actions sessions](https://docs.github.com/en/copilot/concepts/security-governance-and-network-settings/session-data) default to shared with repository readers; sandbox sessions default to unshared. Confidential/Restricted work needs supported unshared sessions, private repositories, and minimum authorized membership, or a blocked path. Internal readers may lack business need. Don't assume an enterprise switch makes every Actions session private.
- **Local/multi-repo sharing:** Disable Confidential/Restricted local cloud sync unless approved; prohibit sensitive local/sandbox sharing. Every recipient must be authorized for **every source repository in context**, otherwise do not share.
- **Telemetry privacy:** Classify collectors/SIEM and archives for code, prompts, personal data, and secrets before activation. Privacy/security approval must cover purpose, retention/deletion, least privilege, encryption, region/subprocessors, redaction, and payload tests. Complete a **DPIA where GDPR Art. 35 applies**, plus applicable employee notice and works-council/worker consultation. Neither assessment nor consultation universally follows from logging; identity-only telemetry can still be personal data. Keep broad prompt/response capture off without specific justification and approval.

**Verify:** Quarterly and after visibility/membership changes, test unauthorized enterprise-member access, including shared/resumed sessions and multi-repo outputs. Record actual deletion/retention behavior; UI archive is not immutable retention. [Evidence operations](#usage-metrics-and-audit-log-evidence) handle lawful capture and unavailable exports.

## Content exclusion: a guardrail, not DLP

**What we do:** [Exclude sensitive paths](https://docs.github.com/en/copilot/concepts/security-governance-and-network-settings/content-exclusion): keys, production-like fixtures, and regulated config. This is **not DLP**.

**Why:** Exclusion reduces accidental exposure (EU-GDPR-44, US-NYDFS-AI-2024), with documented limits:

- "Content exclusion is not a filesystem security boundary." It's "not guaranteed to be respected by third-party MCP servers or clients."
- Copilot may still use semantic information from excluded files that the IDE supplies indirectly (types, hover definitions, build config).
- In IDE, CLI, and app agents, it checks identifiable file paths but "might not detect indirect file access."
- It doesn't apply to symlinks or repositories on remote filesystems. Some clients lack chat support (Xcode and Eclipse at the time of writing).

**How:** Set enterprise exclusions for universally sensitive paths, then org/repo rules ([setup](https://docs.github.com/en/copilot/how-tos/configure-content-exclusion/exclude-content-from-copilot)). [Part 1](/blog/github-waf-financial-services/platform-foundation/) and [Part 4](/blog/github-waf-financial-services/secrets-protection/) remain the boundary: no customer data or secrets in repositories.

**Verify:** Alert on `copilot.content_exclusion_changed` ([reviewing changes](https://docs.github.com/en/copilot/how-tos/configure-content-exclusion/review-changes)). Spot-test exclusions in each supported IDE after changes.

**Prompt-data control:** AUP cannot stop pasted production extracts. Use managed endpoints, enterprise-only accounts, sanitized data, scoped repo/filesystem credentials, and egress controls. Count endpoint/proxy DLP only after testing actual IDE, CLI, browser, upload, and MCP routes, including encryption and transformations. Exclusions and secret scanning miss prompts.

For incomplete coverage, the **data owner and CISO delegate** need named acceptance: second-line/privacy approval, clients/data classes, expiry, monitoring, and remediation. Acceptance cannot legalize prohibited disclosure. Disable client/agent paths handling customer NPI, PCI data, or Restricted work until boundaries exist. Test synthetic data, never customer records.

## Governing Copilot in the cloud and its agents

Write access, network access, and issue-text prompts make agents a different contributor risk.

### Who can use it

**What we do:** Enable **Copilot in the cloud** for selected organizations only, pilot first, and keep **third-party agents** (Claude, Codex) disabled until reviewed.

**Why:** [Third-party agents](https://docs.github.com/en/copilot/concepts/agent-capabilities/about-agents/about-third-party-coding-agents) are **public preview** and add providers requiring change/TPRM review (US-3PRM-2023, EU-DORA-28-30).

**How:** In **AI controls > Copilot > Configure features & clients**, choose **Enabled for selected organizations** ([managing Copilot in the cloud](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/manage-agents/manage-copilot-in-the-cloud)). This also enables cloud sandboxes, which can't be disabled separately. Only users with write access can trigger the agent.

Apply the [AI data/session policy](#ai-data-session-access-and-privacy) to each route, not just the organization toggle.

### Where it runs: sandbox vs. Actions

Sessions use **cloud sandboxes** (default where selectable) or **Actions** ([sandbox docs](https://docs.github.com/en/copilot/concepts/security-governance-and-network-settings/about-cloud-sandboxes)). Issue assignment and PR `@Copilot` mentions still use Actions:

| Control | Cloud sandbox | GitHub Actions |
|---|---|---|
| Agent firewall | Bash-originated processes only; not a general MCP perimeter | Same limitation; setup processes also outside direct coverage |
| `copilot-setup-steps.yml`, OIDC, self-hosted runners | No | Yes |
| Managed settings `permissions` and MCP allow/deny | Supported | **Not supported** |
| Multi-repo sessions | Yes | No |
| Session visibility | Unshared by default | Shared with repo readers |

Sandbox **dotfiles** can import personal instructions, skills, and agents. Apply the AUP and [configuration policy](#ai-configuration-governance).

**Actions-path decision:** Managed MCP allowlists do **not** cover Actions. Disable that agent route for Confidential/Restricted repos; permit only tested sandbox/client routes with restricted credentials. Cloud enablement exposes both routes. An AUP saying “sandbox” does not disable Actions.

If route restriction is unenforceable, disable affected organizations' cloud-agent access. Lower-classification exceptions need **AI service owner and data owner** acceptance, expiry, and second-line approval. Review repo/custom-agent MCP definitions, remove unauthorized servers, isolate credentials, independently control supported egress, and monitor drift. Never grant production OIDC or broad enterprise tokens to setup.

Sandboxes also have a custom-profile managed-MCP exception. Apply [custom-agent runtime restrictions](#custom-agents-instructions-and-skills). Approve no route before its controls pass negative tests.

### Network: firewall on, enforced at the org

**What we do:** Enforce the [agent firewall](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-the-firewall) at the org level and disable repository custom rules. Internal registries go on the org allowlist.

**Why:** Reduce exfiltration (EU-DORA-28-30, US-NYDFS-AI-2024). The firewall covers agent Bash processes, **not MCP or setup**; sophisticated attacks may bypass it. It's a layer, not a perimeter.

**How:** **Org settings > Copilot > Internet access**: Enable firewall = **Enabled**; Allow repository custom rules = **Disabled**. Code review has its own section on the same page. If you proxy agent traffic, consider disabling the recommended allowlist and allowing only your artifact mirror.

### Branches, rulesets, and human review

**What we do:** Agents never approve, merge, or receive ruleset exemptions.

**Why:** Segregation of duties (INT-PCI-6.2, US-NYDFS-AI-2024) and the human-oversight principle behind EU-AIACT-26. The WAF calls exempting agent changes from existing checks an explicit anti-pattern.

**How:** The [risks and mitigations](https://docs.github.com/en/copilot/concepts/security-governance-and-network-settings/risks-and-mitigations) page documents the baseline:

- The agent pushes only to its own `copilot/` branch (or the PR branch it was invoked on) and obeys rulesets and branch protection.
- It can't mark PRs ready for review, approve, or merge, and the person who requested the PR **can't approve it**.
- **Additional approval for unattributed Copilot PRs** defaults on but is **public preview** ([rules docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)). Keep GA independent required-human-review on all regulated changes; requesters cannot supply that approval.
- Commits are signed, co-authored by the requester, and link to session logs.

Layer [Part 3's rulesets](/blog/github-waf-financial-services/change-control/) and [AI configuration governance](#ai-configuration-governance) on top.

### CI on agent pull requests

**What we do:** Keep **Require approval for workflow runs** on. Inspect the diff, especially `.github/workflows/`, before agent-branch execution.

**Why:** GitHub warns that turning this off "may allow unreviewed code written by Copilot to gain write access to your repository or access your GitHub Actions secrets" ([agent settings](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/configuring-agent-settings)). That's a [Part 6](/blog/github-waf-financial-services/actions-hardening/) risk in an AI costume.

**How:** Prohibit disabling this setting and monitor repo-admin changes. Approved agent PRs face all required checks, code scanning, and secret scanning.

### The agent is an untrusted contributor

Issue bodies, PR comments, and fetched content invite **prompt injection**. GitHub filters hidden characters and ignores non-writer comments. Still design for successful injection:

- **Secrets:** Grant only the **Agents secrets** a task needs. Everything else stays in Actions secrets, which Copilot can't read.
- **Runners:** GitHub-hosted or ephemeral self-hosted, pinned org-wide via a [runner label](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-organization/configure-runner-for-coding-agent).
- **IP allowlists:** apply Part 1's [network boundary](/blog/github-waf-financial-services/platform-foundation/#network-boundaries-ip-allow-lists) through [Part 6's runner implementation](/blog/github-waf-financial-services/actions-hardening/). Authorized Actions agents need larger hosted runners with approved static egress or ephemeral self-hosted runners behind approved NAT. Standard hosted runners do not meet that baseline; disable paths without compliant egress.
- **Setup token:** Minimal `permissions` in `copilot-setup-steps.yml`. This doesn't change the agent's own token.
- **Automations:** For event-triggered automations, limit tools and write scope to "Only this issue," and keep untrusted-user events ignored (the default).

**Verify:** Quarterly, sample firewall, workflow approval, and protected-path coverage. Continuously alert on `actor_is_agent` pushes touching workflows/agent config, per WAF's SIEM signals.

## AI configuration governance

**What we do:** Govern instructions, agents, skills, hooks, prompts, MCP definitions, and managed settings as **production code**: owners, independent review, tests, catalogs, and drift checks.

**Why:** Poisoned or stale configuration changes behavior across repos. WAF's [shared knowledge](https://learn.github.com/well-architected/library/governance/recommendations/agentic-shared-knowledge/) and [engineering system](https://learn.github.com/well-architected/library/governance/recommendations/agentic-engineering-system-on-github/) guidance extends SDLC hygiene to shared context (INT-PCI-6.2).

**How:** Keep enterprise agents and `copilot/managed-settings.json` in `.github-private` ([managed settings setup](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/use-managed-settings/get-started)). [Create the AI controls ruleset](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/manage-agents/prepare-for-custom-agents); it also blocks org-owner edits to org agents unless its target is narrowed.

Protect repository configuration with CODEOWNERS and **Require review from Code Owners**, per the [guardrails tutorial](https://docs.github.com/en/copilot/tutorials/cloud-agent/build-guardrails). Paths follow the [customization cheat sheet](https://docs.github.com/en/copilot/reference/customization-cheat-sheet):

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

Keep approved model/MCP/agent catalogs and test changes in sandbox repositories before enterprise release. Configuration review controls edits, not runtime data access.

**Verify:** Retain PR approvals, Git history, and ruleset bypass events. Quarterly, review owners, protected-path coverage, and managed settings against approved catalogs; monitor drift continuously.

## MCP servers: scoped allowlists, not a global perimeter

**What we do:** Allow MCP servers by exception via `allowedMcpServers` in `managed-settings.json`, not registry restriction.

**Why:** MCP adds data paths and often third parties (EU-DORA-28-30, US-NYDFS-500.11). GitHub recommends managed settings over **public-preview** registry restriction ([allowlist docs](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-mcp-usage/configure-enterprise-allowlist)). Neither is a global perimeter.

**How:** Use the [protected managed settings file](#ai-configuration-governance). This **illustrative fragment** requires approved endpoints and client-specific enforcement tests; it is not a runnable security boundary:

```json
{
  "permissions": {
    "disableBypassPermissionsMode": "disable",
    "deny": ["Read(~/.ssh/**)"],
    "allow": ["Shell(npm test *)"],
    "ask": ["Shell(git push *)"]
  },
  "allowedMcpServers": [
    { "serverUrl": "https://mcp.internal.example-bank.com/approved-endpoint" }
  ],
  "deniedMcpServers": [
    { "serverCommand": ["npx", "-y", "@modelcontextprotocol/server-filesystem", "/"] }
  ]
}
```

`allowedMcpServers` blocks unmatched connectors too. The [managed settings reference](https://docs.github.com/en/copilot/reference/enterprise-administrators/enterprise-managed-settings) documents gaps:

- MCP allow/deny lists **don't apply** to Actions-based cloud sessions or to `mcp-servers` defined in custom agent profiles.
- CODEOWNERS protects edits, not network calls; the Bash firewall does **not directly cover MCP server processes**. Unsupported routes require independently governed credential/egress isolation and explicit acceptance, or disabling. Managed settings plus firewall are not a universal allowlist.
- Repository MCP settings on GitHub apply to **both** the cloud agent and code review.

**Verify:** Negative-test each route after changes and quarterly against the approved MCP register. Alert on `mcp_registry.*` audit events if using the registry for discovery.

**Permission patterns are not security boundaries.** `Shell(rm -rf *)` misses equivalent syntax, wrappers, and file APIs; `Shell(npm test *)` executes project-controlled scripts. Use narrow allow/ask rules plus filesystem permissions, sandboxing, least-privilege tokens, and network policy. Test synthetic-file bypasses; string matching cannot prevent arbitrary destruction or exfiltration.

## Custom agents, instructions, and skills

Apply [shared configuration governance](#ai-configuration-governance), then test runtime behavior:

- Keep **organization instructions** short and non-negotiable; put detail in repo/path-specific files.
- Scope GitHub MCP credentials narrowly when [expanding custom-agent context](https://learn.github.com/well-architected/library/architecture/recommendations/expanding-enterprise-custom-agents-context/); govern them under [Part 4](/blog/github-waf-financial-services/secrets-protection/).
- Custom-profile `mcp-servers` bypass managed MCP allow/deny lists. Review or prohibit profiles and personal dotfiles that introduce unapproved servers; test actual runtime access, not just catalog membership.
- Test head-branch instruction changes against code review; approved catalogs alone cannot prevent self-influence.

## Copilot code review: advisory, never the approver

**What we do:** Automatically review high-risk repos; set **Allow Copilot to approve pull requests** to **Disabled everywhere**. AI review is advisory, never a required approval.

**Why:** Segregation of duties (INT-PCI-6.2). [Copilot approvals](https://docs.github.com/en/copilot/concepts/agent-capabilities/agent-powered-workflows-and-operations/code-review) can satisfy required-review rules like human approvals. Review uses **PR-head instructions/skills**, letting a PR influence its own reviewer.

**How:** Target high-risk repos with an enterprise branch ruleset's **Automatically request Copilot code review** ([setup](https://docs.github.com/en/copilot/how-tos/copilot-on-github/set-up-copilot/configure-code-review)). Set default/maximum effort; enable **Block reviews requested with an external Copilot license**. Excluded files aren't reviewed.

**Verify:** Quarterly, confirm the approval policy still reads Disabled everywhere.

## Usage metrics and audit log evidence

**What we do:** Collect **minimum approved evidence**, attribute activity to accountable humans, and archive by classification. Do not indiscriminately stream prompts or code.

**Why:** **No cited rule mandates blanket retention of AI internal reasoning.** [DORA RTS Art. 12](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1774) addresses ICT logging; NYDFS 500.6 addresses applicable transaction/cybersecurity trails. AI Act Art. 26 covers qualifying high-risk systems' generated logs under deployer control, not every assistant transcript or hidden reasoning.

**How:**

| Evidence source | What it gives you | Notes |
|---|---|---|
| [Agent audit log fields](https://docs.github.com/en/copilot/reference/enterprise-administrators/agentic-audit-log-events) | `actor_is_agent`, `agent_session_id`, `user` (the human) | `actor:Copilot` filter covers 180 days in the UI |
| [Audit log streaming](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/streaming-the-audit-log-for-your-enterprise) | Policy, seat, and repo events | Agent session event streaming is **public preview**, EMU and GHE.com only; scheduled GA audit API/export collection is the fallback for documented available events |
| Copilot usage records streaming/API | Content-bearing usage records where supported | **Public preview**; validate actual fields, coverage, terms, and privacy approval. Not a complete transcript archive or sole control. |
| [Usage metrics API](https://docs.github.com/en/rest/copilot/copilot-usage-metrics) | Adoption, per-user and per-repo activity | Up to 1 year of history |
| OpenTelemetry via managed settings | Supported client-side telemetry, not every agent route | Start with `capture.identity` only and content capture off; test payloads per client/harness ([managed settings reference](https://docs.github.com/en/copilot/reference/enterprise-administrators/enterprise-managed-settings)) |

Pull a quick sample for your evidence binder:

```bash
gh api "/enterprises/YOUR-ENTERPRISE/audit-log?phrase=actor:Copilot&per_page=100" \
  --jq '.[] | {action, user, agent_session_id, created_at: .["@timestamp"]}'
```

**Export gap:** Validate coverage with GitHub before rollout; don't assume supported cloud-transcript bulk export. UI sessions, audit events, usage records, and client telemetry are distinct sources. Metrics and metadata cannot reconstruct every prompt, tool result, or rationale. Documented local export does not prove cloud bulk export.

For **each regulated agent-authored change**, retain approved task/instruction versions, requester, session ID, source/head SHA, diff, human review rationale, checks, and deployment decision. Capture reviewer-authored UI spot checks before deletion/provider expiry where supported. Record missing content; never scrape unsupported interfaces or call partial capture a full transcript.

The **AI service owner** records routes, unavailable fields, collection latency, owner, expiry, and second-line decision in the gap register. Disable workflows whose applicable obligations require unavailable evidence until a suitable control exists.

Apply the [AI data/session privacy policy](#ai-data-session-access-and-privacy) to capture, redaction, and lawful access, and Part 1's [retention and integrity standard](/blog/github-waf-financial-services/platform-foundation/#evidence-retention-and-integrity) to the archive. Retain agent change packs and checks at merge. Record-specific retention floors do not create a universal duty to store AI conversations.

**Verify:** Daily, reconcile regulated changes with agent PRs/audit activity; failed collection is a gap. Monthly, test payload minimization, access, retention, and known-session evidence. Quarterly, record transcript spot checks and negative-test unsupported Actions/custom-profile routes. Missing transcripts remain gaps, not successful exports.

## Control matrix

| Control | Requirement IDs | GitHub feature | Evidence | Cadence |
|---|---|---|---|---|
| IdP-driven seat assignment | US-NYDFS-AI-2024, US-3PRM-2023 | Enterprise teams synced to IdP groups | Seat export vs. IdP group; `copilot.cfb_seat_*` events | Monthly |
| Enterprise-locked policies | US-NYDFS-AI-2024, CA-OSFI-E23 | AI controls; independently reviewed changes by restricted GA owner roles | Settings alerts; role/approval review | Continuous / quarterly |
| Allow-by-exception features and models | US-3PRM-2023, CA-OSFI-B10, CA-OSFI-E23, EU-DORA-28-30 | Default availability policies; Configure models | Model register; settings diff | Monthly |
| Vendor due diligence and data boundary | US-NYDFS-500.11, US-3PRM-2023, CA-OSFI-B10, CA-AMF-TPRM, BR-CMN-4893, EU-DORA-28-30, EU-GDPR-44, INT-PCI-12.8 | Trust Center; model hosting docs; data residency model policy (GHE.com) | TPRM file; SOC/ISO reports; policy state | Annual / quarterly |
| Prompt-data boundaries, exclusion supplemental | US-NYDFS-AI-2024, EU-GDPR-44 | Managed endpoints, tested DLP/egress, scoped data access; exclusions not DLP | Synthetic leak tests; accepted-gap register; disabled-path evidence | Per client change; quarterly |
| Agent enablement and firewall | US-3PRM-2023, EU-DORA-28-30, US-NYDFS-AI-2024 | Copilot in the cloud for selected orgs; third-party agents off; org-enforced firewall | Policy state; org settings sample | Quarterly |
| Human review of agent work | INT-PCI-6.2; EU-AIACT-26 only if applicable | GA required independent human review, CODEOWNERS, workflow approval, Copilot approvals disabled; unattributed-PR preview supplemental | Ruleset export; PR approval history; settings sample | Quarterly |
| MCP and agent config governance | US-NYDFS-500.11, EU-DORA-28-30, INT-PCI-6.2 | Managed allowlists on supported routes; protected config; unsupported routes blocked or accepted with independent isolation | Path-specific negative tests; approved server/risk register | Per config change; quarterly |
| AI data/session privacy and context boundaries | US-NYDFS-500.11, EU-GDPR-44 | Highest-source classification; approved private/unshared routes and local sync; privacy-approved destinations | Shared/resumed and multi-repo unauthorized-reader tests; retention tests; conditional DPIA/worker consultation | Before activation; quarterly; on visibility/membership change |
| Budgets and alerts | US-3PRM-2023 | Budgets, cost centers, SKU budgets | Usage reports; alert log | Monthly |
| Agent change evidence (not internal reasoning) | EU-DORA-RTS-LOGGING, US-NYDFS-500.14; EU-AIACT-26 only if applicable | GA audit exports; PR/change records; approved supported telemetry; previews supplemental | Hashed evidence packs; coverage/gap register; privacy approval | Daily reconciliation; quarterly spot checks |
| Training and AUP | EU-AIACT-4, US-NYDFS-500.14, INT-PCI-6.2 | IdP group gated on LMS | Completion records; attestations | Annual |

## Summary and key takeaways

Copilot governance is **platform governance with new nouns**: agents are contributors, instructions are code, models are vendors, MCP servers are integrations. Extend Parts 1-6 rather than bypassing them.

Your checklist:

- [ ] Confirm Parts 1-6 controls apply to agent PRs with no exemptions
- [ ] Complete AUP/training, provider approval, licensing, and budgets before IdP-driven seat assignment
- [ ] Lock compliance-relevant policies at the enterprise; disable both default availability policies
- [ ] Maintain a model register tied to provider data terms, and a complete TPRM file
- [ ] Use content exclusion as defense in depth, and say so in writing
- [ ] Enable Copilot in the cloud for selected orgs; keep third-party agents off until reviewed
- [ ] Enforce the agent firewall, workflow approval, and CODEOWNERS on agent and MCP config
- [ ] Test managed MCP allowlists by route; block unsupported sensitive paths or obtain named, expiring risk acceptance with independent isolation
- [ ] Keep Copilot approvals Disabled everywhere
- [ ] Configure budgets, including a separate Code Security budget
- [ ] Classify all AI outputs at the highest source level; block sensitive/unclassified routes until access, isolation, and retention pass tests
- [ ] Restrict session readers and multi-repo sharing; negative-test shared/resumed access
- [ ] Approve telemetry privacy, destination classification, and tested DLP coverage before activation
- [ ] Archive agent change evidence and merge-time checks; record transcript/export gaps without inventing a reasoning-retention mandate

Previous: [Part 6: CI/CD and GitHub Actions Hardening](/blog/github-waf-financial-services/actions-hardening/). Next: [The Leadership Brief](/blog/github-waf-financial-services/leadership-brief/), which rolls the whole series up for CIOs, CISOs, and senior leaders.

## References

### Source notes

Product documentation was checked November 5, 2026; [Copilot on GitHub.com](https://docs.github.com/en/copilot/concepts/copilot-surfaces/copilot-on-github) records the October 28 consolidation into **Copilot in the cloud**. Regulatory authorities were checked November 6:

- [SR 26-2](https://www.federalreserve.gov/supervisionreg/srletters/sr2602.htm) replaced SR 11-7 on **April 17, 2026**; [OCC 2026-13](https://www.occ.gov/news-issuances/bulletins/2026/bulletin-2026-13.html) replaced OCC 2011-12. Both exclude generative/agentic AI.
- [OSFI E-23](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/guideline-e-23-model-risk-management-2027) includes AI/ML from **May 1, 2027**. [AMF's guideline](https://lautorite.qc.ca/en/professionals/deposit-institutions-and-trust-companies/guidelines/operational-risk/third-party-risk-management-guideline) starts **April 1, 2027**, with transitional treatment for existing contracts.
- [Reg. (EU) 2026/1744](https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng) revises the already-applicable literacy duty and sets **December 2, 2027** for Art. 6(2)/Annex III high-risk systems, **August 2, 2028** for Art. 6(1)/Annex I systems. These are future dates, not current blanket coding-assistant duties.
- [Unattributed Copilot PR approval](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets) was confirmed **public preview** November 6, 2026; GA independent human review remains the baseline.

### Further reading

Authorities are linked in [the requirements](#the-requirements); implementation sources sit beside their controls. These additional references cover related patterns and coverage checks:

- [Agentic governance taxonomy](https://learn.github.com/well-architected/library/governance/recommendations/agentic-governance-taxonomy/) and [measuring GenAI impact](https://learn.github.com/well-architected/library/scenarios/measuring-genai-impact/).
- [gh-aw and APM governance](https://learn.github.com/well-architected/library/governance/recommendations/governing-agentic-workflows/): for AI inside Actions workflows, keep the LLM without write permissions and let a deterministic step act only on validated output.
- [Copilot plans](https://docs.github.com/en/copilot/get-started/plans), [policy-supported surfaces](https://docs.github.com/en/copilot/reference/supported-surfaces-for-policies), and [registry restriction](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-mcp-usage/restrict-based-on-registry) (public preview, not our baseline).
- [Copilot metrics definitions](https://docs.github.com/en/copilot/concepts/billing-and-usage/copilot-usage-metrics/copilot-metrics) and [monitoring agentic activity](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/manage-agents/monitor-agentic-activity).
- Interagency TPRM companion authorities: [OCC 2023-17](https://www.occ.gov/news-issuances/bulletins/2023/bulletin-2023-17.html) and [Federal Register publication](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management).
